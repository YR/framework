'use strict';

const { RENDERING, RENDERED } = require('./Page');

/**
 * Patch 'app' with rerender() behaviour
 * @param {Express} app
 * @returns {Express}
 */
module.exports = function(app) {
  app.rerender = rerender.bind(app);
  return app;
};

/**
 * Rerender
 * @param {Function} [done]
 */
function rerender(done) {
  const page = this.get('page');

  // Prevent rerender if currently processing
  if (page != null && page.containsState(RENDERED)) {
    const { req, res } = this.getCurrentContext();

    page.debug('rerendering');
    page.appendState(-RENDERED, RENDERING);
    res.time('rerender');
    page.render(req, res, err => {
      res.time('rerender');
      page.debug('rerendered');
      page.appendState(-RENDERING, RENDERED);
      if (done != null) {
        done(err);
      }
    });
  }
}
