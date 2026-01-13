/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const co = require('co');
const vm = require('vm');
const request = require('request');
const fs = require('fs');
const ch = require('child_process');
const uuid = require('uuid');

const AFError = require('./Error');
const Entity = require('./Entity');
const Config = require('../models/Config')();

const symbols = {};
const sym = (name) => (symbols[name] || (symbols[name] = Symbol(name)));

class Script extends Entity {
  constructor(data = {}) {
    super(data);
    this[sym('model')] = data;
  }

  static fetch(name, application) {
    return co(function* () {
      let script = yield Entity.fetch(name, 'Script', application);
      if (!script) throw new AFError(404, 'Script not found');

      Script[name] = new Script(script);
      return Script[name];
    });
  }

  static get schema() {
    let schema = Entity.schema;
    Object.assign(schema, {
      options: {
        code: {type: 'string'},
        rules: {type: 'object'},
      },
    });

    return schema;
  }

  static swagger(fieldTable) {
    return co.wrap(function* (swagger, params) {
    });
  }

  static access(req, rule) {
    return ['script', rule || 'run'];
  }

  validatePermission(name, access, req) {
    if (!req.script.options.rules || !req.script.options.rules[name]) {
      switch (name) {
        case 'all':
          let rule = {
            access: ['run'],
          };

          return this.checkRule(rule, access, req);

        default: return false;
      }
    }

    return this.checkRule(req.script.options.rules[name], access, Object.assign(req, req.params));
  }

  checkRule(rule, access, object) {
    if (rule.access && rule.access.indexOf(access) < 0) {
      return false;
    }

    return rule;
  }

  get self() { return this[sym('model')]; }

  get data() { return this[sym('data')]; }
  get req() { return this[sym('req')]; }

  set data(value) { this[sym('data')] = value; }
  set req(value) { this[sym('req')] = value; }

  run() {
    return new Promise((resolve, reject) => {
      let resolved = false;
      let context = {
        done: (data) => {
          if (!resolved) {
            resolved = true;
            resolve(data);
          }
        },

        co: co,
        console: console,
        Promise: Promise,
        Error: AFError,
        Application: require('./Application'),
        Auth: require('./Auth'),
        User: require('./User'),
        Entity: require('./Entity'),
        Table: require('./Table'),
        Service: require('./Service'),
        Role: require('./Role'),
        Script: Script,
        request: request,
        Environment: Config.environment,
        uuid: uuid,
        fs: fs,
        ch: ch,
        Buffer: Buffer,
        Date: Date,
        Math: Math,
        __dirname: __dirname,
        name: this.name,
        data: this.data || {},
        req: this.req,
      };

      Object.assign(context, this.options.context);

      vm.runInNewContext(
        `co(function *(){${this.options.code}}.bind(this)).then(done).catch(done);\n`,
        context,
        this.id + '_script.js'
      );
    });
  }
}

module.exports = Script;
