'use strict';

var mongoose = require('mongoose'),
	plugin = require('../index'),
	_ = require('underscore');

var TestModelSchema = mongoose.Schema({
	title: {type: String, required: true},
	description: {type: String, required: true},
	tags: {type: [String], required: true},
	index: {type: Number, 'default': function() {
		return _.random(0, 100);
	}}
});

TestModelSchema.plugin(plugin, {
	fields: ['title', 'description', 'tags']
});

mongoose.model('TestModel', TestModelSchema);
