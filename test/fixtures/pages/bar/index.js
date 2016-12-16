'use strict';

const Page = require('../../../../src/lib/Page');

module.exports = function create (id, app) {
  return new BarPage(id, app);
};

class BarPage extends Page {
  constructor (id, app) {
    super(id, app, {
      config: {}
    });
  }
  handler (req, res, done) {
    res.write('bar');
    done();
  }
}