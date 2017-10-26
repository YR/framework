'use strict';

const onFinished = require('on-finished');

/**
 * Response timing middleware
 * @returns {Function}
 */
module.exports = function() {
  return function timingMiddleware(req, res, next) {
    res.time('response');
    res.time('route');
    onFinished(res, (err, res) => {
      res.time('response');
      res.time.clear();
    });
    next();
  };
};
