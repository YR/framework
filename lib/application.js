'use strict';

var debugFactory = require('debug');

var BLACKLIST_KEYS = ['middleware', 'pageHandlerFactory', 'render', 'sourcepath'];

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
  var middleware = options.middleware,
      _options$pages = options.pages,
      pages = _options$pages === undefined ? {} : _options$pages,
      pageHandlerFactory = options.pageHandlerFactory,
      params = options.params,
      render = options.render;

  var app = express();
  var debug = debugFactory(id);

  // Store options
  for (var key in options) {
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
  if (middleware && middleware.register) {
    middleware.register(app);
  }
  if (params && params.register) {
    params.register(app);
  }

  // Init pages

  var _loop = function _loop(_id) {
    var _pages$_id = pages[_id],
        pageFactory = _pages$_id.pageFactory,
        routes = _pages$_id.routes;


    if (routes && routes.length) {
      var page = pageFactory(_id, app);

      pages[_id] = page;

      routes.forEach(function (route) {
        debug('handling %s at %s', _id, route);
        app.get(route, pageHandlerFactory(page));
      });
    }
  };

  for (var _id in pages) {
    _loop(_id);
  }

  // Register error middleware stack
  if (middleware && middleware.registerError) {
    middleware.registerError(app);
  }

  app.set('server', app.listen(port));
  debug(port ? 'listening on: ' + port : 'listening');

  return app;
};