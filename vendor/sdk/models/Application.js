/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const co = require('co');

const AFError = require('./Error');
const Adapter = require('./DBAdapter');
const DBAdapter = Adapter.get();

const symbols = {};
const sym = name => (symbols[name] || (symbols[name] = Symbol(name)));
const [ required, array, populate, unique ] = [true, true, true, true];

class Application {
  constructor(data = {}) {
    this[sym('model')] = data;
    this[sym('model')].options = data.options || {};
  }

  static find(params, options) {
    return co(function *() {
      let app = yield DBAdapter.init('Application', this.schema).find(params, options);
      if (!app) throw new AFError(404, 'Application not found');

      app = new this(app);
      return app;
    }.bind(this));
  }

  static get schema() {
    return {
      name: { type: 'string', required, unique },
      secret: { type: 'string', required },
      admins: { type: 'id', model: require('./User'), required, array, populate: {select: ['username', 'role', 'type', 'createdAt', 'updatedAt']} },
      options: { type: 'object' },
    };
  }

  static access(req, rule) {
    if (rule) return ['application', rule];

    switch (req.method.toUpperCase()) {
      case 'GET': return req.params && req.params.app_id ? ['application', 'view'] : ['application', 'list'];
      case 'POST': return ['application', 'create'];
      case 'PUT': return ['application', 'update'];
      case 'DELETE': return ['application', 'delete'];
    }
  }

  static validatePermission(name, access, req) {
    switch (name) {
      case 'all':
        return ['list', 'view', 'create'].indexOf(access) > -1;

      case 'own':
        if (['list', 'view', 'update', 'delete'].indexOf(access) > -1) {
          return {
            filter: {admins: req.user.id},
          };
        }
        return false;

      default: return false;
    }
  }

  validatePermission(name, access, req) {
    switch (name) {
      case 'all':
        return ['list', 'view', 'create', 'update', 'delete'].indexOf(access) > -1;

      case 'own':
        if (this.admins && this.admins.findIndex((a) => a.toString() == req.user.id.toString()) > -1) {
          if (['list', 'view', 'update', 'delete'].indexOf(access) > -1) {
            return {
              filter: {admins: req.user.id},
            };
          }
          return false;
        } else {
          return false;
        }

      default: return false;
    }
  }

  get id() { return this[sym('model')].id ? this[sym('model')].id.toString() : null; }
  get name() { return this[sym('model')].name; }
  get secret() { return this[sym('model')].secret; }
  get admins() { return this[sym('model')].admins || []; }
  get options() { return this.self.options; }

  get self() { return this[sym('model')]; }

  // get request() { return this[sym('request')]; }
  // get response() { return this[sym('response')]; }

  get table() { return require('./Table'); }
  get service() { return require('./Service'); }
  get script() { return require('./Script'); }
}

module.exports = Application;
