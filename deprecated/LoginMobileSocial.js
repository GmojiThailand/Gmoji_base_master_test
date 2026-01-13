'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');

const router = new Router();

router.post('/login_mobile_social',
  {appId: true},
  function* () {
    let mobileRole = '58b40f669154c320f9831bfa';

    if (!data.token) { throw new HttpError(400, 'Error'); }

    req.body = {token: data.token};
    let options = {
      vk: {
        client_id: '6189863',
        client_secret: 'JfGBaCXC4dTVNxAdZ2Mb',
      },
      oauth: {
        accessTokenLifetime: 60 * 60 * 24,
        refreshTokenLifetime: 60 * 60 * 24 * 7,
      },
      facebook: true,
      ok: {
        application_key: 'CBAIIKNLEBABABABA',
        application_secret_key: '9700C428A56864D80EC6DE78',
      },
    };

    let errors = [];
    let token;
    token = yield Auth.login.vk(req, options, mobileRole)
      .catch((err) => (errors.push(err), null));

    if (!token) {
      token = yield Auth.login.ok(req, options, mobileRole)
        .catch((err) => (errors.push(err), null));
    }

    if (!token) {
      token = yield Auth.login.facebook(req, options, mobileRole)
        .catch((err) => (errors.push(err), null));
    }

    if (!token) { throw new HttpError(401, 'Cant authorized'); }

    let Users = yield Table.fetch('users', req.application.id);

    let user = yield Users.findAll({user_id: token.user_id});

    let result;
    if (!user.data.length) {
      if (data.userInfo) {
        result = yield Users.create({
          user_id: token.user_id,
          phone: data.userInfo.phone,
          city: data.userInfo.city,
          sex: data.userInfo.sex,
          email: data.userInfo.email,
          name: data.userInfo.name,
          birthdate: data.userInfo.birthdate || new Date().getTime(),
          is_social: true,
        });
      } else {
        result = yield Users.create({user_id: token.user_id});
      }
    } else {
      result = user.data[0];
    }

    Object.assign(result, {is_social: true});

    return done({data: result, token: token});
  });
