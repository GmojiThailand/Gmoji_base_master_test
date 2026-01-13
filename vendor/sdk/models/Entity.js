/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const co = require('co');

const AFError = require('./Error');
const DBAdapter = require('./DBAdapter').get();
const Application = require('./Application');

const required = true;

class Entity {
  constructor(data) {
    data.options = data.options || {};
  }

  static fetch(name, type, application) {
    let params = {
      $or: [
        {id: DBAdapter.toId(name)},
        {name: name},
      ],
    };

    if (type) params = {'$and': [params, {type}]};
    if (application && application instanceof Application) application = application.id;
    if (application) params = {'$and': [params, {application}]};

    return DBAdapter.init('Entity', this.schema, undefined, application).find(params);
  }

  static fetchAll(type, application) {
    let params = {};
    if (type) params = {'$and': [params, {type}]};
    if (application && application instanceof Application) application = application.id;
    if (application) params = {'$and': [params, {application}]};

    return DBAdapter.init('Entity', this.schema, undefined, application).findAll(params);
  }


  static get schema() {
    return {
      name: {type: 'string', required},
      application: {type: 'id', required, referer: 'Application', model: require('./Application')},
      type: {type: 'string', enum: ['Table', 'Service', 'Script'], required},
      options: {type: 'object'},
      rules: {type: 'object'},
    };
  }

  static findAll(params, application, options) {
    return co(function* () {
      if (application && application instanceof Application) application = application.id;
      if (application) params = {'$and': [params, {application}]};
      let ents = yield DBAdapter.init('Entity', this.schema, undefined, application).findAll(params, options);

      if (this.name == 'Entity') return (ents || []);
      return (ents || []).map((e) => new this(e));
    }.bind(this));
  }

  static find(params, application, options) {
    return co(function* () {
      if (application && application instanceof Application) application = application.id;
      if (application) params = {'$and': [params, {application}]};
      let ent = yield DBAdapter.init('Entity', this.schema, undefined, application).find(params, options);
      if (!ent) throw new AFError(404, 'Entity not found');

      if (this.name == 'Entity') return ent;
      return new this(ent);
    }.bind(this));
  }

  static access(req, rule) {
    if (rule) return ['entity', rule];

    switch (req.method.toUpperCase()) {
      case 'GET': return req.params && req.params.ent_id ? ['entity', 'view'] : ['entity', 'list'];
      case 'POST': return ['entity', 'create'];
      case 'PUT': return ['entity', 'update'];
      case 'DELETE': return ['entity', 'delete'];
    }
  }

  static validatePermission(name, access, req) {
    switch (name) {
      case 'all':
        return ['list', 'view', 'create'].indexOf(access) > -1;

      default: return false;
    }
  }

  validatePermission(name, access, req) {
    switch (name) {
      case 'all':
        return ['list', 'view', 'create', 'update', 'delete'].indexOf(access) > -1;

      default: return false;
    }
  }

  get id() { return this.self.id; }
  get application() { return this.self.application; }
  get name() { return this.self.name; }
  get type() { return this.self.type; }
  get options() { return this.self.options; }
  get rules() { return this.self.options.rules; }

  set id(value) { return null; }
  set application(value) { return null; }
  set name(value) { if (value) this.self.name = value; }
  set type(value) { if (value) this.self.type = value; }
  set options(value) { Object.keys(value || {}).map((k) => this.self.options[k] = value[k]); }
  set rules(value) { if (value) this.self.options.rules = value; }
}

module.exports = Entity;
