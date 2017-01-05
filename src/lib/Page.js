'use strict';

const runtime = require('@yr/runtime');

const STATE = {
  INITING: 1,
  INITED: 2,
  HANDLING: 4,
  HANDLED: 8,
  RENDERING: 16,
  RENDERED: 32,
  UNRENDERING: 64,
  UNRENDERED: 128,
  UNHANDLING: 256,
  UNHANDLED: 512
};

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
   * Apply 'flags' to state
   * Negative flags will be removed
   * @param {Array} flags
   */
  appendState (...flags) {
    for (let i = 0, n = flags.length; i < n; i++) {
      // Remove if negative
      if (flags[i] < 0) {
        this.state &= ~(flags[i] * -1);
      } else {
        this.state |= flags[i];
      }
    }
  }

  /**
   * Determine if 'flags' are set on state
   * Negative flags will test absence
   * @param {Array} flags
   * @returns {Boolean}
   */
  containsState (...flags) {
    for (let i = 0, n = flags.length; i < n; i++) {
      if ((flags[i] < 0 && this.state & (flags[i] * -1)
        || (flags[i] > 0 && !(this.state & flags[i])))) {
          return false;
      }
    }
    return true;
  }

  /**
   * Initialize
   * @param {Function} done
   */
  init (done) {
    if (done) done();
  }

  /**
   * Handle 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  handle (req, res, done) {
    if (done) done();
  }

  /**
   * Render 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  render (req, res, done) {
    if (done) done();
  }

  /**
   * Unrender 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  unrender (req, res, done) {
    if (done) done();
  }

  /**
   * Unhandle 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  unhandle (req, res, done) {
    if (done) done();
  }

  /**
   * Rerender
   * @param {Function} done
   */
  rerender (done) {
    // Prevent rerender if currently processing
    if (runtime.isBrowser && this.containsState(STATE.RENDERED)) {
      const { req, res } = this.app.getCurrentContext();

      this.appendState(-STATE.RENDERED, STATE.RENDERING);
      this.render(req, res, () => {
        this.appendState(-STATE.RENDERING, STATE.RENDERED);
        done();
      });
    }
  }
};

for (const prop in STATE) {
  module.exports[prop] = STATE[prop];
}