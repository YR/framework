'use strict';

const cacheControl = require('../src/lib/cacheControl-server');
const clientPageHandlerFactory = require('../src/lib/pageHandlerFactory-client');
const expect = require('expect.js');
const fooPage = require('./fixtures/foo');
const onFinished = require('on-finished');
const Page = require('../src/lib/Page');
const request = require('supertest');
const runtime = require('@yr/runtime');
const server = require('../src/server');
let app, req, res;

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
    it('should generate response id', function (done) {
      const pageFactory = function (id, app) {
        return new Page(id, app);
      };

      app = server('foo', 8080, {
        middleware: {
          pre (app) {
            app.use((req, res, next) => {
              expect(res).to.have.property('id');
              expect(res.id).to.match(/dev:{36}/);
              next();
            });
          }
        },
        pages: {
          foo: { pageFactory, routes: ['/foo'] }
        }
      });
      request(app)
        .get('/foo')
        .end((err, res) => {
          if (err) return done(err);
          done();
        });
    });
    it('should generate response timings', function (done) {
      class P extends Page {
        handle (req, res, done) {
          res.write('f');
          res.write('o');
          res.write('o');
          setTimeout(() => {
            super.handle(req, res, done);
          }, 50);
        }
        render (req, res, done) {
          setTimeout(() => {
            super.render(req, res, done);
          }, 50);
        }
      }
      const pageFactory = function (id, app) {
        return new P(id, app);
      };

      app = server('foo', 8080, {
        middleware: {
          pre (app) {
            app.use((req, res, next) => {
              onFinished(res, (err, res) => {
                expect(res.timings).to.have.property('handle');
                expect(res.timings).to.have.property('render');
                expect(res.timings).to.have.property('response');
              });
              next();
            });
          }
        },
        pages: {
          foo: { pageFactory, routes: ['/foo'] }
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

      class BasePage extends Page {
        init (done) {
          // console.log(this.id, 'init', this.state);
          called.push(`init${this.id}`);
          super.init(done);
        }
        handle (req, res, done) {
          // console.log(this.id, 'handle', this.state);
          called.push(`handle${this.id}`);
          super.handle(req, res, done);
        }
        render (req, res, done) {
          // console.log(this.id, 'render', this.state);
          called.push(`render${this.id}`);
          super.render(req, res, done);
        }
        unrender (req, res, done) {
          // console.log(this.id, 'unrender', this.state);
          called.push(`unrender${this.id}`);
          super.unrender(req, res, done);
        }
        unhandle (req, res, done) {
          // console.log(this.id, 'unhandle', this.state);
          called.push(`unhandle${this.id}`);
          super.unhandle(req, res, done);
        }
      }

      before(function () {
        runtime.isBrowser = true;
      });
      beforeEach(function () {
        called = [];
        req = {};
        app = {
          page: null,
          get (key) { },
          set (key, value) {
            this.page = value;
          }
        };
        res = {
          app,
          time () {}
        };
        clientPageHandlerFactory.reset();
      });
      after(function () {
        runtime.isBrowser = false;
      });

      it('should handle a page request', function (done) {
        app.set = function (key, value) {
          expect(key).to.equal('page');
          expect(value).to.equal(page);
        };
        const page = new BasePage('1', app);
        const handler = clientPageHandlerFactory(page);

        handler(req, res, done);
        expect(called).to.eql(['init1', 'handle1', 'render1']);
        expect(page.state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
        done();
      });
      it('should unhandle an existing page request', function (done) {
        const page1 = new BasePage('1', app);
        const page2 = new BasePage('2', app);
        const handler1 = clientPageHandlerFactory(page1);
        const handler2 = clientPageHandlerFactory(page2);

        handler1(req, res, done);
        expect(called).to.eql(['init1', 'handle1', 'render1']);
        handler2(req, res, done);
        expect(called).to.eql(['init1', 'handle1', 'render1', 'unrender1', 'unhandle1', 'init2', 'handle2', 'render2']);
        expect(page1.state).to.equal(Page.INITED | Page.UNRENDERED | Page.UNHANDLED);
        expect(page2.state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
        done();
      });
      it('should asynchronously unhandle an existing page request', function (done) {
        class P1 extends BasePage {
          unhandle (req, res, done) {
            setTimeout(() => {
              super.unhandle(req, res, done);
            }, 20);
          }
        }
        class P2 extends BasePage {
          init (done) {
            setTimeout(() => {
              super.init(done);
            }, 10);
          }
        }

        const page1 = new P1('1', app);
        const page2 = new P2('2', app);
        const handler1 = clientPageHandlerFactory(page1);
        const handler2 = clientPageHandlerFactory(page2);

        handler1(req, res, done);
        handler2(req, res, done);
        setTimeout(() => {
          expect(called).to.eql(['init1', 'handle1', 'render1', 'unrender1', 'init2', 'unhandle1', 'handle2', 'render2']);
          expect(app.page).to.equal(page2);
          expect(page1.state).to.equal(Page.INITED | Page.UNRENDERED | Page.UNHANDLED);
          expect(page2.state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
          done();
        }, 50);
      });
      it('should handle another page request while unhandling an existing page request', function (done) {
        class P extends BasePage {
          init (done) {
            setTimeout(() => {
              super.init(done);
            }, 10);
          }
        }

        const page1 = new BasePage('1', app);
        const page2 = new P('2', app);
        const page3 = new P('3', app);
        const handler1 = clientPageHandlerFactory(page1);
        const handler2 = clientPageHandlerFactory(page2);
        const handler3 = clientPageHandlerFactory(page3);

        handler1(req, res, done);
        handler2(req, res, done);
        handler3(req, res, done);
        expect(called).to.eql(['init1', 'handle1', 'render1', 'unrender1', 'unhandle1']);
        setTimeout(() => {
          expect(called).to.eql(['init1', 'handle1', 'render1', 'unrender1', 'unhandle1', 'init2', 'init3', 'handle3', 'render3']);
          expect(app.page).to.equal(page3);
          expect(page1.state).to.equal(Page.INITED | Page.UNRENDERED | Page.UNHANDLED);
          expect(page2.state).to.equal(Page.INITED);
          expect(page3.state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
          done();
        }, 50);
      });
      it('should handle another page request while handling a page request', function (done) {
        class P1 extends BasePage {
          handle (req, res, done) {
            setTimeout(() => {
              super.handle(req, res, done);
            }, 20);
          }
        }
        class P2 extends BasePage {
          init (done) {
            setTimeout(() => {
              super.init(done);
            }, 10);
          }
        }

        const page1 = new P1('1', app);
        const page2 = new P2('2', app);
        const handler1 = clientPageHandlerFactory(page1);
        const handler2 = clientPageHandlerFactory(page2);

        handler1(req, res, done);
        handler2(req, res, done);
        expect(called).to.eql(['init1', 'unhandle1']);
        setTimeout(() => {
          expect(called).to.eql(['init1', 'unhandle1', 'init2', 'handle2', 'render2', 'handle1']);
          expect(page1.state).to.equal(Page.INITED | Page.UNHANDLED);
          expect(page2.state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
          expect(app.page).to.equal(page2);
          done();
        }, 50);
      });
      it('should enable res.write() during handling', function (done) {
        class P extends BasePage {
          handle (req, res, done) {
            res.write();
            setTimeout(() => {
              super.handle(req, res, done);
            }, 20);
          }
        }

        const page = new P('1', app);
        const handler = clientPageHandlerFactory(page);

        handler(req, res, done);
        expect(called).to.eql(['init1', 'render1']);
        setTimeout(() => {
          expect(called).to.eql(['init1', 'render1', 'handle1', 'render1']);
          done();
        }, 50);
      });
      it('should allow for page rerender', function (done) {
        app.getCurrentContext = () => {
          return { req, res };
        };
        const page = new BasePage('1', app);
        const handler = clientPageHandlerFactory(page);

        handler(req, res, done);
        expect(called).to.eql(['init1', 'handle1', 'render1']);
        setTimeout(() => {
          page.rerender();
          expect(called).to.eql(['init1', 'handle1', 'render1', 'render1']);
          done();
        }, 50);
      });
    });
  });
});