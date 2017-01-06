'use strict';

const onFinished = require('on-finished');

/**
 * Response timing middleware
 * @param {Express} app
 * @returns {Function}
 */
module.exports = function (app) {
  return function timingMiddleware (req, res, next) {
    res.time('response');
    onFinished(res, (err, res) => {
      res.time('response');
    });
    next();
  };
};