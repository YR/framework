'use strict';

const cacheControlDuration = require('./cacheControlDuration');
const clock = require('@yr/clock');

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

  if (duration) {
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
