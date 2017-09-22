[![NPM Version](https://img.shields.io/npm/v/@yr/framework.svg?style=flat)](https://npmjs.org/package/@yr/framework)
[![Build Status](https://img.shields.io/travis/YR/framework.svg?style=flat)](https://travis-ci.org/YR/framework?branch=master)

A universal (backend and frontend) application framework based on [Express.js](https://expressjs.com).

## Usage

Server:

```js
const framework = require('@yr/framework');

const app = framework('myapp', process.env.PORT, process.cwd(), {
  locales: {
    /* store locales files */
    load(dirpath)
  },
  templates: {
    /* store precompiled template files */
    load(dirpath)
  },
  middleware: {
    /* register middleware */
    register(app),
    /* register error middleware */
    registerError(app)
  },
  params: {
    /* register param validators */
    register(app)
  },
  pages: {
    home: {
      dir: 'pages/home',
      pageFactory: (id, app) => /* return Page instance */ ,
      routes: ['/:locale']
    },
    blog: {
      dir: 'pages/blog',
      pageFactory: (id, app) => /* return Page instance */ ,
      routes: ['/:locale/blog']
    }
  },
  settings: {
    /* store page specific settings */
    set(key, value)
  }
});

app.listen();
```

Client:

```js
const framework = require('@yr/framework');

const app = framework('myapp', {
  middleware: {
    /* register middleware */
    register(app),
    /* register error middleware */
    registerError(app)
  },
  params: {
    /* register param validators */
    register(app)
  },
  pages: {
    home: {
      pageFactory: (id, app) => /* return Page instance */ ,
      routes: ['/:locale']
    },
    blog: {
      pageFactory: (id, app) => /* return Page instance */ ,
      routes: ['/:locale/blog']
    }
  },
  settings: {
    /* store page specific settings */
    set(key, value)
  }
});

app.listen();
```

## API - Server

**`framework(id: String, port: Number, dir: String, options: Object): Express`**

Framework factory returning an [Express application](https://expressjs.com/en/4x/api.html#app) instance.

All `key/value` pairs in `options` will be stored as Express application settings (retrievable via `app.get(key)`. If present, the following keys will be specifically handled:

- `pages: { [id: String]: { dir: String, pageFactory: (id: String, app: Express) => Page, routes: Array<String> }}`: hash of pages to initialise. Page instances will be created via `pageFactory`, and registered with `routes`. Page directories at `dir` must contain a `server.js` file, and may optionally contain a `locales` subdirectory, a `templates` subdirectory, and a `settings.js` file.
- `locales: { load: (dirpath) => void }`: if a `locales` directory exists in the application `dir` or in a page `dir`, the resolved path will be passed to the `load` method. The `locales` object can be retrieved via `app.get('locales')`.
- `templates: { load: (dirpath) => void }`: if a `templates` directory exists in the application `dir` or in a page `dir`, the resolved path will be passed to the `load` method. The `templates` object can be retrieved via `app.get('templates')`.
- `settings: { set: (key: String, value: any) }`: if a `settings.js` file exists in the application `dir` or in a page `dir`, the file content will be stored under the `id` key. The `settings` object can be retrieved via `app.get('settings')`.
- `middleware: { register: (app) => void, registerError(app) => void }`: [middleware](https://expressjs.com/en/guide/using-middleware.html) registration hooks. The `register` method will be invoked before, and `registerError` will be invoked after, page handlers are registered.
- `params: { register: (app) => void }`: [param](https://expressjs.com/en/4x/api.html#app.param) validation hook

**`framework.Page: Page`** Reference to the [Page class](#page)

**`framework.request: Object`** Reference to the Express [request prototype](https://expressjs.com/en/4x/api.html#req)

**`framework.response: Object`** Reference to the Express [response prototype](https://expressjs.com/en/4x/api.html#res)

**`framework.static: Object`** Reference to the Express [static middleware](https://expressjs.com/en/starter/static-files.html)

## API - Client

**`framework(id: String, options: Object): Express`**

Framework factory returning an [Express-client application](https://github.com/YR/express-client#application) instance.

All `key/value` pairs in `options` will be stored as Express application settings (retrievable via `app.get(key)`. If present, the following keys will be specifically handled:

- `pages: { [id: String]: { pageFactory: (id: String, app: Express) => Page, routes: Array<String> }}`: hash of pages to initialise. Page instances will be created via `pageFactory`, and registered with `routes`.
- `middleware: { register: (app) => void, registerError(app) => void }`: [middleware](https://expressjs.com/en/guide/using-middleware.html) registration hooks. The `register` method will be invoked before, and `registerError` will be invoked after, page handlers are registered.
- `params: { register: (app) => void }`: [param](https://expressjs.com/en/4x/api.html#app.param) validation hook

**`framework.Page: Page`** Reference to the [Page class](#page)

**`framework.request: Object`** Reference to the Express-client [request prototype](https://github.com/YR/express-client#request)

**`framework.response: Object`** Reference to the Express-client [response prototype](https://github.com/YR/express-client#response)

### Page

The `Page` class describes the default behaviour of site pages.

**constructor(id: String, app: Express): Page** Create a `Page` instance.

**app: Express** Reference to the Express application instance.

**id: String** The page id string.

**debug: Function** A [debug](https://github.com/visionmedia/debug) instance, namespaced with `id`.

Pages are subject to the following lifecycle: `init -> handle -> render -> unrender -> unhandle`

**init(req: Request, res: Response[, done: Function])**

**handle(req: Request, res: Response[, done: Function])**

**render(req: Request, res: Response[, done: Function])**

**unrender(req: Request, res: Response[, done: Function])**

**unhandle(req: Request, res: Response[, done: Function])**

