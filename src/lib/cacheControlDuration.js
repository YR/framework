'use strict';

const ms = require('ms');

const GRACE = 10;
const RE_MAX_AGE = /max-age=(\d+)/;

/**
 * Retrieve cache control duration (in seconds)
 * based on 'maxage' and optional 'upstream' headers
 * @param {String|Number|Boolean} maxage
 * @param {Array|Object} [upstream]
 * @returns {Number}
 */
module.exports = function cacheControl(maxage, upstream) {
  if (maxage === false || maxage === 0) {
    return 0;
  }

  // Try and parse value if String
  if (typeof maxage === 'string') {
    const tmp = ms(maxage);

    // Convert to seconds
    if (tmp != null && typeof tmp === 'number') {
      maxage = tmp / 1000;
    }
  }

  // Pass through upstream header value
  if (upstream != null) {
    if (Array.isArray(upstream)) {
      const flattened = flatten(upstream, []);
      let min = Infinity;

      flattened.forEach(header => {
        if (header == null) {
          return;
        }
        if ('headers' in header) {
          header = header.headers;
        }

        const match = RE_MAX_AGE.exec(header['cache-control']);
        const value = (match != null && match.length > 0 && parseInt(match[1], 10)) || Infinity;

        // Take highest if within GRACE
        if (value < min + GRACE) {
          min = value;
          maxage = header['cache-control'];
        }
      });
    } else {
      if ('headers' in upstream) {
        upstream = upstream.headers;
      }
      if (upstream['cache-control'] != null) {
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
    const match = RE_MAX_AGE.exec(maxage);

    return (match != null && match.length > 0 && parseInt(match[1], 10)) || 0;
  }

  throw Error(`Invalid cache control value: ${maxage}`);
};

/**
 * Flatten nested arrays in 'arr'
 * @param {Array} arr
 * @param {Array} result
 */
function flatten(arr, result) {
  for (let i = 0, n = arr.length; i < n; i++) {
    const value = arr[i];

    if (Array.isArray(value)) {
      flatten(value, result);
    } else {
      result.push(value);
    }
  }
  return result;
}
