'use strict';

const {
  INITING,
  INITED,
  HANDLING,
  HANDLED,
  RENDERING,
  RENDERED,
  UNRENDERING,
  UNRENDERED,
  UNHANDLING,
  UNHANDLED
} = require('./Page');

let current = null;
let pending = null;

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
   * @returns {void}
   */
  return function pageHandle(req, res, next) {
    pending = page;
    changePage(req, res, err => {
      if (err) {
        return void next(err);
      }
    });
  };
};

/**
 * Reset current/pending page state
 * Warning: this is only for testing!
 */
module.exports.reset = function() {
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
  const currentPage = current;
  const pendingPage = pending;
  let outstanding = 1;

  current = null;

  if (currentPage) {
    outstanding++;
    // Unrender before unhandling
    if (currentPage.containsState(RENDERED)) {
      currentPage.debug('unrendering');
      currentPage.appendState(UNRENDERING);
      currentPage.unrender(req, res, err => {
        currentPage.debug('unrendered');
        currentPage.appendState(-UNRENDERING, -RENDERED, UNRENDERED);
        if (err) {
          return void done(err);
        }
        currentPage.debug('unhandling');
        currentPage.appendState(UNHANDLING);
        currentPage.unhandle(req, res, err => {
          currentPage.debug('unhandled');
          currentPage.appendState(-UNHANDLING, -HANDLED, UNHANDLED);
          if (err) {
            return void done(err);
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
      currentPage.unhandle(req, res, err => {
        currentPage.debug('unhandled');
        currentPage.appendState(-UNHANDLING, -HANDLED, UNHANDLED);
        if (err) {
          return void done(err);
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
  pendingPage.init(err => {
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
      return void done(err);
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
  const currentPage = pending;

  if (currentPage.state === INITED) {
    current = currentPage;
    pending = null;
    res.app.set('page', currentPage);
    currentPage.debug('handling');
    currentPage.appendState(HANDLING);
    res.time('handle');
    currentPage.handle(req, res, err => {
      res.time('handle');
      currentPage.debug('handled');
      currentPage.appendState(-HANDLING);
      if (err) {
        return void done(err);
      }
      // Protect against possible reassignment to new page
      if (pending || currentPage !== current || currentPage.state !== INITED) {
        return;
      }
      currentPage.debug('rendering');
      currentPage.appendState(HANDLED, RENDERING);
      res.time('render');
      currentPage.render(req, res, err => {
        res.time('render');
        currentPage.debug('rendered');
        currentPage.appendState(-RENDERING, RENDERED);
        done(err);
      });
    });
  }
}
