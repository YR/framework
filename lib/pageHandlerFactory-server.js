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


module.exports = function pageHandlerFactory(page) {
  return function pageHandler(req, res, next) {
    page.state = 0;
    page.appendState(INITING);
    page.init(function (err) {
      page.appendState(-INITING, INITED);
      if (err) return next(err);
      page.appendState(HANDLING);
      res.time('handle');
      page.handle(req, res, function (err) {
        res.time('handle');
        page.appendState(-HANDLING, HANDLED);
        if (err) return next(err);
        // Prevent rendering unhandled/aborted
        if (page.state === INITED | HANDLED) {
          page.appendState(RENDERING);
          res.time('render');
          page.render(req, res, function (err) {
            res.time('render');
            page.appendState(-RENDERING, RENDERED);
            if (err) return next(err);
            if (!res.finished) res.end();
          });
        }
      });
    });
  };
};