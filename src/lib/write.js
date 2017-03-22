'use strict';

const { INITED, HANDLING, RENDERING } = require('./Page');

/**
 * Patch 'proto' with write() behaviour
 * @param {Object} proto
 */
module.exports = function(proto) {
  proto.write = write;
};

/**
 * Trigger partial render
 */
function write() {
  const page = this.app.get('page');

  // Only relevant during HANDLING phase
  if (page && page.state === INITED | HANDLING) {
    const { req, res } = this.app.getCurrentContext();

    page.debug('rendering (write)');
    page.appendState(RENDERING);
    res.time('write');
    page.render(req, res, () => {
      res.time('write');
      page.debug('rendered (write)');
      page.appendState(-RENDERING);
    });
  }
}
