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
const sym = (name) => (symbols[name] || (symbols[name] = Symbol(name)));
const [required, unique] = [true, true];

class Role {
  constructor(data = {}, application) {
    this[sym('model')] = data;
    this[sym('application')] = application;
  }

  static get schema() {
    return {
      name: {type: 'string', required, unique},
      name_ru: {type: 'string', unique},
      permissions: {type: 'object', default: {}},
    };
  }

  static get scemaOptions() {
    return {
      timestamps: true,
      index: [
        [
          ['name'],
          {unique: true},
        ],
      ],
    };
  }

  static findAll(params, options = {}, application) {
    return co(function* () {
      let tableName = application ? `Role_${application}` : 'Role';
      let roles = yield DBAdapter.init(tableName, this.schema, this.scemaOptions, application).findAll(params);
      return (roles || []).map((r) => new this(r, application));
    }.bind(this));
  }

  static find(params, options = {}, application) {
    return co(function* () {
      let tableName = application ? `Role_${application}` : 'Role';
      let role = yield DBAdapter.init(tableName, this.schema, this.scemaOptions, application).find(params);
      if (!role) throw new AFError(404, 'Role not found');
      return new this(role, application);
    }.bind(this));
  }

  static access(req, rule) {
    if (rule) return ['role', rule];

    switch (req.method.toUpperCase()) {
      case 'GET': return req.params && req.params.role_id ? ['role', 'view'] : ['role', 'list'];
      case 'POST': return ['role', 'create'];
      case 'PUT': return ['role', 'update'];
      case 'DELETE': return ['role', 'delete'];
    }
  }

  static validatePermission(name, access, req) {
    switch (name) {
      case 'all':
        return ['list', 'create'].indexOf(access) > -1;

      case 'own':
        if (['list', 'view', 'update'].indexOf(access) > -1) {
          return req.user.role ? {filter: {id: req.user.role.id}} : {};
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
        if (this.id && this.id.toString() == req.user.role.id.toString()) {
          if (['list', 'view', 'update'].indexOf(access) > -1) {
            return req.user.role ? {filter: {id: req.user.role.id}} : {};
          }
          return false;
        } else {
          return false;
        }

      default: return false;
    }
  }

  get id() { return this.self.id ? this.self.id.toString() : null; }
  get name() { return this.self.name; }
  get permissions() { return this.self.permissions; }
  get application() { return this[sym('application')]; }

  get self() { return this[sym('model')]; }

  set name(value) { this.self.name = value; }
  set name_ru(value) { this.self.name_ru = value; }
  set permissions(value) { this.self.permissions = value; }

  save() {
    return co(function* () {
      let role;
      let schema = this.constructor.schema;
      let options = this.constructor.schemaOptions;
      let tableName = this.application ? `Role_${this.application}` : 'Role';

      if (this.id) {
        role = yield DBAdapter.init(tableName, schema, options, this.applicaiton).update(this.self);
      } else {
        role = yield DBAdapter.init(tableName, schema, options, this.applicaiton).insert(this.self);
      }

      this.self.id = role.id;

      return this;
    }.bind(this));
  }

  update(newData) {
    return co(function* () {
      Object.keys(newData).map((f) => this[f] = newData[f]);
      return this.save();
    }.bind(this));
  }

  remove() {
    return co(function* () {
      let schema = this.constructor.schema;
      let options = this.constructor.schemaOptions;
      let tableName = this.application ? `Role_${this.application}` : 'Role';
      yield DBAdapter.init(tableName, schema, options, this.applicaiton).remove({id: this.id});
      Object.keys(this.self).map((k) => delete this.self[k]);
      return this;
    }.bind(this));
  }
}

module.exports = Role;
