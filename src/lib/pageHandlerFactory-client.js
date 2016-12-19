'use strict';

const Page = require('./Page');

let current = null;
let pending = null;

/**
 * Handler factory for 'page'
 * @param {Page} page
 * @returns {Function}
 */
module.exports = function pageHandlerFactory (page) {
  return function pageHandler (req, res, next) {
    pending = page;
    changePage(req, res, (err) => {
      if (err) next(err);
    });
  };
};

/**
 * Change page
 * @param {Request} req
 * @param {Response} res
 * @param {Function} done
 */
function changePage (req, res, done) {
  const currentPage = current;
  const pendingPage = pending;
  let outstanding = 1;

  current = null;

  if (currentPage) {
    outstanding++;
    currentPage.unhandle(req, res, (err) => {
      if (err) return done(err);
      // Unrender if already rendered
      if (currentPage.state & Page.RENDERED) {
        currentPage.unrender(req, res, (err) => {
          if (err) return done(err);
          if (--outstanding <= 0) setPage(req, res, done);
        });
      } else if (--outstanding <= 0) {
        setPage(req, res, done);
      }
    });
  }

  pendingPage.init((err) => {
    // Protect against possible reassignment to new pending page
    if (pendingPage === pending) {
      if (err) return done(err);
      if (--outstanding <= 0) setPage(req, res, done);
    }
  });
}

/**
 * Set current page
 * @param {Request} req
 * @param {Response} res
 * @param {Function} done
 */
function setPage (req, res, done) {
  const currentPage = pending;

  current = currentPage;
  pending = null;
  res.app.set('page', current);
  currentPage.handle(req, res, (err) => {
    if (err) return done(err);
    // Protect against possible reassignment to new current page
    if (!pending && currentPage === current && !(currentPage.state & Page.RENDERED)) {
      currentPage.render(req, res, done);
    }
  });
}