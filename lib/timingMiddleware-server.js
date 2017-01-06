'use strict';

var onFinished = require('on-finished');

/**
 * Response timing middleware
 * @param {Express} app
 * @returns {Function}
 */
module.exports = function (app) {
  return function timingMiddleware(req, res, next) {
    res.time('response');
    onFinished(res, function (err, res) {
      res.time('response');
    });
    next();
  };
};