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
      name: 'api-factory'
    },
  },
  payture: {
    ewalletReqHost: '==API_DOMAIN',
  },
  iosPhone: '70000000009'
};
