/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const co = require('co');

const AFError = require('./Error');

class Swagger {
  constructor({ name, application, entity, version = '1.0.0', basePath = '/api', paths = {}, definitions = {} }) {
    this.application = application;
    this.entity = entity;
    this.spec = {
      swagger: '2.0',
      info: {
        title: name,
        version: version
      },
      basePath,
      paths,
      definitions,
    };
  }

  parseModel(model) {
    if (this.spec.definitions[model.name]) return this.spec.definitions[model.name];

    let required = [];
    let def = {};
    Object.keys(model.schema || {}).map(f => {
      switch (model.schema[f].type) {
        case 'id':
          if (model.schema[f].referer) {
            //def[f] = { $ref: '#/definitions/' + model.schema[f].referer };
            if (model.schema[f].model) this.parseModel(model.schema[f].model);
          }
          def[f] = { type: 'string' };
          break;

        case 'boolean':
          def[f] = { type: 'boolean' }; break;

        case 'string':
          def[f] = { type: 'string' }; break;

        case 'number':
        case 'integer':
        case 'float':
        case 'date':
          def[f] = { type: 'number' }; break;

        case 'geo':
          def[f] = { type: 'array', items: { type: 'number' } }; break;

        default:
          def[f] = { type: 'object' }; break;
      }
      if (model.schema[f].required) required.push(f);
      if (model.schema[f].array) def[f] = { type: 'array', items: def[f] };
    });

    this.spec.definitions[model.name] = {
      type: 'object',
      properties: def,
      required
    };
    return this.spec.definitions[model.name];
  }

  parseRouter(router) {
    return co(function *() {
      this.spec.paths = this.spec.paths || {};
      this.spec.definitions = this.spec.definitions || {};
      for (let r of router.stack) {
        let { swaggerParams: { fields = [], swaggerFunc, applicationField }, path = '', paramNames = [] } = r;

        if (paramNames) {
          paramNames.map(p => {
            let field = fields.find(f => f.in == 'path' && f.name == p.name);
            if (!field) {
              field = {
                name: p.name,
                in: 'path',
                type: 'string',
                required: true,
              };
              fields.push(field);
            }
            path = path.replace(`:${field.name}${p.optional ? '?' : ''}`, `{${field.name}}`);
          });
        }

        if (applicationField) {
          let field = fields.find(f => f.name == applicationField);
          if (field) {
            field.default = this.application ? this.application.id : '';
          }
        }

        let valid = true;
        if (typeof swaggerFunc == 'function') {
          valid = yield swaggerFunc(this, Object.assign({ path, paramNames }, r.swaggerParams));
        }

        if (valid && paramNames) {
          paramNames.map(p => {
            let i = fields.findIndex(f => f.in == 'path' && f.name == p.name);
            if (p.optional) {
              let newPath = path.replace(`/{${fields[i].name}}`, '') || '/';
              let newFields = [].concat(fields.slice(0, i), fields.slice(i + 1));
              this.addPath(Object.assign({}, r.swaggerParams, { path: newPath, fields: newFields }));
            }
          });
        }

        if (valid) {
          this.addPath(Object.assign({}, r.swaggerParams, { path }));
        }
      }

      return this;
    }.bind(this));
  }

  addPath(swaggerParams) {
    if (!swaggerParams.path) throw new AFError(500, 'Empty path');

    let {
      path,
      tag = [],
      description = '',
      fields = [],
      methods = [],
      responses,
      models = []
    } = swaggerParams;

    fields = [].concat(fields).map(f => Object.assign({}, f));
    methods = [].concat(methods);
    models = [].concat(models);
    responses = Object.assign({}, responses);
    Object.keys(responses).map(f =>
      responses[f] = Object.assign({}, responses[f])
    );

    this.spec.paths[path] = this.spec.paths[path] || {};

    Object.keys(responses).map(r => {
      let model = responses[r].model;
      delete responses[r].model;

      if (model) {
        responses[r].schema = { $ref: `#/definitions/${model.name}` };
        models.push(model);
      }
    });

    tag = Array.isArray(tag) ? tag : [tag];
    let route = {
      tags: tag,
      summary: description,
      parameters: fields,
      responses: responses,
    };

    methods.map(method => {
      let m = method.toLowerCase();
      if (this.spec.paths[path][m]) throw new AFError(500, `Duplicate routes: ${method} ${path}`);
      this.spec.paths[path][m] = route;
    });

    models.map(model => this.parseModel(model));
  }
}

module.exports = Swagger;
