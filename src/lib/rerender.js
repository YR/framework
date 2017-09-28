'use strict';

const { RENDERING, RENDERED } = require('./Page');
const clock = require('@yr/clock');

let pending;

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

  if (page == null) {
    return;
  }

  // Queue rerender if currently processing
  if (!page.containsState(RENDERED)) {
    page.debug('rerender queued');
    pending = page;
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
  clock.frame(() => {
    res.time('rerender');
    page.render(req, res, err => {
      res.time('rerender');
      page.debug('rerendered');
      page.appendState(-RENDERING, RENDERED);
      if (pending !== undefined) {
        const shouldRender = pending === page;

        pending = undefined;
        if (shouldRender) {
          return renderPage(page, req, res, done);
        }
      }
      if (done != null) {
        done(err);
      }
    });
  });
}
