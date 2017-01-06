'use strict';

var marky = require('marky');

var MAX_MARKS = 1000;

var id = 0;

/**
 * Patch 'proto' with time behaviour
 * @param {Object} proto
 */
module.exports = function (proto) {
  proto.time = time;
};

/**
 * Measure time to execute 'action'
 * @param {String} name
 * @param {Function|Number|String} action
 * @returns {Object}
 */
function time(name, action) {
  if (!this.timings) this.timings = {};

  var type = typeof action;
  // Limit size of marks cache
  var uid = id++ % MAX_MARKS;
  var uname = uid + '::' + name;
  var entry = void 0;

  switch (type) {
    // Handle passing duration
    case 'number':
      entry = {
        entryType: 'measure',
        startTime: 0,
        duration: action,
        name: name
      };
      break;
    // Handle passing function
    case 'function':
      marky.mark(uname);
      action();
      entry = marky.stop(uname);
      break;
    default:
      var tempName = '_' + name;

      // "start"
      if (!this.timings[tempName]) {
        this.timings[tempName] = uname;
        marky.mark(uname);
        return this;
      }

      entry = marky.stop(this.timings[tempName]);
      delete this.timings[tempName];
  }

  entry.name = name;
  this.timings[name] = entry;
  return this;
}