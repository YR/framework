'use strict';

const Debug = require('debug');

/**
 * Retrieve and initialise server instance
 * @param {String} id
 * @param {Number} port
 * @param {Express} express
 * @param {Object} options
 *  - {Object} locales
 *  - {String} localesDir
 *  - {Object} middleware
 *  - {Object} pages
 *  - {Function} pageHandlerFactory
 *  - {Function} renderer
 *  - {DataStore} settings
 *  - {Object} templates
 *  - {String} templatesDir
 * @returns {Express}
 */
module.exports = function application (id, port, express, options) {
  const {
    coreMiddleware = [],
    locales,
    localesDir,
    middleware,
    pages = {},
    pageHandlerFactory,
    renderer,
    settings,
    templates,
    templatesDir
  } = options;
  const app = express();
  const debug = Debug(id);
  const knownKeys = [
    'coreMiddleware',
    'locales',
    'localesDir',
    'middleware',
    'pages',
    'pageHandlerFactory',
    'renderer',
    'settings',
    'templates',
    'templatesDir'
  ];

  // Load locales
  if (locales && localesDir) locales.load(localesDir);
  // Load templates
  if (templates && templatesDir) templates.load(templatesDir);

  // Store properties
  app.set('debug', debug);
  app.set('id', id);
  app.set('locales', locales);
  app.set('page', null);
  app.set('pages', pages);
  app.set('settings', settings);
  app.set('templates', templates);
  app.set('view', null);
  app.set('views', null);
  // Factory
  app.set('renderer', renderer && renderer(app));
  // Store unknown properties
  for (const key in options) {
    if (!~knownKeys.indexOf(key)) app.set(key, options[key]);
  }

  if (coreMiddleware.length) {
    coreMiddleware.forEach((middleware) => {
      app.use(middleware);
    });
  }

  // Register pre-route middleware stack
  if (middleware && middleware.pre) middleware.pre(app);

  // Init pages
  for (const id in pages) {
    const { pageFactory, routes } = pages[id];

    if (routes && routes.length) {
      const page = pageFactory(id, app);

      pages[id] = page;

      routes.forEach((route) => {
        debug('handling %s at %s', id, route);
        app.get(route, pageHandlerFactory(page));
      });
    }
  }

  // Register post-route middleware stack
  if (middleware && middleware.post) middleware.post(app);

  app.set('server', app.listen(port));
  debug(port ? `listening on: ${port}` : 'listening');

  return app;
};