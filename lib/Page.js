'use strict';

var runtime = require('@yr/runtime');

var STATE = {
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

module.exports = function () {
  /**
   * Page constructor
   * @param {String} id
   * @param {Express} app
   */
  function Page(id, app) {
    babelHelpers.classCallCheck(this, Page);

    this.app = app;
    this.id = id;
    this.state = 0;
    this.initialised = false;
  }

  /**
   * Apply 'flags' to state
   * Negative flags will be removed
   * @param {Array} flags
   */


  Page.prototype.appendState = function appendState() {
    for (var _len = arguments.length, flags = Array(_len), _key = 0; _key < _len; _key++) {
      flags[_key] = arguments[_key];
    }

    for (var i = 0, n = flags.length; i < n; i++) {
      // Remove if negative
      if (flags[i] < 0) {
        this.state &= ~(flags[i] * -1);
      } else {
        this.state |= flags[i];
      }
    }
  };

  /**
   * Determine if 'flags' are set on state
   * Negative flags will test absence
   * @param {Array} flags
   * @returns {Boolean}
   */


  Page.prototype.containsState = function containsState() {
    for (var _len2 = arguments.length, flags = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      flags[_key2] = arguments[_key2];
    }

    for (var i = 0, n = flags.length; i < n; i++) {
      if (flags[i] < 0 && this.state & flags[i] * -1 || flags[i] > 0 && !(this.state & flags[i])) {
        return false;
      }
    }
    return true;
  };

  /**
   * Initialize
   * @param {Function} done
   */


  Page.prototype.init = function init(done) {
    this.initialised = true;
    if (done) {
      done();
    }
  };

  /**
   * Handle 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */


  Page.prototype.handle = function handle(req, res, done) {
    if (done) {
      done();
    }
  };

  /**
   * Render 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */


  Page.prototype.render = function render(req, res, done) {
    if (done) {
      done();
    }
  };

  /**
   * Unrender 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */


  Page.prototype.unrender = function unrender(req, res, done) {
    if (done) {
      done();
    }
  };

  /**
   * Unhandle 'req'
   * @param {Request} req
   * @param {Response} res
   * @param {Function} done
   */


  Page.prototype.unhandle = function unhandle(req, res, done) {
    if (done) {
      done();
    }
  };

  /**
   * Rerender
   * @param {Function} [done]
   */


  Page.prototype.rerender = function rerender(done) {
    var _this = this;

    // Prevent rerender if currently processing
    if (runtime.isBrowser && this.containsState(STATE.RENDERED)) {
      var _app$getCurrentContex = this.app.getCurrentContext(),
          req = _app$getCurrentContex.req,
          res = _app$getCurrentContex.res;

      this.appendState(-STATE.RENDERED, STATE.RENDERING);
      res.time('rerender');
      this.render(req, res, function () {
        res.time('rerender');
        _this.appendState(-STATE.RENDERING, STATE.RENDERED);
        if (done) {
          done();
        }
      });
    }
  };

  return Page;
}();

for (var prop in STATE) {
  module.exports[prop] = STATE[prop];
}