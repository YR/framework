'use strict';

var ms = require('ms');

var RE_MAX_AGE = /max-age=(\d+)/;

/**
 * Retrieve cache control duration (in seconds)
 * based on 'maxage' and optional 'upstream' headers
 * @param {String|Number|Boolean} maxage
 * @param {Object} [upstream]
 * @returns {Number}
 */
module.exports = function cacheControl(maxage, upstream) {
  if (maxage === false || maxage === 0) {
    return 0;
  }

  // Try and parse value if String
  if (typeof maxage === 'string') {
    var tmp = ms(maxage);

    // Convert to seconds
    if (tmp && typeof tmp === 'number') {
      maxage = tmp / 1000;
    }
  }

  // Pass through upstream header value
  if (upstream) {
    if (Array.isArray(upstream)) {
      var min = Infinity;

      upstream.forEach(function (header) {
        if (!header) {
          return;
        }
        if ('headers' in header) {
          header = header.headers;
        }

        var match = RE_MAX_AGE.exec(header['cache-control']);

        if (match && match.length && parseInt(match[1], 10) < min) {
          min = match[1];
          maxage = header['cache-control'];
        }
      });
    } else {
      if ('headers' in upstream) {
        upstream = upstream.headers;
      }
      if (upstream['cache-control']) {
        maxage = upstream['cache-control'];
      }
    }
  }

  // Value as number
  if (typeof maxage === 'number') {
    return maxage;
  }
  // Full header
  if (typeof maxage === 'string' && ~maxage.indexOf('max-age=')) {
    var match = RE_MAX_AGE.exec(maxage);

    return match && match.length && parseInt(match[1], 10) || 0;
  }

  throw Error('Invalid cache control value: ' + maxage);
};