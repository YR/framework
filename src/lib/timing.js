'use strict';

const now = require('performance-now');

const hasPerformance =
  typeof performance !== 'undefined' &&
  typeof performance.mark !== 'undefined' &&
  typeof performance.measure !== 'undefined';

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
 * @param {Function|Number} [action]
 * @returns {Object}
 */
function time(name, action) {
  if (this.timings === undefined) {
    this.timings = {};
  }

  const type = typeof action;
  const uname = `${name}::${this.id}`;
  let entry, startTime, tempName;

  switch (type) {
    // Handle passing duration
    case 'number':
      entry = {
        startTime: now() - action,
        name,
        duration: action
      };
      break;
    // Handle passing function
    case 'function':
      startTime = now();
      mark(`start::${uname}`);
      action();
      mark(`end::${uname}`);
      measure(uname, `start::${uname}`, `end::${uname}`);
      entry = {
        startTime,
        name,
        duration: now() - startTime
      };
      break;
    default:
      tempName = `_${name}`;

      // "start"
      if (this.timings[tempName] === undefined) {
        this.timings[tempName] = now();
        mark(`start::${uname}`);
        return this;
      }

      startTime = this.timings[tempName];
      mark(`end::${uname}`);
      measure(uname, `start::${uname}`, `end::${uname}`);
      entry = {
        startTime,
        name,
        duration: now() - startTime
      };

      delete this.timings[tempName];
  }

  this.timings[name] = entry;

  return this;
}

function mark(name) {
  if (hasPerformance) {
    performance.mark(name);
  }
}

function measure(name, startMark, endMark) {
  if (hasPerformance) {
    performance.measure(name, startMark, endMark);
  }
}
