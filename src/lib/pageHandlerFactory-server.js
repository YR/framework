'use strict';

const Page = require('./Page');

/**
 * Handler factory for 'page'
 * @param {Page} page
 * @returns {Function}
 */
module.exports = function pageHandlerFactory (page) {
  return function pageHandler (req, res, next) {
    page.init((err) => {
      if (err) return next(err);
      page.handle(req, res, (err) => {
        if (err) return next(err);
        // Prevent rendering unhandled/aborted
        if (page.state & Page.HANDLED) {
          page.render(req, res, (err) => {
            if (err) return next(err);
            if (!res.finished) res.end();
          });
        }
      });
    });
  };
};