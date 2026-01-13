module.exports = {
  name: 'base',
  adapter: 'mongodb',
  eWalletHostname: 'https://==API_DOMAIN/payture/check?buyerId=',
  tokenOptions: {
    authCodeLifetime: 120,
    accessTokenLifetime: 86400,
    refreshTokenLifetime: 155520000,
  },
  db: {
    mongodb: {
      host: '==MONGODBPRIVATEIP',
      port: process.env.MONGO_PORT || '27017',
      name: 'api-factory',
      // username: 'api-factory',
      // password: 'MinerVA20022016',
      // authSource: 'admin',
    },
  },
  payture: {
    ewalletReqHost: 'https://==API_DOMAIN',
  },
  iosPhone: '200000000009',
  notifyAfterRegistration: true
};
