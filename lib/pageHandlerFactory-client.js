'use strict';

var Page = require('./Page');

var current = null;
var pending = null;

/**
 * Handler factory for 'page'
 * @param {Page} page
 * @returns {Function}
 */
module.exports = function pageHandlerFactory(page) {
  return function pageHandler(req, res, next) {
    pending = page;
    changePage(req, res, function (err) {
      if (err) next(err);
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
    if (currentPage.containsState(Page.RENDERED)) {
      currentPage.appendState(Page.UNRENDERING);
      currentPage.unrender(req, res, function (err) {
        currentPage.appendState(-Page.UNRENDERING, -Page.RENDERED, Page.UNRENDERED);
        if (err) return done(err);
        currentPage.appendState(Page.UNHANDLING);
        currentPage.unhandle(req, res, function (err) {
          currentPage.appendState(-Page.UNHANDLING, -Page.HANDLED, Page.UNHANDLED);
          if (err) return done(err);
          if (--outstanding <= 0) setPage(req, res, done);
        });
      });
      // Not rendered yet, so only unhandle
    } else {
      currentPage.appendState(Page.UNHANDLING);
      currentPage.unhandle(req, res, function (err) {
        currentPage.appendState(-Page.UNHANDLING, -Page.HANDLED, Page.UNHANDLED);
        if (err) return done(err);
        if (--outstanding <= 0) setPage(req, res, done);
      });
    }
  }

  pendingPage.state = 0;
  pendingPage.appendState(Page.INITING);
  pendingPage.init(function (err) {
    pendingPage.appendState(-Page.INITING, Page.INITED);
    // Protect against possible reassignment to new pending page
    if (pendingPage !== pending) return;
    if (err) return done(err);
    if (--outstanding <= 0) setPage(req, res, done);
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

  if (currentPage.state === Page.INITED) {
    current = currentPage;
    pending = null;
    res.app.set('page', currentPage);
    currentPage.appendState(Page.HANDLING);
    currentPage.handle(req, res, function (err) {
      currentPage.appendState(-Page.HANDLING);
      if (err) return done(err);
      // Protect against possible reassignment to new page
      if (pending || currentPage !== current || currentPage.state !== Page.INITED) return;
      currentPage.appendState(Page.HANDLED, Page.RENDERING);
      currentPage.render(req, res, function (err) {
        currentPage.appendState(-Page.RENDERING, Page.RENDERED);
        done(err);
      });
    });
  }
}