'use strict';

const Page = require('../../src/lib/Page');

module.exports = function create (id, app) {
  return new FooPage(id, app);
};

class FooPage extends Page {
  constructor (id, app) {
    super(id, app, {
      config: {}
    });
  }
  handle (req, res, done) {
    res.write('f');
    res.write('o');
    res.write('o');
    super.handle(req, res, done);
  }
}