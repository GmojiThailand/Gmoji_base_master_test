const SDKAdapter = require('sdk').DBAdapter;
const DBAdapter = SDKAdapter.get();
const SystemToken = require('./SystemToken');

class AccessToken extends SystemToken {
  constructor() {
    super();
    this.type = 'AccessTokens';
  }

  static get schema() {
    return {
      accessToken: { type: 'string' },
      application: { type: 'id', referer: 'Application', model: require('../Application') },
      clientId: { type: 'string' },
      userId: { type: 'id', referer: 'User', model: require('../User') },
      expires: { type: 'date', expires: 3600 }
    };
  }
}

module.exports = AccessToken;