'use strict';

/**
 * Handler factory for 'page'
 * @param {Page} page
 * @returns {Function}
 */
module.exports = function pageHandlerFactory (page) {
  return function pageHandler (req, res, next) {
    page.willHandle(req, res, (err) => {
      if (err) return next(err);
      page.handle(req, res, (err) => {
        if (err) return next(err);
        if (!res.finished) res.end();
      });
    });
  };
};