'use strict';

const cacheControlDuration = require('./cacheControlDuration');
const clock = require('@yr/clock');

/**
 * Patch Response 'proto' with cacheControl behaviour
 * @param {Object} proto
 */
module.exports = function(proto) {
  proto.cacheControl = cacheControl;
};

/**
 * Set cache control header based on 'defaultMaxAge'
 * @param {String|Number|Boolean} defaultMaxAge
 * @param {Array|Number} [upstreamMaxAge]
 * @returns {Object}
 */
function cacheControl(defaultMaxAge, upstreamMaxAge) {
  const duration = cacheControlDuration(defaultMaxAge, upstreamMaxAge);

  if (duration > 0) {
    clock.timeout(
      duration * 1000,
      () => {
        this.app.reload();
      },
      'cacheControl'
    );
  }

  return this;
}
