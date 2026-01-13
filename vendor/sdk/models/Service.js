/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const co = require('co');
const request = require('request');
const querystring = require('querystring');
const md5 = require('md5');

const AFError = require('./Error');
const Entity = require('./Entity');
const Common = require('./Common');
const Auth = require('./Auth');

const symbols = {};
const sym = name => (symbols[name] || (symbols[name] = Symbol(name)));
const [ required, array ] = [true, true, true];

class Service extends Entity {
  constructor(data = {}) {
    super(data);
    this[sym('model')] = data;
  }

  static fetch(name, application) {
    return co(function *() {
      let service = yield Entity.fetch(name, 'Service', application);
      if (!service) throw new AFError(404, 'Service not found');

      Service[name] = new Service(service);
      return Service[name];
    }.bind(this));
  }

  static get schema() {
    let schema = Entity.schema;
    Object.assign(schema, {
      options: {
        host: { type: 'string' },
        port: { type: 'number' },
        routes: { type: 'object' },
        params: { type: 'object' },
        rules: { type: 'object' },
      }
    });

    return schema;
  }

  static swagger(fieldTable) {
    return co.wrap(function *(swagger, params) {
    }.bind(this));
  }

  static access(req, rule) {
    return ['service', rule || 'send' || req.method.toUpperCase()];
  }

  validatePermission(name, access, req) {
    if (!req.service.options.rules || !req.service.options.rules[name]) {
      switch (name) {
        case 'all':
          var rule = {
            methods: ['GET', 'POST', 'PUT', 'DELETE']
          };

          return this.checkRule(rule, access, req);

        default: return false;
      }
    }

    return this.checkRule(req.service.options.rules[name], access, Object.assign(req, req.params));
  }

  checkRule(rule, access, object) {
    if (rule.access && rule.access.indexOf(access) < 0) {
      return false;
    }

    if (rule.methods && rule.methods.map(m => m.toUpperCase()).indexOf(object.method) < 0) {
      return false;
    }

    return rule;
  }

  get self() { return this[sym('model')]; }

  get data() { return this[sym('data')]; }
  set data(value) { this[sym('data')] = value; }

  findRoute(req) {
    let routeNames = Object.keys(this.options.routes);
    let url = req.params.path;

    for (let i = 0; i < routeNames.length; i++) {
      let n = routeNames[i];
      let r = this.options.routes[n];

      if (url == n && req.method.toUpperCase() == r.method.toUpperCase()) {
        return n;
      }
    }
  }

  compileRoute(route) {
    return co(function *() {
      let result = {};
      let paramNames = Object.keys(route.params || {});

      for (let i = 0; i < paramNames.length; i++) {
        let n = paramNames[i];
        let cn = Common.parsePlaceholders(n, Object.assign({ 'this': this }, this.data));

        if (cn === undefined) { continue; }

        switch (typeof route.params[n]) {
          case 'string':
            let value = Common.parsePlaceholders(route.params[n], Object.assign({ 'this': this }, this.data));
            if (value) result[cn] = value;
            break;

          case 'object':
            if (route.params[n].entity) {
              let value = yield this.compileEntity(route.params[n]);
              if (value) result[cn] = value;
              break;
            }

          default:
            result[cn] = route.params[n];
        }
      }

      return result;
    }.bind(this));
  }

  compileEntity(obj) {
    return co(function *() {
      let ent = yield Entity.fetch(obj.entity);
      if (!ent) {
        throw new AFError(404, 'Entity not found');
      }

      switch (ent.type) {
        case 'Table':
          const Table = require('./Table');
          ent = new Table(ent);

          let find = Common.parsePlaceholders(obj.find, Object.assign({'this': this}, this.data));

          if (find === undefined && find !== obj.find) {
            return;
          }

          let data = yield ent.findAll(find);
          data = data.data;

          switch (typeof obj.fields) {
            case 'string': data = data.map((d) => d[obj.fields]); break;

            case 'object':
              if (obj.fields instanceof Array) {
                if (obj.fields.length) {
                  data = data.map((d) => {
                    let vr = {};

                    obj.fields.map((v) => vr[v] = d[v]);

                    return vr;
                  });
                }
              } else {
                data = data.map((d) => {
                  let vr = {};

                  for (let i in obj.fields) {
                    vr[obj.fields[i]] = d[i];
                  }

                  return vr;
                });
              }
              break;
          }
      }

      return data;
    }.bind(this));
  }

  request(route, req) {
    return co(function* () {
      route = this.options.routes[route];

      if (!route) {
        return Promise.reject(new AFError(400, 'Route not found'));
      }

      let params = yield this.compileRoute(route);
      let token = yield this.generateToken(req);

      let jsonOptions = JSON.stringify(this.options.params);

      if (jsonOptions) {
        jsonOptions = jsonOptions.replace(
          /[\u007F-\uFFFF]/g,
          (chr) => '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).substr(-4)
        );
      }

      let requestParams = {
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Factory-Service-Options': jsonOptions,
          'X-Api-Factory-Service-Token': token,
          'X-Api-Factory-Service-URL': 'http://localhost:' + req.req.socket.localPort,
          'X-Api-Factory-Service-Application': req.application.id,
        },
      };

      requestParams.url = `http://${this.options.host}:${this.options.port}/${route.route}`;

      if (route.method == 'GET') {
        requestParams.url += (requestParams.url.indexOf('?') >= 0 ? '&' : '?') + querystring.stringify(params);
      } else {
        requestParams.body = JSON.stringify(params);
      }

      return new Promise((resolve, reject) =>
        request(requestParams, (err, res, body) => err ? reject(err) : resolve(res)));
    }.bind(this));
  }

  generateToken(req) {
    let token = md5(this.self.id + Date.now());
    let oauth = new Auth.types.OAuth();

    return new Promise((resolve, reject) =>
      oauth.setReq(req).saveAccessToken(
        token,
        this.self.id,
        Date.now() + 2 * 60 * 60000,
        {},
        (err) => err ? reject(err) : resolve(token)
      ));
  }
}

module.exports = Service;
