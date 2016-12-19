'use strict';

const cacheControl = require('../src/lib/cacheControl');
const clientPageHandlerFactory = require('../src/lib/pageHandlerFactory-client');
const expect = require('expect.js');
const fooPage = require('./fixtures/pages/foo');
const Page = require('../src/lib/Page');
const request = require('supertest');
const server = require('../src/server');
let app;

describe('framework', function () {
  afterEach(function (done) {
    if (app) {
      try {
        app.removeAllListeners();
        app.get('server').close(done);
      } catch (err) {
        done();
      }
    } else {
      done();
    }
  });

  describe('cacheControl', function () {
    beforeEach(function () {
      this.res = {
        set: function (key, value) {
          this[key] = value;
        }
      };
      cacheControl(this.res);
    });

    it('should set no-cache when passed "false"', function () {
      this.res.cacheControl(false);
      expect(this.res['Cache-Control']).to.eql('private, no-cache');
    });
    it('should set no-cache when passed "0"', function () {
      this.res.cacheControl(0);
      expect(this.res['Cache-Control']).to.eql('private, no-cache');
    });
    it('should convert a maxage value passed as String', function () {
      this.res.cacheControl('1hr');
      expect(this.res['Cache-Control']).to.eql('public, max-age=3600');
    });
    it('should add a maxage value passed as Number', function () {
      this.res.cacheControl(3600);
      expect(this.res['Cache-Control']).to.eql('public, max-age=3600');
    });
    it('should pass through cache value from upstream header', function () {
      const upstream = {
        ['cache-control']: 'public, max-age=360'
      };

      this.res.cacheControl('1hr', upstream);
      expect(this.res['Cache-Control']).to.eql('public, max-age=360');
    });
    it('should pass through shortest cache value from multiple upstream headers', function () {
      const upstream = [
        { ['cache-control']: 'public, max-age=360' },
        { ['cache-control']: 'public, max-age=350' }
      ];

      this.res.cacheControl('1hr', upstream);
      expect(this.res['Cache-Control']).to.eql('public, max-age=350');
    });
    it('should fall back to passed maxage when upstream header does not contain "cache-control"', function () {
      const upstream = {};

      this.res.cacheControl('1hr', upstream);
      expect(this.res['Cache-Control']).to.eql('public, max-age=3600');
    });
    it('should fall back to passed maxage when multiple upstream headers do not contain "cache-control"', function () {
      const upstream = [{ }, { }];

      this.res.cacheControl('1hr', upstream);
      expect(this.res['Cache-Control']).to.eql('public, max-age=3600');
    });
    it('should throw when passed an invalid value', function () {
      try {
        this.res.cacheControl(true);
        expect.fail();
      } catch (err) {
        expect(err).to.be.an(Error);
      }
      try {
        this.res.cacheControl('');
        expect.fail();
      } catch (err) {
        expect(err).to.be.an(Error);
      }
      try {
        this.res.cacheControl('foo');
        expect.fail();
      } catch (err) {
        expect(err).to.be.an(Error);
      }
    });
  });

  describe('server application', function () {
    it('should initialize an app instance', function () {
      app = server('foo', 8080, {});
      expect(app).to.have.property('get');
    });
    it('should define settings on the app instance', function () {
      app = server('foo', 8080, {});
      expect(app.get('id')).to.equal('foo');
    });
    it('should initialize a page', function () {
      app = server('foo', 8080, {
        pages: {
          foo: { pageFactory: fooPage, routes: ['/foo'] }
        }
      });
      expect(app.get('pages')).to.have.property('foo');
      expect(app.get('pages').foo).to.have.property('id', 'foo');
    });
    it('should handle a matching route', function (done) {
      app = server('foo', 8080, {
        pages: {
          foo: { pageFactory: fooPage, routes: ['/foo'] }
        }
      });
      request(app)
        .get('/foo')
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.equal('foo');
          done();
        });
    });
  });

  describe('client application', function () {
    describe('pageHandler', function () {
      let called;

      beforeEach(function () {
        called = [];
        app = {
          page: null,
          get (key) { },
          set (key, value) {
            this.page = value;
          }
        };
      });

      it('should handle a page request', function (done) {
        class P extends Page {
          init (done) {
            called.push('init');
            super.init(done);
          }
          handle (req, res, done) {
            called.push('handle');
            super.handle(req, res, done);
          }
          render (req, res, done) {
            called.push('render');
            super.render(req, res, done);
          }
        }

        app = {
          get (key) {},
          set (key, value) {
            expect(key).to.equal('page');
            expect(value).to.equal(page);
          }
        };
        const page = new P('page', app);
        const handler = clientPageHandlerFactory(page);

        handler({}, { app }, done);
        expect(called).to.eql(['init', 'handle', 'render']);
        expect(page.state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
        done();
      });
      it('should unhandle an existing page request', function (done) {
        class P1 extends Page {
          init (done) {
            called.push('init1');
            super.init(done);
          }
          handle (req, res, done) {
            called.push('handle1');
            super.handle(req, res, done);
          }
          render (req, res, done) {
            called.push('render1');
            super.render(req, res, done);
          }
          unhandle (req, res, done) {
            called.push('unhandle1');
            super.unhandle(req, res, done);
          }
          unrender (req, res, done) {
            called.push('unrender1');
            super.unrender(req, res, done);
          }
        }
        class P2 extends Page {
          init (done) {
            called.push('init2');
            super.init(done);
          }
          handle (req, res, done) {
            called.push('handle2');
            super.handle(req, res, done);
          }
          render (req, res, done) {
            called.push('render2');
            super.render(req, res, done);
          }
          unhandle (req, res, done) {
            called.push('unhandle2');
            super.unhandle(req, res, done);
          }
          unrender (req, res, done) {
            called.push('unrender2');
            super.unrender(req, res, done);
          }
        }

        const page1 = new P1('page1', app);
        const page2 = new P2('page2', app);
        const handler1 = clientPageHandlerFactory(page1);
        const handler2 = clientPageHandlerFactory(page2);

        handler1({}, { app }, done);
        expect(called).to.eql(['init1', 'handle1', 'render1']);
        handler2({}, { app }, done);
        expect(called).to.eql(['init1', 'handle1', 'render1', 'unhandle1', 'unrender1', 'init2', 'handle2', 'render2']);
        expect(page1.state).to.equal(Page.INITED);
        expect(page2.state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
        done();
      });
      it('should asynchronously unhandle an existing page request', function (done) {
        class P1 extends Page {
          init (done) {
            called.push('init1');
            super.init(done);
          }
          handle (req, res, done) {
            called.push('handle1');
            super.handle(req, res, done);
          }
          render (req, res, done) {
            called.push('render1');
            super.render(req, res, done);
          }
          unhandle (req, res, done) {
            setTimeout(() => {
              called.push('unhandle1');
              super.unhandle(req, res, done);
            }, 20);
          }
          unrender (req, res, done) {
            called.push('unrender1');
            super.unrender(req, res, done);
          }
        }
        class P2 extends Page {
          init (done) {
            setTimeout(() => {
              called.push('init2');
              super.init(done);
            }, 10);
          }
          handle (req, res, done) {
            called.push('handle2');
            super.handle(req, res, done);
          }
          render (req, res, done) {
            called.push('render2');
            super.render(req, res, done);
          }
          unhandle (req, res, done) {
            called.push('unhandle2');
            super.unhandle(req, res, done);
          }
          unrender (req, res, done) {
            called.push('unrender2');
            super.unrender(req, res, done);
          }
        }

        const page1 = new P1('page1', app);
        const page2 = new P2('page2', app);
        const handler1 = clientPageHandlerFactory(page1);
        const handler2 = clientPageHandlerFactory(page2);

        handler1({}, { app }, done);
        handler2({}, { app }, done);
        setTimeout(() => {
          expect(called).to.eql(['init1', 'handle1', 'render1', 'init2', 'unhandle1', 'unrender1', 'handle2', 'render2']);
          expect(app.page).to.equal(page2);
          expect(page1.state).to.equal(Page.INITED);
          expect(page2.state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
          done();
        }, 50);
      });
      it('should handle another page request while unhandling an existing page request', function (done) {
        class P1 extends Page {
          init (done) {
            called.push('init1');
            super.init(done);
          }
          handle (req, res, done) {
            called.push('handle1');
            super.handle(req, res, done);
          }
          render (req, res, done) {
            called.push('render1');
            super.render(req, res, done);
          }
          unhandle (req, res, done) {
            called.push('unhandle1');
            super.unhandle(req, res, done);
          }
          unrender (req, res, done) {
            called.push('unrender1');
            super.unrender(req, res, done);
          }
        }
        class P2 extends Page {
          init (done) {
            setTimeout(() => {
              called.push('init2');
              super.init(done);
            }, 10);
          }
          handle (req, res, done) {
            called.push('handle2');
            super.handle(req, res, done);
          }
          render (req, res, done) {
            called.push('render2');
            super.render(req, res, done);
          }
          unhandle (req, res, done) {
            called.push('unhandle2');
            super.unhandle(req, res, done);
          }
          unrender (req, res, done) {
            called.push('unrender2');
            super.unrender(req, res, done);
          }
        }
        class P3 extends Page {
          init (done) {
            setTimeout(() => {
              called.push('init3');
              super.init(done);
            }, 10);
          }
          handle (req, res, done) {
            called.push('handle3');
            super.handle(req, res, done);
          }
          render (req, res, done) {
            called.push('render3');
            super.render(req, res, done);
          }
          unhandle (req, res, done) {
            called.push('unhandle3');
            super.unhandle(req, res, done);
          }
          unrender (req, res, done) {
            called.push('unrender3');
            super.unrender(req, res, done);
          }
        }

        const page1 = new P1('page1', app);
        const page2 = new P2('page2', app);
        const page3 = new P3('page3', app);
        const handler1 = clientPageHandlerFactory(page1);
        const handler2 = clientPageHandlerFactory(page2);
        const handler3 = clientPageHandlerFactory(page3);

        handler1({}, { app }, done);
        handler2({}, { app }, done);
        handler3({}, { app }, done);
        expect(called).to.eql(['init1', 'handle1', 'render1', 'unhandle1', 'unrender1']);
        setTimeout(() => {
          expect(called).to.eql(['init1', 'handle1', 'render1', 'unhandle1', 'unrender1', 'init2', 'init3', 'handle3', 'render3']);
          expect(app.page).to.equal(page3);
          expect(page1.state).to.equal(Page.INITED);
          expect(page2.state).to.equal(Page.INITED);
          expect(page3.state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
          done();
        }, 50);
      });
      it('should handle another page request while handling a page request', function (done) {
        class P1 extends Page {
          init (done) {
            called.push('init1');
            super.init(done);
          }
          handle (req, res, done) {
            setTimeout(() => {
              called.push('handle1');
              super.handle(req, res, done);
            }, 20);
          }
          render (req, res, done) {
            called.push('render1');
            super.render(req, res, done);
          }
          unhandle (req, res, done) {
            called.push('unhandle1');
            super.unhandle(req, res, done);
          }
          unrender (req, res, done) {
            called.push('unrender1');
            super.unrender(req, res, done);
          }
        }
        class P2 extends Page {
          init (done) {
            setTimeout(() => {
              called.push('init2');
              super.init(done);
            }, 10);
          }
          handle (req, res, done) {
            called.push('handle2');
            super.handle(req, res, done);
          }
          render (req, res, done) {
            called.push('render2');
            super.render(req, res, done);
          }
          unhandle (req, res, done) {
            called.push('unhandle2');
            super.unhandle(req, res, done);
          }
          unrender (req, res, done) {
            called.push('unrender2');
            super.unrender(req, res, done);
          }
        }

        const page1 = new P1('page1', app);
        const page2 = new P2('page2', app);
        const handler1 = clientPageHandlerFactory(page1);
        const handler2 = clientPageHandlerFactory(page2);

        handler1({}, { app }, done);
        handler2({}, { app }, done);
        expect(called).to.eql(['init1', 'unhandle1']);
        setTimeout(() => {
          expect(called).to.eql(['init1', 'unhandle1', 'init2', 'handle2', 'render2', 'handle1']);
          expect(app.page).to.equal(page2);
          done();
        }, 50);
      });
    });
  });
});