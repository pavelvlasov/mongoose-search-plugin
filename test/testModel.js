'use strict';

var mongoose = require('mongoose'),
	plugin = require('../index');

var TestModelSchema = mongoose.Schema({
	title: {type: String, required: true},
	description: {type: String, required: true},
	tags: {type: [String], required: true}
});

TestModelSchema.plugin(plugin, {
	fields: ['title', 'description', 'tags']
});

mongoose.model('TestModel', TestModelSchema);
