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
  defaultLocale: 'az_AZ',
};
