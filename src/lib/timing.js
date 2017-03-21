'use strict';

const marky = require('marky');

const MAX_MARKS = 1000;

let id = 0;

/**
 * Patch 'proto' with time behaviour
 * @param {Object} proto
 */
module.exports = function(proto) {
  proto.time = time;
};

/**
 * Measure time to execute 'action'
 * @param {String} name
 * @param {Function|Number|String} action
 * @returns {Object}
 */
function time(name, action) {
  if (!this.timings) {
    this.timings = {};
  }

  const type = typeof action;
  // Limit size of marks cache
  const uid = id++ % MAX_MARKS;
  const uname = `${uid}::${name}`;
  let entry, tempName;

  switch (type) {
    // Handle passing duration
    case 'number':
      entry = {
        // TODO: add correct startTime
        startTime: 0,
        name,
        duration: action,
        entryType: 'measure'
      };
      break;
    // Handle passing function
    case 'function':
      marky.mark(uname);
      action();
      entry = marky.stop(uname);
      break;
    default:
      tempName = `_${name}`;

      // "start"
      if (!this.timings[tempName]) {
        this.timings[tempName] = uname;
        marky.mark(uname);
        return this;
      }

      entry = marky.stop(this.timings[tempName]);
      delete this.timings[tempName];
  }

  this.timings[name] = entry;
  return this;
}
