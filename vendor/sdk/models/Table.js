/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const co = require('co');

const AFError = require('./Error');
const DBAdapter = require('./DBAdapter');
const Entity = require('./Entity');
const TableData = require('./TableData');
const Common = require('./Common');

const symbols = {};
const sym = name => (symbols[name] || (symbols[name] = Symbol(name)));
const [ required, array ] = [true, true];

class Table extends Entity {
  constructor(data = {}) {
    super(data);
    this[sym('model')] = data;
  }

  static fetch(name, application) {
    return co(function *() {
      let table = yield Entity.fetch(name, 'Table', application);
      if (!table) throw new AFError(404, 'Table not found');

      Table[name] = new Table(table);
      return Table[name];
    }.bind(this));
  }

  static fetchAll(application) {
    return co(function *() {
      let tables = yield Entity.fetchAll('Table', application);
      if (tables.length == 0) throw new AFError(404, 'Tables not found'); 
      let schemas = {};
      tables.map((tb) => {
        schemas[tb.name] = new Table(tb);
      });
      return schemas;
     /* Table[name] = new Table(table);
      return Table[name];*/
    }.bind(this));
  }

  static get schema() {
    let schema = Entity.schema;
    Object.assign(schema, {
      options: {
        adapter: { type: 'string', enum: DBAdapter.list, required },
        indexes: {
          array,
          type: 'object',
          schema: {
            name: { type: 'string', required },
            unique: { type: 'boolean' },
          }
        },
        timestamps: { type: 'boolean' },
        fields: { type: 'object' },
        rules: { type: 'object' },
        params: { type: 'object' }
      }
    });

    return schema;
  }

  static swagger(fieldTable) {
    return co.wrap(function *(swagger, params) {
      if (swagger.application) {
        let fields = params.fields.filter(f => !(f.in == 'path' && f.name == fieldTable));

        let findParams = { type: 'Table', application: swagger.application.id };
        if (swagger.entity) {
          if (swagger.entity.type != 'Table') return false;
          findParams.id = swagger.entity.id;
        }

        let tables = yield this.findAll(findParams);
        tables.map(t => {
          let model = Object.assign({}, t.self);
          model.name = 'TableData_' + model.name;
          model.schema = t.fields;

          let responses = Object.assign({}, params.responses);
          responses[200] = Object.assign({}, responses[200], { model });

          let newPath = Object.assign({}, params, {
            path: params.path.replace(`{${fieldTable}}`, t.name),
            tag: `${params.tag}-${t.name}`,
            description: t.description,
            models: [model].concat(params.models || []),
            responses,
            fields,
          });

          if (newPath.methods[0] == 'post' || newPath.methods[0] == 'put') {
            let name = (`${newPath.tag}-${newPath.path}-${newPath.methods.join('-')}-body`).replace(/\//g, '_');
            newPath.models.push({
              name, schema: model.schema
            });
            newPath.fields.push({
              name: 'body',
              in: 'body',
              type: 'string',
              $ref: `#/definitions/${name}`,
            });
          }

          if (params.paramNames) {
            params.paramNames.map(p => {
              if (p.name == fieldTable) return;
              let i = newPath.fields.findIndex(f => f.in == 'path' && f.name == p.name);
              if (p.optional) {
                let path = newPath.path.replace(`/{${newPath.fields[i].name}}`, '') || '/';
                let fields = [].concat(newPath.fields.slice(0, i), newPath.fields.slice(i + 1));
                swagger.addPath(Object.assign({}, newPath, { path, fields }));
              }
            });
          }

          swagger.addPath(newPath);
        });
      }

      return !swagger.entity;
    }.bind(this));
  }

  static access(req, rule) {
    if (rule) return ['table', rule];

    switch (req.method.toUpperCase()) {
      case 'GET': return req.params && req.params.data_id ? ['table', 'view'] : ['table', 'list'];
      case 'POST': return ['table', 'create'];
      case 'PUT': return ['table', 'update'];
      case 'DELETE': return ['table', 'delete'];
    }
  }

  validatePermission(name, access, req) {
    if (!req.table.options.rules || !req.table.options.rules[name]) {
      switch (name) {
        case 'all':
          let rule = {
            access: ['list', 'view', 'create', 'update', 'delete'],
            filter: {}
          };

          return this.checkRule(rule, access, req);

        default: return false;
      }
    }

    return this.checkRule(req.table.options.rules[name], access, Object.assign({}, req, req.params));
  }

  /**
 *  селект публичного доступа перебивал данные для суперадмина
    || (object.isAuthorised && !object.role) добавлено
    селект публичный перебивает по-прежнему правило all
    но в обход можно создать отдельное правило и сделать его important
 */
  checkRule(rule, access, object) {
    if (rule.access && (rule.access.indexOf(access) < 0 || (object.isAuthorised && !object.role))) {
      return false;
    }

    rule.filter = rule.filter ? Common.parsePlaceholders(rule.filter, object) : null;

    return rule;
  }

  set req(value) { this[sym('request')] = value; }
  get req() { return this[sym('request')]; }

  get adapter() { return (this.options.adapter || 'mongodb').toLowerCase(); }
  get fields() { return this.options.fields || {}; }
  get params() { return this.options.params || {}; }
  get indexes() { return this.params.indexes; }
  get timestamps() { return this.params.timestamps; }
  get triggers() { return this.options.triggers; }
  get tablename() { return `TableEntity_${this.id}`; }

  get db() {
    return this[sym('db')] ||
      (this[sym('db')] = DBAdapter.get(this.adapter)
        .init(
          this.tablename,
          this.fields,
          { indexes: this.indexes, timestamps: this.timestamps },
          this.application.self ? this.application.id : this.application
        ));
  }

  get self() { return this[sym('model')]; }

  runTrigger(trigger, type, prefix, data) {
    return co(function *() {
      if (!trigger.entity) throw new AFError(500, 'No entity for trigger');

      let Script = require('./Script');

      let script = yield Script.fetch(trigger.entity, this.application);
      if (!script) throw new AFError(500, 'Not found entity for trigger');

      script.data = { data, type, prefix };
      script.req = this.req;
      return yield script.run().catch(error => Object.assign({ error }, data)).then(d => d || data);
    }.bind(this));
  }

  triggerSequence(type, prefix, data) {
    return co(function *() {
      if (!type || !prefix) throw new AFError(500, 'Undefined options on trigger query');

      let triggers = this.triggers || [];

      let errors = [];
      for (let i = 0; i < triggers.length; i++) {
        if (triggers[i].type == type && triggers[i][prefix]) {
          data = yield this.runTrigger(triggers[i], type, prefix, data).catch(e => (errors.push(e), data));
        }
      }

      if (errors.length) data = Object.assign(errors.length == 1 ? { error: errors[0] } : { errors }, data);
      return data;
    }.bind(this));
  }

  findAll(params, options = {}, triggering) {
    return co(function *() {
      options.limit = parseInt(options.limit || this.params.limit);
      let filter = { params, options };
      if (triggering) filter = yield this.triggerSequence('list', 'pre', filter);

      let count = yield this.db.count(filter.params);
      let datas = yield this.db.findAll(filter.params, filter.options);
      datas = datas.map(d => d && new TableData(d, this, true));

      for (let d in datas) {
        if (datas[d]) yield datas[d].purifyData();
      }

      let result = {
        fields: this.fields,
        count,
        data: datas,
      };

      if (triggering) return yield this.triggerSequence('list', 'post', result);
      return result;
    }.bind(this));
  }

  updateMany(params, newData, options = {}) {
    return co(function *() {
      options.limit = parseInt(options.limit || this.params.limit);
      let filter = {params, options};

      newData = new TableData(newData, this, true);
      yield newData.validateData();

      let datas = yield this.db.updateMany(filter.params, newData, filter.options);
      
      let result = {
        fields: this.fields,
        data: datas,
      };
      
      return result;
    }.bind(this));
  }

  insertMany(newData) {
    return co(function *() {
      function* validate(item) {
        item = new TableData(item, this);
        yield item.validateData();
        return item;
      };

      newData = yield newData.map(validate.bind(this));

      let datas = yield this.db.insertMany(newData);

      function* purify(item) {
        item = new TableData(item, this, true);
        yield item.purifyData();
        return item;
      };

      datas = yield datas.map(purify.bind(this));

      let result = {
        fields: this.fields,
        data: datas,
      };
      return result;
    }.bind(this));
  }

  findOneAndUpdate(params, newData, options = {}) {
    return co(function *() {
      options.limit = parseInt(options.limit || this.params.limit);
      let filter = {params, options};

      newData = new TableData(newData, this, true);
      yield newData.validateData();

      let data = yield this.db.findOneAndUpdate(filter.params, newData, filter.options);
      
      // If no document found and upsert is not enabled, return null
      if (!data) {
        // If upsert option is set, create new document
        if (options.upsert) {
          // Create new document with initial data
          data = yield this.db.insert(Object.assign({}, filter.params, newData));
        } else {
          return null;
        }
      }
      
      data = new TableData(data, this, true);
      yield data.purifyData();
      
      let result = {
        fields: this.fields,
        data: data,
      };
      
      return result;
    }.bind(this));
  }

  find(params, options = {}, triggering) {
    return co(function *() {
      let _id = this.db.toId(params);
      if (_id || typeof params != 'object') {
        params = { id: this.db.toId(params) };
      }

      let filter = { params, options };
      if (triggering) filter = yield this.triggerSequence('view', 'pre', filter);

      options = Object.assign({}, options, { limit: 1, offset: 0 });
      let { fields, data: [ data ] } = yield this.findAll(filter.params, filter.options);
      if (!data) throw new AFError(404, 'Table data not found');

      if (data && !(data instanceof TableData)) {
        data = new TableData(data, this, true);
      }

      let result = {
        fields: this.fields,
        data: data,
      };

      if (triggering) return yield this.triggerSequence('view', 'post', result);
      return result;
    }.bind(this));
  }

  create(newData) {
    let data = new TableData(newData, this);
    return data.save();
  }

  update(params, newData) {
    return co(function *() {
      let items = yield this.findAll(params);
      items = items.map(item => item && new TableData(item, this, true));
      for (let i in items) items[i] = yield items[i].update(newData);
      return items;
    }.bind(this));
  }

  remove(params) {
    return this.db.remove(params);
  }
}

module.exports = Table;
