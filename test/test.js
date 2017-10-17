'use strict';

const { expect } = require('chai');
const cacheControlClient = require('../src/lib/cacheControl-client');
const cacheControlServer = require('../src/lib/cacheControl-server');
const clientPageHandlerFactory = require('../src/lib/pageHandlerFactory-client');
const fooPage = require('./fixtures/foo');
const onFinished = require('on-finished');
const Page = require('../src/lib/Page');
const rerender = require('../src/lib/rerender');
const request = require('supertest');
const server = require('../src/server');
const serverPageHandlerFactory = require('../src/lib/pageHandlerFactory-server');

let app, called, req, res;

class BasePage extends Page {
  init(req, res, done) {
    // console.log(this.id, 'init', this._state);
    called.push(`init${this.id}`);
    super.init(req, res, done);
  }
  handle(req, res, done) {
    // console.log(this.id, 'handle', this._state);
    called.push(`handle${this.id}`);
    super.handle(req, res, done);
  }
  render(req, res, done) {
    // console.log(this.id, 'render', this._state);
    called.push(`render${this.id}`);
    super.render(req, res, done);
  }
  unrender(req, res, done) {
    // console.log(this.id, 'unrender', this._state);
    called.push(`unrender${this.id}`);
    super.unrender(req, res, done);
  }
  unhandle(req, res, done) {
    // console.log(this.id, 'unhandle', this._state);
    called.push(`unhandle${this.id}`);
    super.unhandle(req, res, done);
  }
}

describe('framework', () => {
  beforeEach(() => {
    called = [];
    req = {};
    app = {
      page: null,
      get(key) {
        return this.page;
      },
      set(key, value) {
        this.page = value;
      },
      getCurrentContext() {
        return { req, res };
      }
    };
    rerender(app);
    res = {
      app,
      time() {},
      end() {}
    };
    clientPageHandlerFactory.__reset();
  });
  afterEach(done => {
    if (app) {
      try {
        const server = app.get('server');

        app.removeAllListeners();
        if (server.listening) {
          server.close(done);
        } else {
          done();
        }
      } catch (err) {
        done();
      }
    } else {
      done();
    }
  });

  describe('server', () => {
    describe('application', () => {
      it('should initialize an app instance', () => {
        app = server('foo');
        expect(app).to.have.property('get');
      });
      it('should define settings on the app instance', () => {
        app = server('foo');
        expect(app.get('id')).to.equal('foo');
      });
      it('should initialize a page', () => {
        app = server('bar', 8080, 'bar', {
          pages: {
            foo: { dir: 'foo', pageFactory: fooPage, routes: ['/foo'] }
          }
        });
        expect(app.get('pages')).to.have.property('foo');
        expect(app.get('pages').foo).to.have.property('id', 'foo');
      });
      it('should handle a matching route', done => {
        app = server('bar', 8080, 'bar', {
          pages: {
            foo: { dir: 'foo', pageFactory: fooPage, routes: ['/foo'] }
          }
        });
        app.listen();
        request(app)
          .get('/foo')
          .end((err, res) => {
            if (err) {
              return void done(err);
            }
            expect(res.text).to.equal('foo');
            done();
          });
      });
      it('should generate response id', done => {
        const pageFactory = (id, app) => {
          return new Page(id, app);
        };

        app = server('bar', 8080, 'bar', {
          middleware: {
            register(app) {
              app.use((req, res, next) => {
                expect(res).to.have.property('id');
                expect(res.id).to.match(/dev:{36}/);
                next();
              });
            }
          },
          pages: {
            foo: { dir: 'foo', pageFactory, routes: ['/foo'] }
          }
        });
        app.listen();
        request(app)
          .get('/foo')
          .end((err, res) => {
            if (err) {
              return void done(err);
            }
            done();
          });
      });
      it('should generate response timings', done => {
        class P extends Page {
          handle(req, res, done) {
            res.write('f');
            res.write('o');
            res.write('o');
            setTimeout(() => {
              super.handle(req, res, done);
            }, 50);
          }
          render(req, res, done) {
            setTimeout(() => {
              super.render(req, res, done);
            }, 50);
          }
        }
        const pageFactory = (id, app) => {
          return new P(id, app);
        };

        app = server('bar', 8080, 'bar', {
          middleware: {
            register(app) {
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
            foo: { dir: 'foo', pageFactory, routes: ['/foo'] }
          }
        });
        app.listen();
        request(app)
          .get('/foo')
          .end((err, res) => {
            if (err) {
              return void done(err);
            }
            expect(res.text).to.equal('foo');
            done();
          });
      });
    });

    describe('cacheControl', () => {
      beforeEach(() => {
        res = {
          set: (key, value) => {
            res[key] = value;
          }
        };
        cacheControlServer(res);
      });

      it('should set no-cache when passed "false"', () => {
        res.cacheControl(false);
        expect(res['Cache-Control']).to.eql('private, no-cache');
      });
      it('should set no-cache when passed "0"', () => {
        res.cacheControl(0);
        expect(res['Cache-Control']).to.eql('private, no-cache');
      });
      it('should pass through a valid header string', () => {
        res.cacheControl('public, max-age=1000');
        expect(res['Cache-Control']).to.eql('public, max-age=1000');
      });
      it('should convert a maxage value passed as String', () => {
        res.cacheControl('1hr');
        expect(res['Cache-Control']).to.eql('public, max-age=3600');
      });
      it('should add a maxage value passed as Number', () => {
        res.cacheControl(3600);
        expect(res['Cache-Control']).to.eql('public, max-age=3600');
      });
      it('should pass through cache value from header object', () => {
        const upstream = {
          'cache-control': 'public, max-age=360'
        };

        res.cacheControl('1hr', upstream);
        expect(res['Cache-Control']).to.eql('public, max-age=360');
      });
      it('should pass through cache value from object with "headers"', () => {
        const value = {
          headers: {
            'cache-control': 'public, max-age=360'
          }
        };

        res.cacheControl('1hr', value);
        expect(res['Cache-Control']).to.eql('public, max-age=360');
      });
      it('should pass through shortest cache value from array of header objects', () => {
        const upstream = [{ 'cache-control': 'public, max-age=360' }, { 'cache-control': 'public, max-age=350' }];

        res.cacheControl('1hr', upstream);
        expect(res['Cache-Control']).to.eql('public, max-age=350');
      });
      it('should pass through shortest cache value from array of objects with "headers"', () => {
        const upstream = [
          { headers: { 'cache-control': 'public, max-age=360' } },
          null,
          { headers: { 'cache-control': 'public, max-age=340' } }
        ];

        res.cacheControl('1hr', upstream);
        expect(res['Cache-Control']).to.eql('public, max-age=340');
      });
      it('should pass through highest cache value when within grace amount', () => {
        const upstream = [
          { headers: { 'cache-control': 'public, max-age=351' } },
          { headers: { 'cache-control': 'public, max-age=360' } }
        ];

        res.cacheControl('1hr', upstream);
        expect(res['Cache-Control']).to.eql('public, max-age=360');
      });
      it('should fall back to passed maxage when passed header object does not contain "cache-control"', () => {
        const upstream = {};

        res.cacheControl('1hr', upstream);
        expect(res['Cache-Control']).to.eql('public, max-age=3600');
      });
      it('should fall back to passed maxage when array of header objects do not contain "cache-control"', () => {
        const upstream = [{}, null, null, {}];

        res.cacheControl('1hr', upstream);
        expect(res['Cache-Control']).to.eql('public, max-age=3600');
      });
      it('should throw when passed an invalid value', () => {
        try {
          res.cacheControl(true);
          expect.fail();
        } catch (err) {
          expect(err).to.be.an('error');
        }
        try {
          res.cacheControl('');
          expect.fail();
        } catch (err) {
          expect(err).to.be.an('error');
        }
        try {
          res.cacheControl('foo');
          expect.fail();
        } catch (err) {
          expect(err).to.be.an('error');
        }
      });
    });

    describe('pageHandler', () => {
      it('should handle a page request', done => {
        const page = new BasePage('1', app);
        const handler = serverPageHandlerFactory(page);

        app.set = (key, value) => {
          expect(key).to.equal('page');
          expect(value).to.equal(page);
        };

        handler(req, res, done);
        expect(called).to.eql(['init1', 'handle1', 'render1']);
        done();
      });
      it('should handle another page request while handling a page request', done => {
        class P1 extends BasePage {
          handle(req, res, done) {
            setTimeout(() => {
              super.handle(req, res, done);
            }, 20);
          }
        }
        class P2 extends BasePage {
          init(req, res, done) {
            setTimeout(() => {
              super.init(req, res, done);
            }, 10);
          }
        }

        const page1 = new P1('1', app);
        const page2 = new P2('2', app);
        const handler1 = serverPageHandlerFactory(page1);
        const handler2 = serverPageHandlerFactory(page2);

        handler1(req, res, done);
        handler2(req, res, done);
        expect(called).to.eql(['init1']);
        setTimeout(() => {
          expect(called).to.eql(['init1', 'init2', 'handle2', 'render2', 'handle1', 'render1']);
          done();
        }, 50);
      });
    });
  });

  describe('client', () => {
    describe('cacheControl', () => {
      beforeEach(() => {
        res = {
          app: {
            reloaded: false,
            reload: () => {
              res.app.reloaded = true;
            }
          }
        };
        cacheControlClient(res);
      });

      it('should not trigger a reload when no-cache', done => {
        res.cacheControl(false);
        setTimeout(() => {
          expect(res.app.reloaded).to.eql(false);
          done();
        }, 100);
      });
      it('should trigger a reload when passed a String', done => {
        res.cacheControl('1s');
        setTimeout(() => {
          expect(res.app.reloaded).to.eql(true);
          done();
        }, 1100);
      });
      it('should trigger a reload when passed a Number', done => {
        res.cacheControl(1);
        setTimeout(() => {
          expect(res.app.reloaded).to.eql(true);
          done();
        }, 1100);
      });
    });

    describe('pageHandler', () => {
      it('should handle a page request', done => {
        const page = new BasePage('1', app);
        const handler = clientPageHandlerFactory(page);

        app.set = (key, value) => {
          expect(key).to.equal('page');
          expect(value).to.equal(page);
        };

        handler(req, res, done);
        expect(called).to.eql(['init1', 'handle1', 'render1']);
        expect(page._state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
        done();
      });
      it('should unhandle an existing page request', done => {
        const page1 = new BasePage('1', app);
        const page2 = new BasePage('2', app);
        const handler1 = clientPageHandlerFactory(page1);
        const handler2 = clientPageHandlerFactory(page2);

        handler1(req, res, done);
        expect(called).to.eql(['init1', 'handle1', 'render1']);
        handler2(req, res, done);
        expect(called).to.eql(['init1', 'handle1', 'render1', 'unrender1', 'unhandle1', 'init2', 'handle2', 'render2']);
        expect(page1._state).to.equal(Page.INITED | Page.UNRENDERED | Page.UNHANDLED);
        expect(page2._state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
        done();
      });
      it('should asynchronously unhandle an existing page request', done => {
        class P1 extends BasePage {
          unhandle(req, res, done) {
            setTimeout(() => {
              super.unhandle(req, res, done);
            }, 20);
          }
        }
        class P2 extends BasePage {
          init(req, res, done) {
            setTimeout(() => {
              super.init(req, res, done);
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
          expect(called).to.eql([
            'init1',
            'handle1',
            'render1',
            'unrender1',
            'init2',
            'unhandle1',
            'handle2',
            'render2'
          ]);
          expect(app.page).to.equal(page2);
          expect(page1._state).to.equal(Page.INITED | Page.UNRENDERED | Page.UNHANDLED);
          expect(page2._state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
          done();
        }, 50);
      });
      it('should handle another page request while unhandling an existing page request', done => {
        class P extends BasePage {
          init(req, res, done) {
            setTimeout(() => {
              super.init(req, res, done);
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
          expect(called).to.eql([
            'init1',
            'handle1',
            'render1',
            'unrender1',
            'unhandle1',
            'init2',
            'init3',
            'handle3',
            'render3'
          ]);
          expect(app.page).to.equal(page3);
          expect(page1._state).to.equal(Page.INITED | Page.UNRENDERED | Page.UNHANDLED);
          expect(page2._state).to.equal(Page.INITED);
          expect(page3._state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
          done();
        }, 50);
      });
      it('should handle another page request while handling a page request', done => {
        class P1 extends BasePage {
          handle(req, res, done) {
            setTimeout(() => {
              super.handle(req, res, done);
            }, 20);
          }
        }
        class P2 extends BasePage {
          init(req, res, done) {
            setTimeout(() => {
              super.init(req, res, done);
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
          expect(page1._state).to.equal(Page.INITED | Page.UNHANDLED);
          expect(page2._state).to.equal(Page.INITED | Page.HANDLED | Page.RENDERED);
          expect(app.page).to.equal(page2);
          done();
        }, 50);
      });
      it('should prerender during async handling', done => {
        class P extends BasePage {
          handle(req, res, done) {
            setTimeout(() => {
              super.handle(req, res, done);
            }, 20);
          }
        }

        const page = new P('1', app);
        const handler = clientPageHandlerFactory(page);

        handler(req, res, done);
        expect(called).to.eql(['init1']);
        setTimeout(() => {
          expect(called).to.eql(['init1', 'render1', 'handle1', 'render1']);
          done();
        }, 50);
      });
      it('should allow for res.write() during async handling', done => {
        class P extends BasePage {
          handle(req, res, done) {
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
          expect(called).to.eql(['init1', 'render1', 'render1', 'handle1', 'render1']);
          done();
        }, 50);
      });
      it('should allow for page rerender', done => {
        const page = new BasePage('1', app);
        const handler = clientPageHandlerFactory(page);

        handler(req, res, done);
        setTimeout(() => {
          app.rerender();
          setTimeout(() => {
            expect(called).to.eql(['init1', 'handle1', 'render1', 'render1']);
            done();
          }, 10);
        }, 50);
      });
    });
  });
});
