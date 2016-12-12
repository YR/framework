'use strict';

const Debug = require('debug');

/**
 * Retrieve and initialise server instance
 * @param {Express} express
 * @param {String} id
 * @param {Object} config
 *  - {Function} handler
 *  - {Function} renderer
 *  - {String} locales
 *  - {Object} middleware
 *  - {Function} routes
 *  - {Array<String>} templates
 * @param {Object} options
 *  - {Function} localeLoader
 *  - {DataStore} settings
 * @returns {Express}
 */
module.exports = function application (express, id, config, options) {
  const { middleware } = config;
  const { settings } = options;
  const app = express();
  const port = settings.get('port');

  // Store properties
  options.debug = Debug(id);
  options.id = id;
  options.handlers = {};
  options.renderers = {};
  options.controller = config.controller;
  options.layout = config.layout;
  for (const key in options) {
    app.set(key, options[key]);
  }

  // Load locales
  if (options.localeLoader && config.locales) options.localeLoader(config.locales, settings.get('locale'));
  // Load templates (server)
  if (options.templateCache && config.templates) options.templateCache.load(config.templates);

  // Register pre-route middleware stack
  if (middleware.pre) middleware.pre(app);

  // Init components
  if (config.controller) config.controller.init(id, app);
  if (config.layout) config.layout.init(id, app);
  if (config.routes) config.routes.init(app, settings);

  // Register post-route middleware stack
  if (middleware.post) middleware.post(app);

  app.set('server', app.listen(port));
  options.debug(port ? `listening on: ${port}` : 'listening');

  return app;
};