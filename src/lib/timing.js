'use strict';

// For the client, 'perf_hooks' is disabled in package.json 'browser' field,
// and we use the 'performance' object defined globally
const { performance = window.performance } = require('perf_hooks');

/**
 * Patch 'proto' with time behaviour
 * @param {Object} proto
 */
module.exports = function(proto) {
  proto.time = time;
  proto.time.clear = clear.bind(proto);
};

/**
 * Measure time to execute 'action'
 * @param {String} name
 * @param {Function|Number} [action]
 * @returns {Object}
 */
function time(name, action) {
  if (performance == null) {
    return this;
  }

  if (this.timings === undefined) {
    this.timings = {};
  }

  const type = typeof action;
  const uname = `${this.id}::${name}`;
  let entry, tempName;

  switch (type) {
    // Handle passing duration
    case 'number':
      entry = {
        startTime: Date.now() - action,
        name,
        duration: action,
        entryType: 'measure'
      };
      break;
    // Handle passing function
    case 'function':
      performance.mark(`start::${uname}`);
      action();
      entry = stop(uname);
      break;
    default:
      tempName = `_${name}`;

      // "start"
      if (this.timings[tempName] === undefined) {
        this.timings[tempName] = uname;
        performance.mark(`start::${uname}`);
        return this;
      }

      entry = stop(this.timings[tempName]);
      delete this.timings[tempName];
  }

  this.timings[name] = entry;

  return this;
}

/**
 * Clear timings from performance timeline
 * @returns {Object}
 */
function clear() {
  if (performance != null) {
    for (const name in this.timings) {
      performance.clearMarks(`start::${this.id}::${name}`);
      performance.clearMarks(`end::${this.id}::${name}`);
      performance.clearMeasures(`${this.id}::${name}`);
    }
  }

  return this;
}

/**
 * Retrieve entry for measured event with 'uname'
 * Borrowed from https://github.com/nolanlawson/marky
 * @param {String} uname
 * @returns {Object}
 */
function stop(uname) {
  performance.mark(`end::${uname}`);
  performance.measure(uname, `start::${uname}`, `end::${uname}`);

  const entries = performance.getEntriesByName(uname);

  return entries[entries.length - 1];
}
