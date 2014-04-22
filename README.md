# Mongoose full-text search plugin

Simple mongoose plugin for full text search.
Uses [natural](https://github.com/NaturalNode/natural) stemming and distance algorythms.

## Example
``` js
  var mongoose = require('mongoose'),
    searchPlugin = require('mongoose-search-plugin');

  var Schema = mongoose.Schema({
    title: String,
    descirption: String,
    tags: [String]
  });

  Schema.plugin(searchPlugin, {
    fields: ['title', 'description', 'tags']
  });

  var Model = mongoose.model('MySearchModel', Schema);
  Model.search('some query', {title: 1}, {
    conditions: {title: {$exists: true}},
    sort: {title: 1},
    limit: 10
  }, function(err, data) {
    // array of finded results
    console.log(data.results);
    // count of all matching objects
    console.log(data.totalCount);
  });
```

## Installation
``` bash
  $ npm install mongoose-search-plugin --save
```

## Usage

### Initialization
`plugin` accepts options argument with following format:
``` js
  var options = {
    keywordsPath: '_keywords', // path for keywords, `_keywords` as default
    relevancePath: '_relevance', // path for relevance number, '_relevance' as default
    fields: [], // array of fields to use as keywords (can be String or [String] types),
    stemmer: 'PorterStemmer', // natural stemmer, PorterStemmer as default
    distance: 'JaroWinklerDistance' // distance algorythm, JaroWinklerDistance as default
  };
  Schema.plugin(searchPlugin(options));
```

### Search
`Model.search(query, fields, options, callback)` options are optional.
Method will return object of the following format:
``` js
  {
    results: [], // array of results objects
    totalCount: 0 // number of objects, that matched criteries
  }
```
Options has following format:
```js
  {
    conditions: {}, // criteria for query
    sort: {} // sorting parameters
    populate: [{path: '', fields: ''}], // array of paths to populate
    ... and other options of Model.find method
  }
```
By default results sorts by relevance field, that defined in `relevancePath`
plugin option.

### Set keywords
If You start using plugin on existing database to initialize keywords field in object
use `setKeywords` method.
``` js
  Model.setKeywords(function(err) {
    // ...
  });
```

### License: MIT
