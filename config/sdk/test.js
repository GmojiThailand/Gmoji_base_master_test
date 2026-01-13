module.exports = {
  name: 'base',
  adapter: 'mongodb',
  eWalletHostname: 'https://gmoji-test.simbirsoft1.com/payture/check?buyerId=',
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
    ewalletReqHost: 'http://gmoji-test.simbirsoft1.com',
  },
};
