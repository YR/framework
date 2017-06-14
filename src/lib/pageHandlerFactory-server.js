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
module.exports = function pageHandler(page) {
  /**
   * Page handle factory
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   */
  return function pageHandle(req, res, next) {
    res.time('route');
    page.state = 0;
    page.debug('initing');
    page.appendState(INITING);
    page.init(err => {
      page.debug('inited');
      page.appendState(-INITING, INITED);
      if (err != null) {
        return void next(err);
      }
      page.debug('handling');
      page.appendState(HANDLING);
      res.time('handle');
      page.handle(req, res, err => {
        res.time('handle');
        page.debug('handled');
        page.appendState(-HANDLING, HANDLED);
        if (err != null) {
          return void next(err);
        }
        // Prevent rendering unhandled/aborted
        if (page.state === INITED | HANDLED) {
          page.debug('rendering');
          page.appendState(RENDERING);
          res.time('render');
          page.render(req, res, err => {
            res.time('render');
            page.debug('rendered');
            page.appendState(-RENDERING, RENDERED);
            if (err != null) {
              return void next(err);
            }
            if (!res.finished) {
              res.end();
            }
          });
        }
      });
    });
  };
};
