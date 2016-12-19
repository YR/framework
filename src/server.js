'use strict';

const application = require('./lib/application');
const cacheControl = require('./lib/cacheControl');
const express = require('@yr/express');
const http = require('http');
const https = require('https');
const pageHandlerFactory = require('./lib/pageHandlerFactory-server');

// Set max socket limit
http.globalAgent.maxSockets = Infinity;
https.globalAgent.maxSockets = Infinity;

// Patch express.response with cacheControl method
cacheControl(express.response);

/**
 * Retrieve and initialise server instance
 * @param {String} id
 * @param {Number} port
 * @param {Object} options
 *  - {Object} locales
 *  - {String} localesDir
 *  - {Object} middleware
 *  - {Object} pages
 *  - {Object} renderer
 *  - {DataStore} settings
 *  - {Object} templates
 *  - {String} templatesDir
 * @returns {Express}
 */
module.exports = function server (id, port, options) {
  if (!options.pageHandlerFactory) options.pageHandlerFactory = pageHandlerFactory;

  const app = application(id, port, express, options);

  app.disable('x-powered-by');
  return app;
};