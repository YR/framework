'use strict';

var onFinished = require('on-finished');

/**
 * Response timing middleware
 * @returns {Function}
 */
module.exports = function () {
  return function timingMiddleware(req, res, next) {
    res.time('response');
    onFinished(res, function (err, res) {
      res.time('response');
      // console.log(res.timings)
    });
    next();
  };
};