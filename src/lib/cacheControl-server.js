'use strict';

const cacheControlDuration = require('./cacheControlDuration');

const CACHE_CONTROL = 'Cache-Control';

/**
 * Patch 'proto' with cacheControl behaviour
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
  const header =
    duration === 0 ? 'private, no-cache' : `public, max-age=${duration}`;

  this.set(CACHE_CONTROL, header);

  return this;
}
