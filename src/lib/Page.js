'use strict';

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
  constructor (id, app, options) {
    this.app = app;
    this.id = id;
    this.active = false;

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
   * Will handle 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  willHandle (req, res, done) {
    done();
  }

  /**
   * Handle 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  handle (req, res, done) {
    this.active = true;
    done();
  }

  /**
   * Render with 'props'
   * @param {Object} props
   * @param {Function} done
   */
  render (props, done) {
    done();
  }

  /**
   * Will unhandle 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  willUnhandle (req, res, done) {
    done();
  }

  /**
   * Unhandle 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  unhandle (req, res, done) {
    this.active = false;
    done();
  }

  /**
   * Unrender with 'props'
   * @param {Object} props
   * @param {Function} done
   */
  unrender (props, done) {
    done();
  }
};