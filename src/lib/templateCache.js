'use strict';

/**
 * Template cache environment for nunjucks templates.
 * Caches, inlines sources, parses dependencies, and precompiles templates.
 * Compatible with nunjucks 'Environment' specification.
 */

const { sync: inline } = require('inline-source');
const Debug = require('debug');
// const error = require('lib/error');
// const log = require('lib/log');
const nunjucks = require('nunjucks');
const path = require('path');
const readdir = require('@yr/readdir');

const RE_INCLUDE = /(?:{% include)\s['|"]?(.*?)['|"]?[\s|}]/g;
const RE_SEP = /\\/g;

const debug = Debug('framework:templateCache');

exports.create = function () {
  return new TemplateCache();
};

class TemplateCache {
  /**
   * Constructor
   */
  constructor () {
    this.cache = {};
    this.sources = {};
    // Create environment using this instance as loader
    this.env = new nunjucks.Environment(this, {
      autoescape: false
    });
  }

  /**
   * Precompile and cache all templates in 'dir'
   * @param {String} dir (a fully qualified path)
   */
  load (dir) {
    if (Array.isArray(dir)) {
      dir.forEach((d) => {
        this.load(d);
      });
    }

    // Non-recursive
    readdir(dir, false, /\.nunjs$/)
      .forEach(this._cache, this);
  }

  /**
   * Create 'alias' of 'filepath'
   * @param {String} alias
   * @param {String} filepath
   */
  alias (alias, filepath) {
    // Prevent overwriting
    if (!this.sources[alias]) {
      debug('aliasing %s as %s', filepath, alias);
      this.sources[alias] = this.getKey(filepath);
    } else {
      debug('WARNING creating alias %s for %s. Alias already exists', alias, filepath);
    }
  }

  /**
   * Determine if source with 'filepath' exists in cache
   * @param {String} filepath
   * @returns {Boolean}
   */
  hasSource (filepath) {
    return this.sources[this.getKey(filepath)] != null;
  }

  /**
   * Retrieve source by 'filepath'
   * @param {String} filepath
   * @returns {String}
   */
  getSource (filepath) {
    const key = this.getKey(filepath);

    if (!this.sources[key]) throw Error(`no template source with key: ${key}`);
    return this.sources[key];
  }

  /**
   * Retrieve template by 'filepath'
   * @param {String} filepath
   * @returns {Object}
   */
  getTemplate (filepath) {
    const key = this.getKey(filepath);

    if (!this.cache[key]) throw Error(`no template cache with key: ${key}`);
    return this.cache[key];
  }

  /**
   * Reset
   */
  reset () {
    this.sources = {};
    this.cache = {};
  }

  /**
   * Cache template for 'filepath'
   * Also parses/caches template for include references (relative to project root)
   * @param {String} filepath
   */
  _cache (filepath) {
    const key = this.getKey(filepath);

    if (!this.sources[key]) {
      try {
        let source = inline(filepath, { compress: true, swallowErrors: false });
        let match;

        this.sources[key] = { src: source, path: key };

        // Parse & cache includes
        while (match = RE_INCLUDE.exec(source)) {
          const fp = path.resolve(path.dirname(filepath), match[1]).replace(RE_SEP, '/');

          this.sources[key].src = source = source.replace(match[1], fp);
          this._cache(fp);
        }

        const tmpl = new nunjucks.Template(source, this.env, filepath, true);

        this.cache[key] = tmpl;
        // Automatically alias
        this.alias(path.basename(key).replace(path.extname(key), ''), key);

        debug('cached template: ' + key);
      } catch (err) {
        this.sources[key] = '';
        throw err;
      }
    }
  }

  /**
   * Retrieve cache key for 'filepath'
   * @param {String} filepath
   * @returns {String}
   */
  getKey (filepath) {
    // Normalize windows paths
    filepath = filepath.replace(RE_SEP, '/');

    // Handle aliases
    if (!~filepath.indexOf('/')) return this.sources[filepath];

    // Absolute path from project root
    const cwd = process.cwd().replace(RE_SEP, '/');

    let key = (filepath.indexOf(cwd) == 0)
      ? path.relative(cwd, path.resolve(filepath)).replace(RE_SEP, '/')
      : filepath;

    // Force leading slash
    if (key.charAt(0) != '/') key = '/' + key;

    return key;
  }
}