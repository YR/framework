'use strict';

const clock = require('@yr/clock');

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
   */
  return function pageHandle(req, res, next) {
    res.time('route');
    pending = page;
    res.app.set('page', page);
    changePage(req, res, err => {
      if (err != null) {
        return void next(err);
      }
    });
  };
};

if (process.env.NODE_ENV !== 'production') {
  /**
   * Reset current/pending page state
   * Private: this is only for testing!
   */
  module.exports.__reset = function () {
    current = null;
    pending = null;
  };
}

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

  if (currentPage != null && currentPage !== pendingPage) {
    outstanding++;
    resetPage(currentPage, req, res, err => {
      if (err != null) {
        return void done(err);
      }
      if (--outstanding <= 0) {
        setPage(req, res, done);
      }
    });
  }

  pendingPage.state = 0;
  pendingPage.debug('initing');
  pendingPage.appendState(INITING);
  res.time('init');
  pendingPage.init(req, res, err => {
    res.time('init');
    pendingPage.debug('inited');
    pendingPage.appendState(-INITING, INITED);
    if (err != null) {
      return void done(err);
    }
    // Make sure flag is set in case super not called
    if (!pendingPage.initialised) {
      pendingPage.initialised = true;
    }
    // Protect against possible reassignment to new pending page
    if (pendingPage !== pending) {
      return void done();
    }
    if (--outstanding <= 0) {
      setPage(req, res, done);
    }
  });
}

/**
 * Reset currently active 'page'
 * @param {Page} page
 * @param {Request} req
 * @param {Response} res
 * @param {Function} done
 */
function resetPage(page, req, res, done) {
  // Unrender before unhandling
  if (page.containsState(RENDERED)) {
    unrenderPage(page, req, res, done);
    // Not rendered yet, so only unhandle
  } else {
    unhandlePage(page, req, res, done);
  }
}

/**
 * Unrender currently active 'page'
 * @param {Page} page
 * @param {Request} req
 * @param {Response} res
 * @param {Function} done
 */
function unrenderPage(page, req, res, done) {
  page.debug('unrendering');
  page.appendState(UNRENDERING);
  page.unrender(req, res, err => {
    page.debug('unrendered');
    page.appendState(-UNRENDERING, -RENDERED, UNRENDERED);
    if (err != null) {
      return void done(err);
    }
    unhandlePage(page, req, res, done);
  });
}

/**
 * Unhandle currently active 'page'
 * @param {Page} page
 * @param {Request} req
 * @param {Response} res
 * @param {Function} done
 */
function unhandlePage(page, req, res, done) {
  page.debug('unhandling');
  page.appendState(UNHANDLING);
  page.unhandle(req, res, err => {
    page.debug('unhandled');
    page.appendState(-UNHANDLING, -HANDLED, UNHANDLED);
    done(err);
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

  if (!currentPage) {
    return void done();
  }

  if (currentPage.state === INITED) {
    current = currentPage;
    pending = null;
    currentPage.debug('handling');
    currentPage.appendState(HANDLING);
    res.time('handle');
    currentPage.handle(req, res, err => {
      res.time('handle');
      currentPage.debug('handled');
      currentPage.appendState(-HANDLING);
      if (err != null) {
        return void done(err);
      }
      // Guard against possible reassignment to new page
      if (pending != null || currentPage !== current) {
        currentPage.debug('aborting render', currentPage.state);
        return void done();
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
    // Trigger prerender if handle is async and not a reload
    if (!req.reloaded) {
      clock.frame(() => {
        // Guard against possible reassignment to new page
        if (pending == null && currentPage === current && currentPage.containsState(HANDLING)) {
          res.write();
        }
      });
    }
  }
}
