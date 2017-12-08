'use strict';

const { INITED, HANDLING, RENDERING } = require('./Page');

/**
 * Patch Response 'proto' with write behaviour
 * @param {Object} proto
 */
module.exports = function(proto) {
  proto.write = write;
};

/**
 * Partial render
 */
function write() {
  const page = this.app.get('page');
  const reloaded = this.req != null && this.req.reloaded;

  // Only relevant during HANDLING phase for original request
  if (!reloaded && page != null && page.state === (INITED | HANDLING)) {
    page.debug('rendering (write)');
    page.appendState(RENDERING);
    this.writing = true;
    this.time('write');
    page.render(this.req, this, () => {
      this.time('write');
      this.writing = undefined;
      page.debug('rendered (write)');
      page.appendState(-RENDERING);
    });
  }
}
