'use strict';

const { INITED, HANDLING, RENDERING } = require('./Page');

/**
 * Retrieve partial render function for 'page'
 * @param {Page} page
 * @param {Request} req
 * @param {Response} res
 * @returns {Function}
 */
module.exports = function writeFactory(page, req, res) {
  /**
   * Partial render
   */
  return function write() {
    // Only relevant during HANDLING phase for original request
    if (!req.reloaded && page != null && page.state === (INITED | HANDLING)) {
      page.debug('rendering (write)');
      page.appendState(RENDERING);
      res.writing = true;
      res.time('write');
      page.render(req, res, () => {
        res.time('write');
        res.writing = undefined;
        page.debug('rendered (write)');
        page.appendState(-RENDERING);
      });
    }
  };
};
