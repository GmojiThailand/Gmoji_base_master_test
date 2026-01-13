'use strict';

const KoaRouter = require('koa-router');
const HttpError = require('./Error');
const Auth = require('./Auth');
const Application = require('./Application');
const Table = require('./Table');

class Router extends KoaRouter {
  constructor(...args) {
    super(...args);
  }

  register(path, methods, middleware, opts) {
    let paramsRouter;
    if (middleware.length) {
      middleware = middleware.filter((a) =>
        (typeof a == 'object' ? (paramsRouter = a) && false : true)
      );
    }

    let route = super.register.call(this, path, methods, middleware, opts);
    if (paramsRouter) {
      paramsRouter.path = path;
      let middlewares = Object.keys(paramsRouter).map((p) => {
        switch (p) {
          case 'appId':
            return function* (next) {
              if (!this.headers['x-api-factory-application-id']) {
                throw new HttpError(400, 'Application id required');
              }

              let app = yield Application.find(this.headers['x-api-factory-application-id']);
              if (!app) {
                throw new HttpError(400, 'Application not found');
              }

              this.application = app;

              yield next;
            };
            break;

          case 'auth':
            return function* (next) {
              yield Auth.authorize(this);
              yield next;
            };
            break;

          case 'access':
            return function* (next) {
              if (paramsRouter[p] === true) {
                // обработать ошибку
                const rulesTable = yield Table.fetch('rules', this.headers['x-api-factory-application-id']);
                let routeRule = yield rulesTable.find({route: paramsRouter.path}).catch((e) => {
                  throw new HttpError(403, 'Route is undefined');
                });
                yield Auth.checkAccess(routeRule.data.role, this);
              }
              yield next;
            };
            break;

          default:
            break;
        }
      }).filter((m) => m);

      route.stack = middlewares.concat(route.stack);
    }

    return route;
  }
}

module.exports = Router;
