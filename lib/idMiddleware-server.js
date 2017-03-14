'use strict';

var uuid = require('uuid');

var HOST_NAME = process.env.NODE_ENV == 'production' && process.env.HOSTNAME ? process.env.HOSTNAME : 'dev';

/**
 * Attach id to request/response
 * @returns {Function}
 */
module.exports = function () {
  return function idMiddleware(req, res, next) {
    var id = HOST_NAME + ':' + uuid.v4();

    req.id = res.id = id;
    next();
  };
};