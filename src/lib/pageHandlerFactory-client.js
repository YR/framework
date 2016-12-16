'use strict';

let changing = false;
let current = null;
let outstanding = 0;
let pending = null;

/**
 * Handler factory for 'page'
 * @param {Page} page
 * @returns {Function}
 */
module.exports = function pageHandlerFactory (page) {
  return function pageHandler (req, res, next) {
    if (changing) {
      if (pending) {
        // outstanding++;
      }
    }
    changing = true;
    pending = page;
    changePage(req, res, (err) => {
      changing = false;
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
  outstanding = 1;

  if (current) {
    outstanding++;
    current.unhandle(req, res, (err) => {
      current = null;
      if (err) return done(err);
      if (--outstanding <= 0) setPage(req, res, done);
    });
  }

  pending.willHandle(req, res, (err) => {
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
function setPage (req, res, done) {
  current = pending;
  pending = null;
  res.app.set('page', current);
  current.handle(req, res, done);
}