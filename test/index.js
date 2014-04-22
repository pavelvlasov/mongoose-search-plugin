'use strict';

var expect = require('expect.js'),
	mongoose = require('mongoose'),
	_ = require('underscore');

require('./testModel');

var TestModel = mongoose.model('TestModel'),
	EmbeddedTestModel = mongoose.model('EmbeddedTestModel');

describe('search plugin', function() {
	var raw = {
		title: 'the object to search.',
		description: 'You have to search this object.',
		tags: ['object', 'to', 'search', 'challenges']
	};

	it('connect to db', function() {
		mongoose.connect('mongodb://127.0.0.1:27017/test');
	});

	it('clear test collection', function(done) {
		TestModel.remove({}, done);
	});

	it('save object', function(done) {
		var obj = new TestModel(raw);
		obj.save(done);
	});

	it('save another object', function(done) {
		var obj = new TestModel({
			title: 'another one object',
			description: 'You have to find this one too.',
			tags: ['another', 'object', 'to', 'find']
		});
		obj.save(done);
	});

	it('search should return both objects', function(done) {
		TestModel.search('object', null, null, function(err, data) {
			expect(err).not.to.be.ok();
			expect(data.results).to.be.ok();
			expect(data.results.length).to.be.ok();
			expect(data.results.length).to.equal(2);

			done(err);
		});
	});

	it('search should return first object', function(done) {
		TestModel.search('search', null, null, function(err, data) {
			expect(err).not.to.be.ok();
			expect(data.results).to.be.ok();
			expect(data.results.length).to.be.ok();
			expect(data.results.length).to.equal(1);

			done(err);
		});
	});

	it('search should return second object', function(done) {
		TestModel.search('find', null, null, function(err, data) {
			expect(err).not.to.be.ok();
			expect(data.results).to.be.ok();
			expect(data.results.length).to.be.ok();
			expect(data.results.length).to.equal(1);

			done(err);
		});
	});

	it('search should return no objects', function(done) {
		TestModel.search('unexpected tokens', null, null, function(err, data) {
			expect(err).not.to.be.ok();
			expect(data.results).to.be.ok();
			expect(data.results.length).to.equal(0);

			done(err);
		});
	});

	it('generate more objects', function(done) {
		var len = 4, inserted = 0;
		for(var i = 0; i <= len; i++) {
			var obj = new TestModel(raw);
			obj.save(function(err) {
				expect(err).not.to.be.ok();

				if (++inserted === len) done();
			});
		}
	});

	var allCount;
	it('search all objects with outfields', function(done) {
		TestModel.search('object', {title: 0}, function(err, data) {
			expect(err).not.to.be.ok();
			expect(data.results[0].title).not.to.be.ok();

			allCount = data.results.length;
			done(err);
		});
	});

	it('search with limit option', function(done) {
		TestModel.search('object', null, {limit: 3}, function(err, data) {
			expect(err).not.to.be.ok();
			expect(data.results.length).to.equal(3);
			expect(data.totalCount).to.equal(allCount)

			done(err);
		});
	});

	it('search with skip option', function(done) {
		TestModel.search('object', null, {skip: 2}, function(err, data) {
			expect(err).not.to.be.ok();
			expect(data.results.length).to.equal(allCount - 2);
			expect(data.totalCount).to.equal(allCount)

			done(err);
		});
	});

	it('search with limit and skip option', function(done) {
		TestModel.search('object', null, {skip: 2, limit: 2}, function(err, data) {
			expect(err).not.to.be.ok();
			expect(data.results.length).to.equal(2);
			expect(data.totalCount).to.equal(allCount)

			done(err);
		});
	});

	it('search with sort option', function(done) {
		TestModel.search('object', null, {sort: {index: 1}}, function(err, data) {
			var min = data.results[0].index;
			expect(_(data.results).all(function(item) {
				var res = item.index >= min;
				min = item.index;
				return res;
			})).to.be.ok();
			done(err);
		});
	});

	it('search with conditions option', function(done) {
		TestModel.search('object', null, {
			conditions: {index: {$gt: 50}}
		}, function(err, data) {
			expect(_(data.results).all(function(item) {
				return item.index > 50;
			})).to.be.ok();
			done(err);
		});
	});

	var embedded;
	it('create document embedded document', function(done) {
		embedded = new EmbeddedTestModel({
			title: 'embedded',
			description: 'embedded'
		});
		embedded.save(done);
	});

	it('create document with ref option', function(done) {
		var obj = new TestModel({
			title: 'with embedded',
			description: 'with embedded',
			tags: ['with', 'embedded'],
			embedded: embedded._id 
		});
		obj.save(done);
	});

	it('search document with populate option', function(done) {
		TestModel.search('embedded', null, {
			populate: [{path: 'embedded'}]
		}, function(err, data) {
			expect(data.results.length).equal(1);
			expect(data.results[0].embedded._id).to.be.ok();
			done(err);
		});
	});

	it('search document with populate option and fields options',
	function(done) {
		TestModel.search('embedded', null, {
			populate: [{path: 'embedded', fields: {title: 0}}]
		}, function(err, data) {
			expect(data.results.length).equal(1);
			expect(data.results[0].embedded._id).to.be.ok();
			expect(data.results[0].embedded.title).not.to.be.ok();
			done(err);
		});
	});

	it('test setKeywords method', function(done) {
		TestModel.setKeywords(done);
	});

	it('clear test collection', function(done) {
		TestModel.remove({}, done);
	});

	it('setKeywords on empty collection', function(done) {
		TestModel.setKeywords(done);
	});
});
