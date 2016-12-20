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
 *  - {Object} renderer
 *  - {DataStore} settings
 *  - {Object} templates
 *  - {String} templatesDir
 * @returns {Express}
 */
module.exports = function application(id, port, express, options) {
  var locales = options.locales,
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

  // Store properties
  app.set('debug', debug);
  app.set('id', id);
  app.set('locales', locales);
  app.set('page', null);
  app.set('pages', pages);
  app.set('renderer', renderer);
  app.set('settings', settings);
  app.set('templates', templates);
  app.set('view', null);
  app.set('views', null);

  // Load locales
  if (locales && localesDir) locales.load(localesDir);
  // Load templates
  if (templates && templatesDir) templates.load(templatesDir);

  // Register pre-route middleware stack
  if (middleware && middleware.pre) middleware.pre(app);

  // Init pages

  var _loop = function _loop(_id) {
    var _pages$_id = pages[_id],
        pageFactory = _pages$_id.pageFactory,
        routes = _pages$_id.routes;

    var page = pageFactory(_id, app);

    pages[_id] = page;

    routes.forEach(function (route) {
      debug('handling %s at %s', _id, route);
      app.get(route, pageHandlerFactory(page));
    });
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