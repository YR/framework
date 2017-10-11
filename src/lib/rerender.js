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

  // Prevent rerender if missing or currently processing
  if (page == null || !page.containsState(RENDERED)) {
    return;
  }

  const { req, res } = this.getCurrentContext();

  renderPage(page, req, res, done);
}

/**
 * Render 'page'
 * @param {Page} page
 * @param {Request} req
 * @param {Response} res
 * @param {Function} done
 */
function renderPage(page, req, res, done) {
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
