/*
 * Copyright (c) E-System LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 *
 * Written by E-System team (https://ext-system.com), 2020
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
      name: 'api-factory'
    },
  },
  payture: {
    ewalletReqHost: 'https://==API_DOMAIN',
  },
  iosPhone: '50600000009'
};
