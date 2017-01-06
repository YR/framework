'use strict';

/**
 * Attach id to request/response
 * @param {Express} app
 * @returns {Function}
 */

module.exports = function (app) {
  var id = app.get('uid');

  return function idMiddleware(req, res, next) {
    req.id = res.id = id;
    next();
  };
};