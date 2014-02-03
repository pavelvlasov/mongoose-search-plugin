'use strict';

var expect = require('expect.js'),
	mongoose = require('mongoose');

require('./testModel');

var TestModel = mongoose.model('TestModel');

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
		TestModel.search('object', null, null, function(err, objs) {
			expect(err).not.to.be.ok();
			expect(objs).to.be.ok();
			expect(objs.length).to.be.ok();
			expect(objs.length).to.equal(2);

			done(err);
		});
	});

	it('search should return first object', function(done) {
		TestModel.search('search', null, null, function(err, objs) {
			expect(err).not.to.be.ok();
			expect(objs).to.be.ok();
			expect(objs.length).to.be.ok();
			expect(objs.length).to.equal(1);

			done(err);
		});
	});

	it('search should return second object', function(done) {
		TestModel.search('find', null, null, function(err, objs) {
			expect(err).not.to.be.ok();
			expect(objs).to.be.ok();
			expect(objs.length).to.be.ok();
			expect(objs.length).to.equal(1);

			done(err);
		});
	});

	it('search should return no objects', function(done) {
		TestModel.search('unexpected tokens', null, null, function(err, objs) {
			expect(err).not.to.be.ok();
			expect(objs).to.be.ok();
			expect(objs.length).to.equal(0);

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
		TestModel.search('object', {title: 0}, function(err, objs) {
			expect(err).not.to.be.ok();
			expect(objs[0].title).not.to.be.ok();

			allCount = objs.length;
			done(err);
		});
	});

	it('search with limit option', function(done) {
		TestModel.search('object', null, {limit: 3}, function(err, objs) {
			expect(err).not.to.be.ok();
			expect(objs.length).to.equal(3);

			done(err);
		});
	});

	it('search with skip option', function(done) {
		TestModel.search('object', null, {skip: 2}, function(err, objs) {
			expect(err).not.to.be.ok();
			expect(objs.length).to.equal(allCount - 2);

			done(err);
		});
	});

	it('search with limit and skip option', function(done) {
		TestModel.search('object', null, {skip: 2, limit: 2}, function(err, objs) {
			expect(err).not.to.be.ok();
			expect(objs.length).to.equal(2);

			done(err);
		});
	});

	it('clear test collection', function(done) {
		TestModel.remove({}, done);
	});
});
