'use strict';

var ms = require('ms');

var CACHE_CONTROL = 'Cache-Control';
var RE_MAX_AGE = /max-age=(\d+)$/;

/**
 * Patch 'proto' with cacheControl behaviour
 * @param {Object} proto
 */
module.exports = function (proto) {
  proto.cacheControl = cacheControl;
};

/**
 * Set cache control header with 'maxage'
 * @param {String|Number|Boolean} maxage
 * @param {Object} upstreamHeaders
 * @returns {Object}
 */
function cacheControl(maxage, upstreamHeaders) {
  if (maxage === false || maxage === 0) {
    this.set(CACHE_CONTROL, 'private, no-cache');
    return this;
  }

  // Try and parse value if String
  if ('string' == typeof maxage) {
    var tmp = ms(maxage);

    // Convert to seconds
    if (tmp && 'number' == typeof tmp) maxage = tmp / 1000;
  }

  // Pass through upstream header value
  if (upstreamHeaders) {
    if (Array.isArray(upstreamHeaders)) {
      (function () {
        var min = Infinity;

        upstreamHeaders.forEach(function (header) {
          var match = RE_MAX_AGE.exec(header['cache-control']);

          if (match && match.length && parseInt(match[1], 10) < min) {
            min = match[1];
            maxage = header['cache-control'];
          }
        });
      })();
    } else if (upstreamHeaders['cache-control']) {
      maxage = upstreamHeaders['cache-control'];
    }
  }

  // Value as number
  if ('number' == typeof maxage) {
    this.set(CACHE_CONTROL, 'public, max-age=' + maxage);
    // Full header
  } else if ('string' == typeof maxage && ~maxage.indexOf('max-age=')) {
    this.set(CACHE_CONTROL, maxage);
  } else {
    throw Error('Invalid cache control value: ' + maxage);
  }

  return this;
}