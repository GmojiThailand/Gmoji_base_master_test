/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const Router = require('koa-router');

const AFError = require('./Error');
const Auth = require('./Auth');
const Application = require('./Application');

class KoaRouter extends Router {
  constructor(opts) {
    super(opts);
  }

  register(path, methods, middleware, opts) {
    let paramsRouter;
    if (middleware.length) {
      middleware = middleware.filter((a) => {
        return typeof a == 'object' ? (paramsRouter = a) && false : true;
      });
    }

    let route = super.register.call(this, path, methods, middleware, opts);
    let swaggerParams = route.swaggerParams = {methods, fields: [], models: []};

    if (paramsRouter) {
      paramsRouter.fields = paramsRouter.fields || {};
      let middlewares = Object.keys(paramsRouter).map((p) => {
        switch (p) {
          case 'swaggerFunc':
            swaggerParams.swaggerFunc = paramsRouter.swaggerFunc;
            return;

          case 'tag':
            swaggerParams.tag = Array.isArray(paramsRouter.tag) ? paramsRouter.tag : [paramsRouter.tag];
            return;

          case 'auth':
            if (!paramsRouter.auth) break;
            swaggerParams.auth = true;
            return function* (next) {
              try {
                yield Auth.authorize(this);
              } catch (e) {}

              yield next;
            };

          case 'access':
            return function* (next) {
              let checkAccess;
              let check;
              let param = paramsRouter[p];
              if (typeof param == 'function') { checkAccess = Auth.checkAccess.apply(Auth, param(this)); }
              if (Array.isArray(param)) { checkAccess = Auth.checkAccess.apply(Auth, param); }
              if (checkAccess) check = checkAccess(this);
              yield next;
            };

          case 'query':
          case 'body':
          case 'params':
          case 'header':
            break;
          case 'fields':
            let {fields = {}, query = {}, body = {}, params = {}, header = {}} = paramsRouter;

            let parseFields = (obj, defaultIn) => Object.keys(obj).map((f) => Object.assign({
              name: f,
              in: defaultIn,
              type: 'string',
            }, obj[f]));

            fields = parseFields(fields, 'body');
            fields = fields.concat(
              parseFields(query, 'query'),
              parseFields(params, 'path'),
              parseFields(header, 'header')
            );
            if (Object.keys(body).length) {
              let model = {
                name: `${paramsRouter.tag}-${path}-${methods.join('-')}-body`.replace(/\//g, '_'),
                schema: body,
              };

              swaggerParams.models.push(model);
              fields.push({
                name: 'body',
                in: 'body',
                type: 'string',
                $ref: `#/definitions/${model.name}`,
              });
            }

            swaggerParams.fields = swaggerParams.fields.concat(fields);
            return;// function *(next) {}; // validation fields

          case 'pagination':
            if (!paramsRouter.pagination) break;
            swaggerParams.pagination = true;
            swaggerParams.fields = swaggerParams.fields.concat([
              {name: 'page', type: 'number', in: 'query'},
              {name: 'offset', type: 'number', in: 'query'},
              {name: 'limit', type: 'number', in: 'query'},
            ]);
            return;// function *(next) {};

          case 'sort':
            if (!paramsRouter.sort) break;
            swaggerParams.sort = true;
            swaggerParams.fields = swaggerParams.fields.concat([
              {name: 'sort', type: 'array', in: 'query', required: false},
            ]);
            return;// function *(next) {};

          case 'responses':
            swaggerParams.responses = paramsRouter.responses;
            return;

          case 'models':
            swaggerParams.models = swaggerParams.models.concat(paramsRouter.models || []);
            return;
        }
      }).filter((m) => m);

      if (!paramsRouter.noApp) {
        swaggerParams.fields.push({
          name: 'X-Api-Factory-Application-Id',
          in: 'header',
          type: 'string',
          required: !paramsRouter.maybeApp,
        });

        swaggerParams.applicationField = 'X-Api-Factory-Application-Id';

        middlewares.push(function* (next) {
          if (!this.headers['x-api-factory-application-id']) {
            return yield next;
          }

          let app = yield Application.find(this.headers['x-api-factory-application-id']);
          if (!app) {
            throw new AFError(404, 'Application not found.');
          }

          this.application = app;

          yield next;
        });
      }

      route.stack = middlewares.concat(route.stack);
    }

    return route;
  }
}

module.exports = KoaRouter;
