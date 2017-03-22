'use strict';

var _require = require('./Page'),
    INITING = _require.INITING,
    INITED = _require.INITED,
    HANDLING = _require.HANDLING,
    HANDLED = _require.HANDLED,
    RENDERING = _require.RENDERING,
    RENDERED = _require.RENDERED,
    UNRENDERING = _require.UNRENDERING,
    UNRENDERED = _require.UNRENDERED,
    UNHANDLING = _require.UNHANDLING,
    UNHANDLED = _require.UNHANDLED;

var current = null;
var pending = null;

/**
 * Handler factory for 'page'
 * @param {Page} page
 * @returns {Function}
 */
module.exports = function pageHandler(page) {
  /**
   * Page handle factory
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   */
  return function pageHandle(req, res, next) {
    pending = page;
    res.write = resWriteFactory(page, req, res);
    changePage(req, res, function (err) {
      if (err) {
        return next(err);
      }
    });
  };
};

/**
 * Reset current/pending page state
 * Warning: this is only for testing!
 */
module.exports.reset = function () {
  current = null;
  pending = null;
};

/**
 * Change page
 * @param {Request} req
 * @param {Response} res
 * @param {Function} done
 */
function changePage(req, res, done) {
  var currentPage = current;
  var pendingPage = pending;
  var outstanding = 1;

  current = null;

  if (currentPage) {
    outstanding++;
    // Unrender before unhandling
    if (currentPage.containsState(RENDERED)) {
      currentPage.debug('unrendering');
      currentPage.appendState(UNRENDERING);
      currentPage.unrender(req, res, function (err) {
        currentPage.debug('unrendered');
        currentPage.appendState(-UNRENDERING, -RENDERED, UNRENDERED);
        if (err) {
          return done(err);
        }
        currentPage.debug('unhandling');
        currentPage.appendState(UNHANDLING);
        currentPage.unhandle(req, res, function (err) {
          currentPage.debug('unhandled');
          currentPage.appendState(-UNHANDLING, -HANDLED, UNHANDLED);
          if (err) {
            return done(err);
          }
          if (--outstanding <= 0) {
            setPage(req, res, done);
          }
        });
      });
      // Not rendered yet, so only unhandle
    } else {
      currentPage.debug('unhandling');
      currentPage.appendState(UNHANDLING);
      currentPage.unhandle(req, res, function (err) {
        currentPage.debug('unhandled');
        currentPage.appendState(-UNHANDLING, -HANDLED, UNHANDLED);
        if (err) {
          return done(err);
        }
        if (--outstanding <= 0) {
          setPage(req, res, done);
        }
      });
    }
  }

  pendingPage.state = 0;
  pendingPage.debug('initing');
  pendingPage.appendState(INITING);
  res.time('init');
  pendingPage.init(function (err) {
    res.time('init');
    pendingPage.debug('inited');
    pendingPage.appendState(-INITING, INITED);
    // Make sure flag is set in case super not called
    if (!pendingPage.initialised) {
      pendingPage.initialised = true;
    }
    // Protect against possible reassignment to new pending page
    if (pendingPage !== pending) {
      return;
    }
    if (err) {
      return done(err);
    }
    if (--outstanding <= 0) {
      setPage(req, res, done);
    }
  });
}

/**
 * Set current page
 * @param {Request} req
 * @param {Response} res
 * @param {Function} done
 */
function setPage(req, res, done) {
  var currentPage = pending;

  if (currentPage.state === INITED) {
    current = currentPage;
    pending = null;
    res.app.set('page', currentPage);
    currentPage.debug('handling');
    currentPage.appendState(HANDLING);
    res.time('handle');
    currentPage.handle(req, res, function (err) {
      res.time('handle');
      currentPage.debug('handled');
      currentPage.appendState(-HANDLING);
      if (err) {
        return done(err);
      }
      // Protect against possible reassignment to new page
      if (pending || currentPage !== current || currentPage.state !== INITED) {
        return;
      }
      currentPage.debug('rendering');
      currentPage.appendState(HANDLED, RENDERING);
      res.time('render');
      currentPage.render(req, res, function (err) {
        res.time('render');
        currentPage.debug('rendered');
        currentPage.appendState(-RENDERING, RENDERED);
        done(err);
      });
    });
  }
}

/**
 * Factory for partial page render function
 * @param {Page} page
 * @param {Request} req
 * @param {Response} res
 * @returns {Function}
 */
function resWriteFactory(page, req, res) {
  return function write() {
    // Only relevant during HANDLING phase
    if (page === current && page.state === INITED | HANDLING) {
      page.debug('rendering');
      page.appendState(RENDERING);
      res.time('write');
      page.render(req, res, function () {
        res.time('write');
        page.debug('rendered');
        page.appendState(-RENDERING);
      });
    }
  };
}