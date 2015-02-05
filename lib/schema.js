'use strict';

var util     = require('util')
  , DateOnly = require('dateonly')
  ;

module.exports = exports = function(mongoose) {

  var MongooseDateOnly = function DateOnly(path, options) { 
    mongoose.SchemaType.call(this, path, options);
  };

  util.inherits(MongooseDateOnly, mongoose.SchemaType);

  MongooseDateOnly.prototype.checkRequired = function(value) {
    return Boolean(value);
  };

  MongooseDateOnly.prototype.cast = function(val) {
    var castedVal = new DateOnly(val);
    if (castedVal.valueOf() !== castedVal.valueOf()) { // safe isNaN check
      throw new mongoose.Error.CastError('DateOnly', val, this.path);
    }

    return castedVal;
  };

  MongooseDateOnly.prototype.$conditionalHandlers = {
    '$ne' : handleSingle,
    '$in' : handleArray,
    '$nin': handleArray,
    '$gt' : handleSingle,
    '$lt' : handleSingle,
    '$gte': handleSingle,
    '$lte': handleSingle,
    '$all': handleArray,
    '$options': handleSingle
  };

  MongooseDateOnly.prototype.castForQuery = function($conditional, val) {
    var handler;
    if (arguments.length === 2) {
      handler = this.$conditionalHandlers[$conditional];
      if (!handler) throw new Error('Can not use ' + $conditional + ' with DateOnly.');
      return handler.call(this, val);
    } else {
      val = $conditional;
      if (val instanceof RegExp) throw new Error('Can not use RegExp with DateOnly.');
      return new DateOnly(val).valueOf();
    }
  };

  function handleSingle(val) {
    return this.castForQuery(val); /* jshint:ignore */
  }

  function handleArray(val) {
    var self = this; /* jshint:ignore */
    return val.map(function(v) {
      return self.castForQuery(v);
    });
  }

  mongoose.Types.DateOnly = DateOnly;
  mongoose.SchemaTypes.DateOnly = MongooseDateOnly;

  return DateOnly;
};
