/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const co = require('co');

const AFError = require('./Error');
const Adapter = require('./DBAdapter');
const Entity = require('./Entity');
const DBAdapter = Adapter.get();

const symbols = {};
const sym = name => (symbols[name] || (symbols[name] = Symbol(name)));
const [ required, unique ] = [true, true];

class Log  {
  constructor(data = {}, application) {
    this[sym('model')] = data;
    this[sym('application')] = application;
  }

  static get schema() {
    return {
      req_type: { type: 'string', required },
      ent_name: { type: 'string', required, unique },
      ent_type: { type: 'string', required },
      username: { type: 'string' },
      pre_state: { type: 'string' },
      post_state: { type: 'string' }
    };
  }

  static get schemaOptions() {
    return {
      timestamps: true,
      index: [
        [['name'], { unique: true }],
      ]
    };
  }

  static access(req, rule) {
    if (rule) return ['log', rule];
    switch (req.method.toUpperCase()) {
      case 'GET': return ['log', 'list'];
    }
  }

  static validatePermission(name, access, req) {
    switch (name) {
      case 'all':
        return [].indexOf(access) > -1;
      default: return false;
    }
  }

  static findAll(params, options = {}, application) {
    return co(function *() {
      let tableName = application ? `Log_${application}` : 'Log';
      let count = yield DBAdapter.init(tableName, this.schema, this.schemaOptions, application).count(params);
      let logs = yield DBAdapter.init(tableName, this.schema, this.schemaOptions, application).findAll(params, options);
      let result = {
        count,
        data: (logs || []).map(r => new this(r, application))
      };
      return result;
    }.bind(this));
  }

  static find(params, options = {}, application) {
    return co(function *() {
      let tableName = application ? `Log_${application}` : 'Log';
      let log = yield DBAdapter.init(tableName, this.schema, this.schemaOptions, application).find(params, options);
      if (!log) throw new AFError(404, 'Log not found');
      return new this(role, application);
    }.bind(this));
  }

  get id() { return this.self.id ? this.self.id.toString() : null; }
  get name() { return this.self.name; }
  get application() { return this[sym('application')]; }
  get self() { return this[sym('model')]; }
  get adapter() { return 'mongodb'; }
  get db() {
    return this[sym('db')] ||
      (this[sym('db')] = DBAdapter
        .init(
          this.application ? `Log_${this.application}` : 'Log',
          this.constructor.schema,
          this.constructor.schemaOptions,
          this.applicaiton
        ));
  }

  save() {
    return co(function *() {
      let log;
      let schema = this.constructor.schema;
      let options = this.constructor.schemaOptions;
      let tableName = this.application ? `Log_${this.application}` : 'Log';

      if (this.id) {
        log = yield DBAdapter.init(tableName, schema, options, this.applicaiton).update(this.self);
      } else {
        log = yield DBAdapter.init(tableName, schema, options, this.applicaiton).insert(this.self);
      }

      this.self.id = log.id;

      return this;
    }.bind(this));
  }

}
module.exports = Log;
