/**
 * «mobileSimbirsoft Platform».
 * Интеллектуальная собственность ООО «Мобайл СимбирСофт».
 * Copyright © 2017 by «Мобайл СимбирСофт».
 */

'use strict';

const co = require('co');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
// Prepare for Mongoose v7 default change and suppress deprecation warning
try {
  mongoose.set('strictQuery', false);
} catch (e) {
  // ignore if mongoose version doesn't support this
}

const AFError = require('../models/Error');
const BaseAdapter = require('./BaseAdapter');

function setConnectUrl() {
  // Prefer explicit connection strings from environment (Railway variables etc.)
  const envCandidates = [
    'MONGODB_URL',
    'MONGO_URL',
    'MONGO_PUBLIC_URL',
    'MONGO_URI'
  ];

  for (const k of envCandidates) {
    if (process.env[k] && process.env[k].trim()) {
      return process.env[k].trim();
    }
  }

  // Allow building connection string from individual MONGO_* vars
  // (support MONGOUSER/MONGOPASSWORD/MONGOHOST/MONGOPORT and Docker's MONGO_INITDB_ROOT_*)
  const envUser = process.env.MONGOUSER || process.env.MONGO_USER || process.env.MONGO_INITDB_ROOT_USERNAME || process.env.MONGO_INITDB_ROOT_USER;
  const envPass = process.env.MONGOPASSWORD || process.env.MONGO_PASSWORD || process.env.MONGO_INITDB_ROOT_PASSWORD;
  const envHost = process.env.MONGOHOST || process.env.MONGO_HOST;
  const envPort = process.env.MONGOPORT || process.env.MONGO_PORT;
  if (envUser && envPass && envHost) {
    // Load config to get DB name/authSource defaults
    const Config = require('../models/Config')();
    const mongoDBConfig = Config.db.mongodb || {};
    const dbName = process.env.MONGODB_NAME || process.env.MONGO_DB || mongoDBConfig.name || 'api-factory';
    const authSource = mongoDBConfig.authSource || 'admin';
    const portPart = envPort || mongoDBConfig.port || 27017;
    return `mongodb://${envUser}:${envPass}@${envHost}:${portPart}/${dbName}?authSource=${authSource}`;
  }

  // Fallback to config-based URL construction
  const Config = require('../models/Config')();
  const mongoDBConfig = Config.db.mongodb;
  const auth = mongoDBConfig.username && mongoDBConfig.password && mongoDBConfig.authSource;
  let connectURL = '';

  connectURL += `${mongoDBConfig.host || 'localhost'}:`;
  connectURL += `${mongoDBConfig.port || 27017}/`;
  connectURL += `${mongoDBConfig.name || 'api-factory'}`;

  if (auth) {
    const requisites = `${mongoDBConfig.username}:${mongoDBConfig.password}`;
    let pattern = `${requisites}@${connectURL}?authSource=${mongoDBConfig.authSource}`;
    connectURL = pattern;
  }

  connectURL = 'mongodb://' + connectURL;

  return connectURL;
}

// Wrap connect logic to avoid multiple connect attempts in serverless environments
const connectOptions = { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};
function doConnect() {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      // Already connected
      return Promise.resolve();
    }
  } catch (e) {
    // ignore
  }

  return mongoose.connect(setConnectUrl(), connectOptions).catch((err) => {
    // Handle connection errors gracefully - don't crash the app
    console.error('MongoDB connection error:', err.message || err);
    // Connection will be retried automatically by Mongoose
    // Return a rejected promise so the connection state is tracked
    return Promise.reject(err);
  });
}

// Attempt initial connection with error handling to prevent unhandled promise rejection
doConnect().catch((err) => {
  // Error already logged in doConnect(), just prevent unhandled rejection
  // The connection will be retried automatically by Mongoose's connection pooling
});

// Add connection event listeners to avoid unhandled errors and log status
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message || err);
});
mongoose.connection.on('connected', () => {
  try {
    const host = mongoose.connection.host || (mongoose.connection.client && mongoose.connection.client.s && mongoose.connection.client.s.url) || null;
    console.log('MongoDB connected to', host || 'unknown host');
  } catch (e) {
    console.log('MongoDB connected');
  }
});
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});
mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

function queryResolver(query) {
  return new Promise((resolve, reject) => {
    query.exec((err, result) => {
      if (err) { reject(err); }
      resolve(result);
    });
  });
}

class MongoDB extends BaseAdapter {
  get wait() {
    this._wait = this._wait || Promise.resolve();
    return this._wait;
  }

  set wait(value) {
    this._wait = this.wait.then(() => value);
  }

  static reconnect() {
    mongoose.disconnect()
      .then(() => {
        return doConnect();
      })
      .catch((error) => {
        console.error(error);
        return doConnect();
      });
  }

  init() {
    this.idStack = [];

    if (mongoose.models[this.tableName]) {
      this.Schema = mongoose.models[this.tableName].schema;
      this.schema = this.Schema.schema;

      this.Model = mongoose.models[this.tableName];
      this.populates = this.Model.populates;
    } else {
      this.populates = {};

      this.Schema = this.convertScheme(this.schema, this.options);
      this.Schema.schema = this.schema;

      this.Model = mongoose.model(this.tableName, this.Schema);
      this.Model.populates = this.populates;
    }

    return this;
  }

  convertScheme(scheme, options) {
    let sc = {};
    let opts = Object.assign({versionKey: false}, options);
    let geof = [];
    Object.keys(scheme).map((k) => {
      sc[k] = this.getSchemeField(k, scheme[k]);
      if (scheme[k].type == 'geo') {
        geof.push(scheme[k].name);
      }
    });
    let resultSchema = new mongoose.Schema(sc, opts);

    if (geof.length) {
      geof.map((f) => {
        resultSchema.index({[f]: '2dsphere'});
      });
    }

    return resultSchema;
  }

  getSchemeField(name, field) {
    let sc = {};

    switch (field.type) {
      case 'number':
      case 'integer':
      case 'float': sc.type = mongoose.Schema.Types.Number; break;
      case 'string': sc.type = mongoose.Schema.Types.String; break;
      case 'boolean': sc.type = mongoose.Schema.Types.Boolean; break;
      case 'date': sc.type = mongoose.Schema.Types.Date; break;
      case 'geo':
        let type;
        if (field.geo_type) {
          switch (field.geo_type) {
            case 'MultiPolygon': type = [[[[mongoose.Schema.Types.Number]]]]; break;
            case 'Polygon': type = [[[mongoose.Schema.Types.Number]]]; break;
            case 'LineString': type = [[mongoose.Schema.Types.Number]]; break;
            case 'Point': type = [mongoose.Schema.Types.Number]; break;
          }
        } else {
          type = [mongoose.Schema.Types.Number];
        }
        sc = new mongoose.Schema(
          {
            type: {
              type: mongoose.Schema.Types.String,
              enum: ['Point', 'Polygon', 'LineString', 'MultiPolygon'],
              default: field.geo_type || 'Point',
            },
            coordinates: {type: type},
          },
          {versionKey: false}
        );
        break;

      case 'id':
      case 'referer':
        if ((field.referer || field.ref) && !field.model) {
          let ref = field.referer || field.ref;
          if (typeof ref == 'string' || this.toId(ref)) {
            ref = require('../models/Table').fetch(ref, this.application);
          }

          field.model = ref;
        }
        if (field.populate) this.populates[name] = field.populate;

        sc.type = mongoose.Schema.Types.ObjectId;
        break;

      case 'object':
        sc.type = mongoose.Schema.Types.Mixed;
        sc._id = false;
        break;

      case 'file':
        sc.type = mongoose.Schema.Types.Mixed;
        sc._id = false;
        break;

      default:
        if (field && typeof field == 'object') return this.convertScheme(field, {_id: false});
        sc.type = mongoose.Schema.Types.Mixed;
        sc._id = false;
    }

    ['required', 'trim', 'uppercase', 'lowercase'].map((p) => {
      if (typeof field[p] !== 'undefined') {
        sc[p] = !!field[p];
      }
    });
    ['default', 'enum', 'min', 'max', 'expires'].map((p) => {
      if (typeof field[p] !== 'undefined') {
        sc[p] = field[p];
      }
    });
    if (sc && sc.expires == null) {
      delete sc.expires;
    }

    if (field.array) sc = [sc];

    return sc;
  }

  getPopulates(populates, options = {}) {
    return co(function* () {
      for (let f in populates) {
        if (!this.schema[f]) continue;
        if (this.schema[f].model) this.schema[f].model = yield Promise.resolve(this.schema[f].model);
        if (!this.schema[f].model || !Object.keys(populates[f]).length) continue;

        let filter = {};
        if (options[f] && options[f].filter) {
          filter = options[f].filter;
          delete options[f].filter;
        }
        filter = {$and: [filter, {id: {$in: Object.keys(populates[f])}}]};

        let opt = (typeof options[f] == 'object' ? options[f] : {}) || {};
        let data = yield this.schema[f].model.findAll(filter, opt, this.application);
        if (!data.length && data.data) data = data.data;
        if (data && data.length) data.map((d) => d.id ? populates[f][d.id] = d.self || d : null);
      }

      return populates;
    }.bind(this));
  }

  static toId(id) {
    return id && id.toString && id.toString().match(/^[0-9a-f]{24}$/) ? mongoose.Types.ObjectId(id) : undefined;
  }

  toId(id) { return this.constructor.toId(id); }

  improveFilter(object) {
    if (object instanceof mongoose.Types.ObjectId) {
      return object;
    }

    if (Array.isArray(object)) {
      return object.concat([]).map((o) => this.improveFilter(o));
    }

    if (object instanceof RegExp) return object;

    if (object instanceof Date) return new Date(object);

    if (object === null) return null;

    if (typeof object == 'object') {
      object = Object.assign({}, object);
      for (let i in object) {
        if (i == 'id') {
          object._id = object.id;
          delete object.id;
          i = '_id';

          if (object[i] instanceof mongoose.Types.ObjectId) { continue; }

          if (typeof object[i] == 'string') {
            object[i] = this.toId(object[i]);
          }
        }

        object[i] = this.improveFilter(object[i]);
      }
    }

    if (['true', 'false'].indexOf(object) >= 0) {
      return object == 'true';
    }

    return object;
  }

  count(filter) {
    if (this.toId(filter)) { filter = {id: this.toId(filter)}; }
    filter = this.improveFilter(filter);
    // Use countDocuments for modern mongoose compatibility
    return this.Model.countDocuments(filter).exec();
  }

  /**
   * @param  {object} filter
   * @param  {object} params
   * @param  {string|array} params.join
   * @param  {number} params.limit
   * @param  {number} params.skip
   *
   * @return {object|array} docs
   */
  findAll(filter = {}, params = {}) {
    if (this.toId(filter)) { filter = {id: this.toId(filter)}; }
    let populates = {};
    let populateOptions = {};
    params = Object.assign({}, params);

    let {populate = []} = params;
    if (typeof populate == 'string') {
      populate = populate.split(',');
    }
    let p1 = Array.isArray(populate) ? populate : Object.keys(populate);
    let p2 = Array.isArray(this.populates) ? this.populates : Object.keys(this.populates);
    p1.concat(Object.keys(this.populates)).map((p) => populates[p] = {});
    populateOptions = Object.assign({}, this.populates, Array.isArray(populate) ? {} : populate);

    delete params.populate;

    if (filter.id) { this.idStack.push(filter.id.toString()); }
    filter = this.improveFilter(filter);

    if (params.select) {
      if (Array.isArray(params.select)) {
        params.select = params.select.join(' ');
      }
    }

    let query = this.Model.find(filter, null, params);

    return co(function* () {
      if (typeof filter != 'object') throw new AFError(404, 'Not found');

      let docs = yield queryResolver(query);
      yield this.wait;

      for (let i = 0; i < docs.length; i++) {
        docs[i] = docs[i].toObject();
        docs[i].id = docs[i]._id;
        delete docs[i]._id;

        Object.keys(populates).map((f) => {
          if (!docs[i][f]) return;
          if (this.schema[f].array) {
            docs[i][f].map((id) => id ? populates[f][id] = null : null);
            return;
          }
          populates[f][docs[i][f]] = null;
          return;
        });

        if (this.options && this.options.timestamps) {
          if (docs[i].createdAt) docs[i].createdAt = parseInt(docs[i].createdAt.getTime());
          if (docs[i].updatedAt) docs[i].updatedAt = parseInt(docs[i].updatedAt.getTime());
        }
      }

      if (Object.keys(populates).length) {
        populates = yield this.getPopulates(populates, populateOptions);

        docs.map((d) => Object.keys(populates).map((f) => {
          if (!d[f]) return;
          if (this.schema[f].array) {
            d[f].map((id, k) => d[f][k] = populates[f][id]);
            return;
          }
          d[f] = populates[f][d[f]];
        }));
      }

      this.idStack = [];
      return docs;
    }.bind(this));
  }

  updateMany(params, newData, options) {
    delete options.limit;
    delete params.populate;

    if (this.toId(params)) { params = {id: this.toId(params)}; }
    if (params.id) { this.idStack.push(params.id.toString()); }
    params = this.improveFilter(params);

    let query = this.Model.updateMany(params, newData, options);
    return co(function* () {
      let docs = yield queryResolver(query);
      yield this.wait;
      return docs;
    }.bind(this));
  }

  insertMany(newData) {
    return co(function* () {
      let docs = yield this.Model.insertMany(newData);

      docs = docs.map((doc) => {
        doc = doc.toObject();
        doc.id = doc._id;
        delete doc._id;
        return doc;
      });

      if (this.options && this.options.timestamps) {
        if (docs.createdAt) docs.createdAt = parseInt(docs.createdAt.getTime());
        if (docs.updatedAt) docs.updatedAt = parseInt(docs.updatedAt.getTime());
      }

      return docs;
    }.bind(this));
  }

  findOneAndUpdate(params, newData, options) {
    // options {select , etc} add populate later

    delete options.limit;
    delete params.populate;

    if (this.toId(params)) { params = {id: this.toId(params)}; }
    if (params.id) { this.idStack.push(params.id.toString()); }
    params = this.improveFilter(params);

    // Ensure upsert is passed to MongoDB query
    if (options.upsert) {
      options.upsert = true;
    }

    let query = this.Model.findOneAndUpdate(params, newData, options);
    return co(function* () {
      let docs = yield queryResolver(query);
      yield this.wait;

      // If no document found and upsert is enabled, create it
      if (!docs) {
        if (options.upsert) {
          // Create new document with merged params and newData
          const insertData = Object.assign({}, params, newData);
          docs = yield this.insert(insertData);
          if (!docs) return null;
          // insert() returns plain object, no need to call toObject()
          if (docs._id && !docs.id) {
            docs.id = docs._id;
            delete docs._id;
          }
        } else {
          return null;
        }
      } else {
        // findOneAndUpdate returns Mongoose document, need toObject()
        if (docs.toObject) {
          docs = docs.toObject();
        }
        if (docs._id && !docs.id) {
          docs.id = docs._id;
          delete docs._id;
        }
      }

      /*  Object.keys(populates).map(f => {
          if (!docs[f]) return;
          if (this.schema[f].array) {
            docs[f].map(id => id ? populates[f][id] = null : null);
            return;
          }
          populates[f][docs[f]] = null;
          return;
        });
*/
      if (this.options && this.options.timestamps) {
        if (docs.createdAt) docs.createdAt = parseInt(docs.createdAt.getTime());
        if (docs.updatedAt) docs.updatedAt = parseInt(docs.updatedAt.getTime());
      }

      this.idStack = [];
      return docs;
    }.bind(this));
  }

  find(filter, params = {}) {
    return co(function* () {
      Object.assign(params, {limit: 1, skip: 0});
      let docs = yield this.findAll(filter, params);
      return docs[0];
    }.bind(this));
  }

  save(data, notNew) {
    delete data.updatedAt;

    data = this.improveFilter(data);
    return co(function* () {
      let model = new this.Model(data);
      model.isNew = !notNew;

      let err = model.validateSync();
      if (err) {
        console.error(data);
        let message = err.message;
        if (err.errors) {
          message = Object.keys(err.errors).map((k) => err.errors[k].message);
          message = message.join(' \n');
        }
        throw new AFError(400, message, err);
      }

      yield this.wait;
      try {
        yield model.save();
      } catch (err) {
        if (err.code == 11000) {
          throw new AFError(400, 'Already exists');
        }
        throw new AFError(500, err.message);
      }

      return yield this.find(model._id);
    }.bind(this));
  }

  insert(data) {
    return this.save(data);
  }
  update(data) {
    return this.save(data, true);
  }

  remove(params) {
    if (this.toId(params)) { params = {id: this.toId(params)}; }
    params = this.improveFilter(params);

    // Model.remove is deprecated; use deleteMany for bulk deletes
    return this.Model.deleteMany(params);
  }

  flushModel(name) {
    if (name) {
      for (var i in mongoose.models) {
        if (i.indexOf(name) >= 0) {
          delete mongoose.models[i];
        }
      }
    } else {
      if (mongoose.models[this.tableName]) {
        delete mongoose.models[this.tableName];
      }
    }
  }
}

module.exports = MongoDB;
