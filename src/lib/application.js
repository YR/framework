'use strict';

const debugFactory = require('debug');

const BLACKLIST_KEYS = ['middleware', 'pageHandlerFactory', 'renderer', 'sourcepath'];

/**
 * Retrieve and initialise server instance
 * @param {String} id
 * @param {Number} port
 * @param {Express} express
 * @param {Object} options
 *  - {Object} locales
 *  - {Object} middleware
 *  - {Object} pages
 *  - {Function} pageHandlerFactory
 *  - {Object} params
 *  - {Function} renderer
 *  - {DataStore} settings
 *  - {String} sourcepath
 *  - {Object} templates
 * @returns {Express}
 */
module.exports = function application(id, port, express, options) {
  const {
    middleware,
    pages = {},
    pageHandlerFactory,
    params,
    renderer
  } = options;
  const app = express();
  const debug = debugFactory(id);

  // Store options
  for (const key in options) {
    if (!~BLACKLIST_KEYS.indexOf(key)) {
      app.set(key, options[key]);
    }
  }
  app.set('debug', debug);
  app.set('id', id);
  app.set('page', null);
  app.set('view', null);
  app.set('views', null);
  // Factory
  app.set('renderer', renderer && renderer(app));

  // Register middleware/params stack
  if (middleware && middleware.register) {
    middleware.register(app);
  }
  if (params && params.register) {
    params.register(app);
  }

  // Init pages
  for (const id in pages) {
    const { pageFactory, routes } = pages[id];

    if (routes && routes.length) {
      const page = pageFactory(id, app);

      pages[id] = page;

      routes.forEach(route => {
        debug('handling %s at %s', id, route);
        app.get(route, pageHandlerFactory(page));
      });
    }
  }

  // Register error middleware stack
  if (middleware && middleware.registerError) {
    middleware.registerError(app);
  }

  app.set('server', app.listen(port));
  debug(port ? `listening on: ${port}` : 'listening');

  return app;
};
