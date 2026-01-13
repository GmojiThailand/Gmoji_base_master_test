module.exports = {
  name: 'base',
  adapter: 'mongodb',
  eWalletHostname: 'https://api.gmoji.world/payture/check?buyerId=',
  tokenOptions: {
    authCodeLifetime: 120,
    accessTokenLifetime: 86400,
    refreshTokenLifetime: 155520000,
  },
  db: {
    mongodb: {
      host: 'localhost',
      port: process.env.MONGO_PORT || '27017',
      name: 'api-factory',
      // username: 'api-factory',
      // password: 'MinerVA20022016',
      // authSource: 'admin',
    },
  },
  payture: {
    ewalletReqHost: 'https://api.gmoji.world',
  },
  iosPhone: '79999999999'
};
