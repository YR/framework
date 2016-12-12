'use strict';

const Debug = require('debug');

/**
 * Retrieve and initialise server instance
 * @param {Express} express
 * @param {String} id
 * @param {Number} port
 * @param {Object} options
 *  - {Function} handler
 *  - {Function} renderer
 *  - {String} localesDir
 *  - {Function} localesLoader
 *  - {Object} middleware
 *  - {Function} routes
 *  - {DataStore} settings
 *  - {String} templatesDir
 *  - {TemplateCache} templatesLoader
 * @returns {Express}
 */
module.exports = function application (express, id, port, options) {
  const {
    handler,
    localesDir,
    localesLoader,
    middleware,
    renderer,
    routes,
    settings,
    templatesDir,
    templatesLoader
  } = options;
  const app = express();
  const debug = Debug(id);

  // Load locales
  if (localesLoader && localesDir) localesLoader(localesDir);
  // Load templates (server)
  if (templatesLoader && templatesDir) templatesLoader(templatesDir);

  // Store properties
  app.set('debug', debug);
  app.set('handler', handler);
  app.set('id', id);
  app.set('localesLoader', localesLoader);
  app.set('pages', {});
  app.set('renderer', renderer);
  app.set('settings', settings);
  app.set('templatesLoader', templatesLoader);
  app.set('view', null);
  app.set('views', null);

  // Register pre-route middleware stack
  if (middleware && middleware.pre) middleware.pre(app);

  // Init components
  if (handler) handler.init(id, app);
  if (renderer) renderer.init(id, app);
  if (routes) routes.init(app, settings);

  // Register post-route middleware stack
  if (middleware && middleware.post) middleware.post(app);

  app.set('server', app.listen(port));
  debug(port ? `listening on: ${port}` : 'listening');

  return app;
};