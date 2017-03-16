'use strict';

/**
 * Response timing middleware
 * @returns {Function}
 */
module.exports = function() {
  return function timingMiddleware(req, res, next) {
    res.time('response');
    res.once('finish', finished, res);
    res.once('close', finished, res);
    next();
  };
};

/**
 * Finished handler
 * Context bound to 'res'
 */
function finished() {
  this.time('response');
  this.off('finish', finished);
  this.off('close', finished);
}
