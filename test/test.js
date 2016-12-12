'use strict';

const application = require('../src/server');
const cacheControl = require('../src/lib/cacheControl');
const expect = require('expect.js');
const request = require('supertest');
let app;

describe('framework', function () {
  afterEach(function (done) {
    if (app) {
      app.removeAllListeners();
      app.get('server').close(done);
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

  describe('application', function () {
    it('should initialize an app instance', function () {
      app = application('foo', 8080, {});
      expect(app).to.have.property('get');
    });
    it('should define settings on the app instance', function () {
      app = application('foo', 8080, {});
      expect(app.get('id')).to.equal('foo');
    });
  });
});