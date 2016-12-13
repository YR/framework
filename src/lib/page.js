'use strict';

/**
 * Page factory
 * @param {Express} app
 * @param {String} id
 * @param {Object} options
 *  - {Object} config
 *  - {Function} handler
 *  - {Boolean} hasOwnLayout
 *  - {String} localesDir
 *  - {String} templatesDir
 * @returns {Object}
 */
module.exports = function page (app, id, options) {
  const { config, handler, hasOwnLayout, localesDir, templatesDir } = options;
  const locales = app.get('locales');
  const settings = app.get('settings');
  const templates = app.get('templates');

  // Store page specific settings
  if (settings && config) settings.set(id, config);
  // Load page specific locale data
  if (locales && localesDir) locales.load(localesDir);
  // Load page specific templates
  if (templates && templatesDir) templates.load(templatesDir);

  return {
    handler,
    hasOwnLayout
  };
};