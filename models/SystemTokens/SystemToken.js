const SDKAdapter = require('sdk').DBAdapter;
const DBAdapter = SDKAdapter.get();
const co = require('co');

class SystemToken {
  constructor() {
    this.type = 'SystemTokens';
  }

  static get schema() { throw new Error('Unsupported method'); }

  get schema() { return this.constructor.schema; }

  findAll(filter, params) {
    return co(function *() {
      let systemTokensTable = DBAdapter.init(this.type, this.schema);

      filter = filter ? filter : {};
      params = params ? params : {};

      let systemTokens = yield systemTokensTable.findAll(filter, params);
      return systemTokens;
    }.bind(this));
  }

  remove(params) {
    return co(function *() {
      let systemTokensTable = DBAdapter.init(this.type, this.schema);

      params = params ? params : {};

      yield systemTokensTable.remove(params);
    }.bind(this));
  }
}

module.exports = SystemToken;