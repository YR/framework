'use strict';

var Page = require('./Page');

/**
 * Handler factory for 'page'
 * @param {Page} page
 * @returns {Function}
 */
module.exports = function pageHandlerFactory(page) {
  return function pageHandler(req, res, next) {
    page.state = 0;
    page.appendState(Page.INITING);
    page.init(function (err) {
      page.appendState(-Page.INITING, Page.INITED);
      if (err) return next(err);
      page.appendState(Page.HANDLING);
      page.handle(req, res, function (err) {
        page.appendState(-Page.HANDLING, Page.HANDLED);
        if (err) return next(err);
        // Prevent rendering unhandled/aborted
        if (page.state === Page.INITED | Page.HANDLED) {
          page.appendState(Page.RENDERING);
          page.render(req, res, function (err) {
            page.appendState(-Page.RENDERING, Page.RENDERED);
            if (err) return next(err);
            if (!res.finished) res.end();
          });
        }
      });
    });
  };
};