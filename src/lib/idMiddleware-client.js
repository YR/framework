'use strict';

/**
 * Attach id to request/response
 * @param {String} id
 * @returns {Function}
 */
module.exports = function (id) {
  return function idMiddleware (req, res, next) {
    req.id = res.id = id;
    next();
  };
};