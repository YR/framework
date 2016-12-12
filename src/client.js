'use strict';

const application = require('./lib/application');
const express = require('@yr/express-client');

/**
 * Retrieve and initialise client instance
 * @param {String} id
 * @param {Object} options
 *  - {Function} handler
 *  - {Function} localesLoader
 *  - {Object} middleware
 *  - {Function} renderer
 *  - {Function} routes
 *  - {DataStore} settings
 * @returns {Express}
 */
module.exports = function server (id, options) {
  return application(express, id, options);
};