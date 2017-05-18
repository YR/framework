'use strict';

const debugFactory = require('debug');

const BLACKLIST_KEYS = ['middleware', 'pageHandlerFactory', 'render', 'sourcepath'];

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
 *  - {Function} render
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
    render
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
  app.set('render', render && render(app));

  // Register middleware/params stack
  if (middleware !== undefined && middleware.register !== undefined) {
    middleware.register(app);
  }
  if (params !== undefined && params.register !== undefined) {
    params.register(app);
  }

  // Init pages
  for (const id in pages) {
    const { pageFactory, routes } = pages[id];

    if (routes !== undefined && routes.length > 0) {
      const page = pageFactory(id, app);

      pages[id] = page;

      routes.forEach(route => {
        debug('handling %s at %s', id, route);
        app.get(route, pageHandlerFactory(page));
      });
    }
  }

  // Register error middleware stack
  if (middleware !== undefined && middleware.registerError !== undefined) {
    middleware.registerError(app);
  }

  const originalListen = app.listen;

  app.listen = () => {
    const server = originalListen.call(app, port);

    app.set('server', server);
    app.get('debug')(`listening ${port ? 'on: ' + port : ''}`);

    return server;
  };

  return app;
};
