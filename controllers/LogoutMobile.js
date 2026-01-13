/**
 * Выход из сессии административной панели.
 */
'use strict';

const Router = require('../models/Router');
const Auth = require('../models/Auth');

const router = new Router();

router.post('/logout_mobile',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let options = {
      oauth: {
        accessTokenLifetime: 60 * 60 * 24,
        refreshTokenLifetime: 60 * 60 * 24 * 7,
      },
    };

    let accessToken = this.oauth.bearerToken.accessToken;
    this.request.fields = accessToken;

    yield Auth.logout.oauth2(this, options).catch((err) => null);

    this.body = {data: 'OK'};
  });

module.exports = router;
