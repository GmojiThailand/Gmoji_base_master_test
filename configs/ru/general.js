module.exports = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  application: {
    auth: {
      clientId: '587640c995ed3c0c59b14600',
      response_type: 'code',
      grants: ['authorization_code', 'refresh_token'],
      redirectUri: 'http://localhost/api/v1/login',
    },
    refresh: {
      clientId: '587640c995ed3c0c59b14600',
      grants: ['refresh_token'],
    },
  },
  defaultLocale: 'ru_RU',
  noOnlineFor: ['5c66c0378a2ea235a065745f', '5c66c0378a2ea235a065745d', '5c66c0388a2ea235a0657743', '5c66c0388a2ea235a065781c', '5c66c0378a2ea235a0657438', '5c66c0378a2ea235a065745c', '5c66c0378a2ea235a065745e', '5c66c0378a2ea235a0657460', '5f969245c2443c30f8b6d696', '5f969245c2443c30f8b6d697']
};
