'use strict';

var Debug = require('debug');

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
module.exports = function application(id, port, express, options) {
  var _options$coreMiddlewa = options.coreMiddleware,
      coreMiddleware = _options$coreMiddlewa === undefined ? [] : _options$coreMiddlewa,
      locales = options.locales,
      localesDir = options.localesDir,
      middleware = options.middleware,
      _options$pages = options.pages,
      pages = _options$pages === undefined ? {} : _options$pages,
      pageHandlerFactory = options.pageHandlerFactory,
      renderer = options.renderer,
      settings = options.settings,
      templates = options.templates,
      templatesDir = options.templatesDir;

  var app = express();
  var debug = Debug(id);
  var knownKeys = ['coreMiddleware', 'locales', 'localesDir', 'middleware', 'pages', 'pageHandlerFactory', 'renderer', 'settings', 'templates', 'templatesDir'];

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
  for (var key in options) {
    if (!~knownKeys.indexOf(key)) app.set(key, options[key]);
  }

  if (coreMiddleware.length) {
    coreMiddleware.forEach(function (middleware) {
      app.use(middleware(app));
    });
  }

  // Register pre-route middleware stack
  if (middleware && middleware.pre) middleware.pre(app);

  // Init pages

  var _loop = function _loop(_id) {
    var _pages$_id = pages[_id],
        pageFactory = _pages$_id.pageFactory,
        routes = _pages$_id.routes;


    if (routes && routes.length) {
      (function () {
        var page = pageFactory(_id, app);

        pages[_id] = page;

        routes.forEach(function (route) {
          debug('handling %s at %s', _id, route);
          app.get(route, pageHandlerFactory(page));
        });
      })();
    }
  };

  for (var _id in pages) {
    _loop(_id);
  }

  // Register post-route middleware stack
  if (middleware && middleware.post) middleware.post(app);

  app.set('server', app.listen(port));
  debug(port ? 'listening on: ' + port : 'listening');

  return app;
};