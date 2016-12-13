'use strict';

const Debug = require('debug');
const page = require('./page');

/**
 * Retrieve and initialise server instance
 * @param {Express} express
 * @param {String} id
 * @param {Number} port
 * @param {Object} options
 *  - {Function} handler
 *  - {Function} renderer
 *  - {Object} locales
 *  - {String} localesDir
 *  - {Object} middleware
 *  - {Function} routes
 *  - {DataStore} settings
 *  - {Object} templates
 *  - {String} templatesDir
 * @returns {Express}
 */
module.exports = function application (express, id, port, options) {
  const {
    locales,
    localesDir,
    middleware,
    renderer,
    routes,
    settings,
    templates,
    templatesDir
  } = options;
  const app = express();
  const debug = Debug(id);

  // Store properties
  app.set('debug', debug);
  app.set('id', id);
  app.set('locales', locales);
  app.set('settings', settings);
  app.set('templates', templates);
  app.set('view', null);
  app.set('views', null);

  if (renderer) renderer.init(id, app);
  // Load locales
  if (locales && localesDir) locales.load(localesDir);
  // Load templates
  if (templates && templatesDir) templates.load(templatesDir);

  // Register pre-route middleware stack
  if (middleware && middleware.pre) middleware.pre(app);
  // Init pages/routes
  if (routes) {
    const pageRoutes = routes(app, settings);

    for (const id in pageRoutes) {
      const { options, routes } = pageRoutes[id];
      const { handler, hasOwnLayout } = page(app, id, options);

      routes.forEach((route) => {
        debug('handling %s at %s', id, route);
        app.get(route, handler);
      });
    }
  }
  // Register post-route middleware stack
  if (middleware && middleware.post) middleware.post(app);

  app.set('server', app.listen(port));
  debug(port ? `listening on: ${port}` : 'listening');

  return app;
};