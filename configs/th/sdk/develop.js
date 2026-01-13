module.exports = {
  name: 'base',
  adapter: 'mongodb',
  eWalletHostname: 'https://==API_DOMAIN/payture/check?buyerId=',
  tokenOptions: {
    authCodeLifetime: 120, // 2 минуты
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
    ewalletReqHost: 'http://==API_DOMAIN',
  },
  iosPhone: '66000000009'
}