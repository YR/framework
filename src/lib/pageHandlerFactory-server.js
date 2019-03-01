'use strict';

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
    page.debug('initing');
    page.init(req, res, err => {
      page.debug('inited');
      if (err != null) {
        return void next(err);
      }
      page.debug('handling');
      res.time('handle');
      page.handle(req, res, err => {
        res.time('handle');
        page.debug('handled');
        if (err != null) {
          return void next(err);
        }
        // Don't attempt to render the current page
        // if the request is aborted or we have already finished rendering.
        if (!req.aborted && !res.finished) {
          page.debug('rendering');
          res.time('render');
          page.render(req, res, err => {
            res.time('render');
            page.debug('rendered');
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
