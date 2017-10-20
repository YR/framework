'use strict';

const debugFactory = require('debug');

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
   */
  constructor(id, app) {
    this.app = app;
    this.debug = debugFactory(`${app.get('id')}:${id}`);
    this.id = id;
    this.initialised = false;
    this.state = 0;
  }

  /**
   * Apply 'flags' to state
   * Negative flags will be removed
   * @param {Array} flags
   */
  appendState(...flags) {
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
  containsState(...flags) {
    for (let i = 0, n = flags.length; i < n; i++) {
      if ((flags[i] < 0 && this.state & (flags[i] * -1)) || (flags[i] > 0 && !(this.state & flags[i]))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Initialize
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  init(req, res, done) {
    this.initialised = true;
    if (done != null) {
      done();
    }
  }

  /**
   * Handle 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  handle(req, res, done) {
    if (done != null) {
      done();
    }
  }

  /**
   * Render 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  render(req, res, done) {
    if (done != null) {
      done();
    }
  }

  /**
   * Unrender 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  unrender(req, res, done) {
    if (done != null) {
      done();
    }
  }

  /**
   * Unhandle 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */
  unhandle(req, res, done) {
    if (done != null) {
      done();
    }
  }
};

for (const prop in STATE) {
  module.exports[prop] = STATE[prop];
}
