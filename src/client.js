'use strict';

const application = require('./lib/application');
const express = require('@yr/express-client');
const pageHandlerFactory = require('./lib/pageHandlerFactory-client');

/**
 * Retrieve and initialise client instance
 * @param {String} id
 * @param {Object} options
 *  - {Object} middleware
 *  - {Object} pages
 *  - {Object} renderer
 *  - {DataStore} settings
 * @returns {Express}
 */
module.exports = function server (id, options) {
  if (!options.pageHandlerFactory) options.pageHandlerFactory = pageHandlerFactory;

  return application(id, null, express, options);
};