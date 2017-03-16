'use strict';

const onFinished = require('on-finished');

/**
 * Response timing middleware
 * @returns {Function}
 */
module.exports = function() {
  return function timingMiddleware(req, res, next) {
    res.time('response');
    onFinished(res, (err, res) => {
      res.time('response');
      // console.log(res.timings)
    });
    next();
  };
};
