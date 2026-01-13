/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const co = require('co');

const symbols = {};
const sym = name => (symbols[name] || (symbols[name] = Symbol(name)));

const AFError = require('./Error.js');
const File = require('./fields/File.js');

class TableData {
  constructor(data = {}, table, notNew = false) {
    data = data.toObject ? data.toObject() : data;
    Object.assign(this, data);

    this[sym('table')] = table;
    this[sym('isNew')] = !(this.id || this.id === 0) && !notNew;

    if (!this[sym('isNew')]) {
      this[sym('id')] = this.id;
    }
  }

  get schema() { return this[sym('table')].fields; }

  runTrigger(trigger, type, prefix, newData) {
    return co(function *() {
      if (!trigger.entity) throw new AFError(500, 'No entity for trigger');

      let Script = require('./Script');

      let script = yield Script.fetch(trigger.entity, this[sym('table')].application);
      if (!script) throw new AFError(500, 'Not found entity for trigger');

      script.data = { data: this, type, prefix, newData };
      script.req = this[sym('table')].req;
      yield script.run().catch(e => { throw new AFError(500, 'Error in trigger', e); });
      return this;
    }.bind(this));
  }

  triggerSequence(type, prefix, data) {
    return co(function *() {
      if (!type || !prefix) throw new AFError(500, 'Undefined options on trigger query');

      let triggers = this[sym('table')].triggers || [];

      for (let i = 0; i < triggers.length; i++) {
        if (triggers[i].type == type && triggers[i][prefix]) {
          yield this.runTrigger(triggers[i], type, prefix, data);
        }
      }

      return this;
    }.bind(this));
  }

  validateData() {
    return co(function *() {
      for (let i in this) {
        let v = v => v;
        let f = f => true;

        if (!this[sym('table')].fields[i]) {
          let ts = this[sym('table')].timestamps;
          if (ts && typeof ts == 'object' && [ts.createdAt, ts.updatedAt].indexOf(i) >= 0) continue;
          if (ts && typeof ts != 'object' && ['createdAt', 'updatedAt'].indexOf(i) >= 0) continue;

          // TODO: Продумать как корректно исключать поля, если их нет в схеме таблицы
          // this[i] = i == 'id' ? this[i] : undefined;
          continue;
        }

        let isArray = this[sym('table')].fields[i].array;
        this[i] = (isArray && !Array.isArray(this[i])) ? [this[i]] : this[i];

        switch (this[sym('table')].fields[i].type) {
          case 'string':
            v = v => (v != null ? v + '' : '');
            f = f => (f !== null);
            break;

          case 'number':
            v = v => parseFloat(v);
            f = f => (f !== null && !isNaN(parseFloat(f)));
            break;

          case 'boolean':
            v = v => !!v;
            f = f => (f !== null);
            break;

          case 'file':
            this[i] = Array.isArray(this[i]) ? this[i] : [this[i]];
            f = f => (f && Object.keys(f).length);
            for (let k in this[i])
              if (this[i][k])
                this[i][k] = yield File.validate(this[sym('table')].fields[i], this[i][k][0] || this[i][k]);
            if (!isArray) this[i] = this[i][0];
            break;

          case 'referer':
            f = f => (f && (this[sym('table')].db.toId(f) || this[sym('table')].db.toId(f.id)));
            v = v => (!this[sym('table')].db.toId(v) && v.id ? v.id : v);
            break;

          case 'geo':
            f = f => (f && (typeof f == 'object' || typeof f == 'array'));
            v = v => {
           if (this[sym('table')].fields[i].geo_type) {
            let result;
            let multipolyarr = []; //массив группы вложенных полигонов
            let polyarr = []; //массив вложенных полигонов
            let arr = []; // массив с координатами
            switch (this[sym('table')].fields[i].geo_type) {

              case 'MultiPolygon':
              v.map(vl => {
                vl.map(val => {
                  val.map(value => {
                    arr.push([parseFloat(value.lng || value[0]) || 0, parseFloat(value.lat || value[1]) || 0]);
                  });
                  polyarr.push(arr);
                  arr = [];
                });
                multipolyarr.push(polyarr);
                polyarr = [];
              });
              result = {coordinates: multipolyarr};
              break;
              case 'Polygon':
              v.map(vl => {
                  vl.map(val => {
                    arr.push([parseFloat(val.lng || val[0]) || 0, parseFloat(val.lat || val[1]) || 0]);
                  });
                  polyarr.push(arr);
                  arr = [];
              });
              result = {coordinates: polyarr};
              break;
              case 'LineString':
                  v.map(val => {
                    arr.push([parseFloat(val.lng || val[0]) || 0, parseFloat(val.lat || val[1]) || 0]);
                  });
                  result = {coordinates: arr};
              break;
              case 'Point':
                  result = {coordinates: [parseFloat(v.lng || v[0]) || 0, parseFloat(v.lat || v[1]) || 0]};
              break;
            }
            return result;
           } else {
             return {coordinates: [parseFloat(v.lng || v[0]) || 0, parseFloat(v.lat || v[1]) || 0]};
           }             
            };
            break;

          case 'date':
            let sec = !!this[sym('table')].fields[i].sec;
            f = f => (f && (f instanceof Date || !isNaN(parseInt(f)) || f.toString().toUpperCase() == 'NOW'));
            v = v => {
              if (v.toString().toUpperCase() == 'NOW') {
                v = Date.now();
                if (sec) v = v / 1000;
              }
              return new Date(parseInt(v));
            };
            break;
        }

        if (isArray) {
          this[i] = this[i].filter(f).map(v).filter(f);
        } else {
          this[i] = f(this[i]) ? v(this[i]) : undefined;
          this[i] = f(this[i]) ? this[i] : undefined;
        }
      }

      return this;
    }.bind(this));
  }

  purifyData() {
    return co(function *() {
      for (let i in this) {
        let v = v => v;

        if (!this[sym('table')].fields[i]) {
          let ts = this[sym('table')].timestamps;
          if (ts && typeof ts == 'object' && [ts.createdAt, ts.updatedAt].indexOf(i) >= 0) continue;
          if (ts && typeof ts != 'object' && ['createdAt', 'updatedAt'].indexOf(i) >= 0) continue;

          this[i] = i == 'id' ? this[i] : undefined;
          continue;
        }

        let isArray = this[sym('table')].fields[i].array;
        this[i] = (isArray && !this[i]) ? [] : this[i];
        this[i] = (isArray && !Array.isArray(this[i])) ? [this[i]] : this[i];

        switch (this[sym('table')].fields[i].type) {
          case 'file':
            this[i] = Array.isArray(this[i]) ? this[i] : [this[i]];
            //for (let k in this[i])
            //  this[i][k] = yield Promise.resolve(File.get(this[sym('table')].fields[i], this[i][k]));
            if (!isArray) this[i] = this[i][0];
            break;

          case 'date':
            v = v => parseInt(v.getTime());
            break;

          case 'geo':
            v = v => {
          if (this[sym('table')].fields[i].geo_type) {
            let result;
            let multipolyarr = [];
            let polyarr = [];
            let arr = [];
            switch (this[sym('table')].fields[i].geo_type) {
              case 'MultiPolygon':
              v.coordinates.map(vl => {
                   vl.map(val => {
                     val.map(value => {
                        arr.push([value[0], value[1]]);
                     });
                     polyarr.push(arr);
                     arr = [];
                  });
                  multipolyarr.push(polyarr);
                  polyarr = [];
              });
              result = multipolyarr;
              break;
              case 'Polygon':
              v.coordinates.map(vl => {
                   vl.map(val => {
                    arr.push([val[0], val[1]]);
                  });
                  polyarr.push(arr);
                  arr = [];
                })
                  result = polyarr;
              break;
              case 'LineString':
                  v.coordinates.map(val => {
                    arr.push([val[0], val[1]]);
                  });
                  result = arr;
              break;
              case 'Point':
                  result = [v.coordinates[0], v.coordinates[1]];
              break;
            }
            return result;
           } else {
             return [v.coordinates[0], v.coordinates[1]];
           }             
        }
          break;
        }

        if (isArray) {
          this[i] = this[i].map(v);
        } else {
          this[i] = v(this[i]);
        }
      }

      return this;
    }.bind(this));
  }

  save() {
    return co(function *() {
      if (this[sym('isNew')]) yield this.triggerSequence('create', 'pre', this);
      yield this.triggerSequence('save', 'pre');
      yield this.validateData();

      let data;
      if (this[sym('isNew')]) {
        data = yield this[sym('table')].db.insert(this);
      } else {
        data = yield this[sym('table')].db.update(this);
      }

      Object.keys(this).map(f => (delete this[f]));
      Object.assign(this, data);

      yield this.purifyData();
      yield this.triggerSequence('save', 'post');
      if (this[sym('isNew')]) yield this.triggerSequence('create', 'post');

      this[sym('isNew')] = false;

      return this;
    }.bind(this));
  }

  update(data) {
    return co(function *() {
      yield this.triggerSequence('update', 'pre', data);

      data = data.toObject ? data.toObject() : data;
      Object.assign(this, data);

      yield this.save();
      yield this.triggerSequence('update', 'post', data);

      return this;
    }.bind(this));
  }

  remove() {
    return co(function *() {
      yield this.triggerSequence('delete', 'pre');
      yield this[sym('table')].db.remove({ id: this.id });
      yield this.triggerSequence('delete', 'post');
      return this;
    }.bind(this));
  }
}

module.exports = TableData;
