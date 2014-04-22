'use strict';

var mongoose = require('mongoose'),
	natural = require('natural'),
	_ = require('underscore');

module.exports = function(schema, options) {
	var stemmer = natural[options.stemmer || 'PorterStemmer'],
		distance = natural[options.distance || 'JaroWinklerDistance'],
		fields = options.fields,
		keywordsPath = options.keywordsPath || '_keywords',
		relevancePath = options.relevancePath || '_relevance';

	// init keywords field
	var schemaMixin = {};
	schemaMixin[keywordsPath] = [String];
	schemaMixin[relevancePath] = Number;
	schema.add(schemaMixin);
	schema.path(keywordsPath).index(true);

	// search method
	schema.statics.search = function(query, fields, options, callback) {
		if (arguments.length === 2) {
			callback = fields;
			options = {};
		} else {
			if (arguments.length === 3) {
				callback = options;
				options = {};
			} else {
				options = options || {};
			}
		}

		var self = this;
		var tokens = _(stemmer.tokenizeAndStem(query)).unique(),
			conditions = options.conditions || {},
			outFields = {_id: 1},
			findOptions = _(options).pick('sort');

		conditions[keywordsPath] = {$in: tokens};
		outFields[keywordsPath] = 1;

		mongoose.Model.find.call(this, conditions, outFields, findOptions,
		function(err, docs) {
			if (err) return callback(err);

			var totalCount = docs.length,
				processMethod = options.sort ? 'map' : 'sortBy';

			// count relevance and sort results if sort option not defined
			docs = _(docs)[processMethod](function(doc) {
				var relevance = processRelevance(tokens, doc.get(keywordsPath));
				doc.set(relevancePath, relevance);
				return processMethod === 'map' ? doc : -relevance;
			});

			// slice results and find full objects by ids
			if (options.limit || options.skip) {
				options.skip = options.skip || 0;
				options.limit = options.limit || (docs.length - options.skip);
				docs = docs.slice(options.skip || 0, options.skip + options.limit);
			}

			var docsHash = _(docs).indexBy('_id'),
				findConditions = _({
					_id: {$in: _(docs).pluck('_id')}
				}).extend(options.conditions);

			var cursor = mongoose.Model.find
			.call(self, findConditions, fields, findOptions);

			// populate
			if (options.populate) {
				options.populate.forEach(function(object) {
					cursor.populate(object.path, object.fields);
				});
			}

			cursor.exec(function(err, docs) {
				if (err) return callback(err);

				// sort result docs
				callback(null, {
					results: _(docs)[processMethod](function(doc) {
						var relevance = docsHash[doc._id].get(relevancePath);
						doc.set(relevancePath, relevance);
						return processMethod === 'map' ? doc : -relevance;
					}),
					totalCount: totalCount
				});
			});
		});

		function processRelevance(queryTokens, resultTokens) {
			var relevance = 0;

			queryTokens.forEach(function(token) {
				relevance += tokenRelevance(token, resultTokens);
			});
			return relevance;
		}

		function tokenRelevance(token, resultTokens) {
			var relevanceThreshold = 0.5,
				result = 0;

			resultTokens.forEach(function(rToken) {
				var relevance = distance(token, rToken);
				if (relevance > relevanceThreshold) {
					result += relevance;
				}
			});

			return result;
		}
	};

	// set keywords for all docs in db
	schema.statics.setKeywords = function(callback) {
		callback = _(callback).isFunction() ? callback : function() {};

		mongoose.Model.find.call(this, {}, function(err, docs) {
			if (err) return callback(err);

			if (docs.length) {
				var done = _.after(docs.length, function() {
					callback();
				});
				docs.forEach(function(doc) {
					doc.updateKeywords();

					doc.save(function(err) {
						if (err) console.log('[mongoose search plugin err] ', err, err.stack);
						done();
					});
				});
			} else {
				callback();
			}
		});
	};

	schema.methods.updateKeywords = function() {
		this.set(keywordsPath, this.processKeywords());
	};

	schema.methods.processKeywords = function() {
		var self = this;
		return _(stemmer.tokenizeAndStem(fields.map(function(field) {
			var val = self.get(field);

			if (_(val).isString()) {
				return val;
			}
			if (_(val).isArray()) {
				return val.join(' ');
			}

			return '';
		}).join(' '))).unique();
	};

	schema.pre('save', function(next) {
		var self = this;

	    var isChanged = this.isNew || fields.some(function (field) {
	      return self.isModified(field);
	    });

	    if (isChanged) this.updateKeywords();
	    next();
	});
};
