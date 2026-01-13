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
      host: process.env.MONGOHOST || 'localhost',
      port: process.env.MONGOPORT || process.env.MONGO_PORT || '27017',
      name: process.env.MONGO_DB_NAME || 'api-factory',
      // username: 'api-factory',
      // password: 'MinerVA20022016',
      // authSource: 'admin',
    },
  },
  payture: {
    ewalletReqHost: 'https://api.gmoji.world',
  },
  iosPhone: '79992334455'  
};
