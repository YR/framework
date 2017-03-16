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
module.exports = function pageHandlerFactory(page) {
  return function pageHandler(req, res, next) {
    pending = page;
    res.write = resWriteFactory(page, req, res);
    changePage(req, res, err => {
      if (err) {
        next(err);
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
      currentPage.appendState(UNRENDERING);
      currentPage.unrender(req, res, err => {
        currentPage.appendState(-UNRENDERING, -RENDERED, UNRENDERED);
        if (err) {
          return done(err);
        }
        currentPage.appendState(UNHANDLING);
        currentPage.unhandle(req, res, err => {
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
      currentPage.appendState(UNHANDLING);
      currentPage.unhandle(req, res, err => {
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
  pendingPage.appendState(INITING);
  res.time('init');
  pendingPage.init(err => {
    res.time('init');
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
  const currentPage = pending;

  if (currentPage.state === INITED) {
    current = currentPage;
    pending = null;
    res.app.set('page', currentPage);
    currentPage.appendState(HANDLING);
    res.time('handle');
    currentPage.handle(req, res, err => {
      res.time('handle');
      currentPage.appendState(-HANDLING);
      if (err) {
        return done(err);
      }
      // Protect against possible reassignment to new page
      if (pending || currentPage !== current || currentPage.state !== INITED) {
        return;
      }
      currentPage.appendState(HANDLED, RENDERING);
      res.time('render');
      currentPage.render(req, res, err => {
        res.time('render');
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
      page.appendState(RENDERING);
      res.time('write');
      page.render(req, res, () => {
        res.time('write');
        page.appendState(-RENDERING);
      });
    }
  };
}
