'use strict';

/**
 * Patch 'proto' with cacheControl behaviour
 * @param {Object} proto
 */

module.exports = function (proto) {
  // Noop
  proto.cacheControl = function cacheControl() {};
};