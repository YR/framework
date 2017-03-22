'use strict';

var _require = require('./Page'),
    INITING = _require.INITING,
    INITED = _require.INITED,
    HANDLING = _require.HANDLING,
    HANDLED = _require.HANDLED,
    RENDERING = _require.RENDERING,
    RENDERED = _require.RENDERED;

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
    page.state = 0;
    page.debug('initing');
    page.appendState(INITING);
    page.init(function (err) {
      page.debug('inited');
      page.appendState(-INITING, INITED);
      if (err) {
        return next(err);
      }
      page.debug('handling');
      page.appendState(HANDLING);
      res.time('handle');
      page.handle(req, res, function (err) {
        res.time('handle');
        page.debug('handled');
        page.appendState(-HANDLING, HANDLED);
        if (err) {
          return next(err);
        }
        // Prevent rendering unhandled/aborted
        if (page.state === INITED | HANDLED) {
          page.debug('rendering');
          page.appendState(RENDERING);
          res.time('render');
          page.render(req, res, function (err) {
            res.time('render');
            page.debug('rendered');
            page.appendState(-RENDERING, RENDERED);
            if (err) {
              return next(err);
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