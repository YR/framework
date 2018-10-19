'use strict';

const ms = require('ms');

/**
 * Retrieve cache control duration (in seconds)
 * based on 'defaultMaxAge' and optional 'upstreamMaxAge'
 * @param {String|Number|Boolean} defaultMaxAge Formatted time or a value in seconds
 * @param {Array|Object} [upstreamMaxAge] Value in seconds or an array of potentially nested values in seconds
 * @returns {Number}
 */
module.exports = function cacheControl(defaultMaxAge, upstreamMaxAge) {
  if (defaultMaxAge === false || defaultMaxAge === 0) {
    return 0;
  }

  let calculatedMaxAge = defaultMaxAge;

  // Try and parse value if String
  if (typeof calculatedMaxAge === 'string') {
    const tmp = ms(calculatedMaxAge);

    // Convert to seconds
    if (tmp != null && typeof tmp === 'number') {
      calculatedMaxAge = tmp / 1000;
    }
  }

  if (typeof calculatedMaxAge !== 'number') {
    throw Error(`Invalid cache control value: ${calculatedMaxAge}`);
  }

  // Pass through upstream header value
  if (upstreamMaxAge != null) {
    const flattenedMaxAges = Array.isArray(upstreamMaxAge)
      ? flatten(upstreamMaxAge, [])
      : [upstreamMaxAge];

    flattenedMaxAges.forEach(maxAge => {
      if (maxAge == null) {
        return;
      }

      if (typeof maxAge !== 'number') {
        throw Error(`Invalid cache control value: ${maxAge}`);
      }

      // Use the lower max age
      if (maxAge < calculatedMaxAge) {
        calculatedMaxAge = maxAge;
      }
    });
  }

  return calculatedMaxAge;
};

/**
 * Flatten nested arrays in 'arr'
 * @param {Array} arr
 */
function flatten(arr) {
  const result = [];

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
