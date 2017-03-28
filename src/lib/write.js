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
    // Only relevant during HANDLING phase
    if (page && page.state === (INITED | HANDLING)) {
      page.debug('rendering (write)');
      page.appendState(RENDERING);
      res.time('write');
      page.render(req, res, () => {
        res.time('write');
        page.debug('rendered (write');
        page.appendState(-RENDERING);
      });
    }
  };
};
