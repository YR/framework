'use strict';

var cacheControlDuration = require('./cacheControlDuration');
var clock = require('@yr/clock');

/**
 * Patch 'proto' with cacheControl behaviour
 * @param {Object} proto
 */
module.exports = function (proto) {
  proto.cacheControl = cacheControl;
};

/**
 * Set cache control header based on 'maxage'
 * @param {String|Number|Boolean} maxage
 * @param {Object} [upstream]
 * @returns {Object}
 */
function cacheControl(maxage, upstream) {
  var _this = this;

  var duration = cacheControlDuration(maxage, upstream);

  if (duration) {
    clock.timeout(duration * 1000, function () {
      _this.app.refresh();
    }, 'cacheControl');
  }

  return this;
}