'use strict';

const {
  INITING,
  INITED,
  HANDLING,
  HANDLED,
  RENDERING,
  RENDERED
} = require('./Page');

/**
 * Handler factory for 'page'
 * @param {Page} page
 * @returns {Function}
 */
module.exports = function pageHandlerFactory (page) {
  return function pageHandler (req, res, next) {
    page.state = 0;
    page.appendState(INITING);
    page.init((err) => {
      page.appendState(-INITING, INITED);
      if (err) return next(err);
      page.appendState(HANDLING);
      page.handle(req, res, (err) => {
        page.appendState(-HANDLING, HANDLED);
        if (err) return next(err);
        // Prevent rendering unhandled/aborted
        if (page.state === INITED | HANDLED) {
          page.appendState(RENDERING);
          page.render(req, res, (err) => {
            page.appendState(-RENDERING, RENDERED);
            if (err) return next(err);
            if (!res.finished) res.end();
          });
        }
      });
    });
  };
};