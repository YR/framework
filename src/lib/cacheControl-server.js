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
 * Set cache control header based on 'maxage'
 * @param {String|Number|Boolean} maxage
 * @param {Array|Object} [upstream]
 * @returns {Object}
 */
function cacheControl(maxage, upstream) {
  const duration = cacheControlDuration(maxage, upstream);
  const header = duration === 0 ? 'private, no-cache' : `public, max-age=${duration}`;

  this.set(CACHE_CONTROL, header);

  return this;
}
