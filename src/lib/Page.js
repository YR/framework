'use strict';

const INITED = 1;
const HANDLED = 2;
const RENDERED = 4;

module.exports = class Page {
  /**
   * Page constructor
   * @param {String} id
   * @param {Express} app
   * @param {Object} options
   *  - {Object} config
   *  - {String} localesDir
   *  - {String} templatesDir
   */
  constructor (id, app, options = {}) {
    this.app = app;
    this.id = id;
    this.state = 0;

    const { config, localesDir, templatesDir } = options;
    const locales = app.get('locales');
    const settings = app.get('settings');
    const templates = app.get('templates');

    // Store page specific settings
    if (settings && config) settings.set(id, config);
    // Load page specific locale data
    if (locales && localesDir) locales.load(localesDir);
    // Load page specific templates
    if (templates && templatesDir) templates.load(templatesDir);
  }

  /**
   * Initialize
   * @param {Function} done
   */
  init (done) {
    this.state |= INITED;
    done();
  }

  /**
   * Handle 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  handle (req, res, done) {
    this.state |= HANDLED;
    done();
  }

  /**
   * Render 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  render (req, res, done) {
    this.state |= RENDERED;
    done();
  }

  /**
   * Unhandle 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  unhandle (req, res, done) {
    this.state &= ~HANDLED;
    done();
  }

  /**
   * Unrender 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  unrender (req, res, done) {
    this.state &= ~RENDERED;
    done();
  }
};

module.exports.INITED = INITED;
module.exports.HANDLED = HANDLED;
module.exports.RENDERED = RENDERED;