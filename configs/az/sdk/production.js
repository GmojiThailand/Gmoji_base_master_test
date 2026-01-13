/*
 * Copyright (c) E-System LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Written by E-System team (https://ext-system.com), 2019
 */

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
    ewalletReqHost: 'http://==API_DOMAIN',
  },
  iosPhone: '994000000009'
};
