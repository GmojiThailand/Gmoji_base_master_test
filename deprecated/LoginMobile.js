'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const User = require('../models/User');

const router = new Router();

router.use('/login_mobile',
  {appId: true},
  function* () {
    const data = this.request.fields || this.request.querystring;

    let mobileUserRole = '58b40f669154c320f9831bfa';

    if (!data.username || !data.password) { throw new HttpError(400, 'Empty username or password'); }

    let userSys = yield User.find({username: data.username, role: mobileUserRole}, {}, this.application.id);

    if (!userSys) { throw new HttpError(404, 'User not found'); }

    let usersTable = yield Table.fetch('users', this.application.id);

    let user = yield usersTable.find({user_id: userSys.id})
      .catch((e) => (console.error(e), {data: null}));

    if (!user.data) { throw new HttpError(404, 'User not found'); }

    let result = user.data;

    this.body = {username: data.username, password: data.password};
    let options = {
      oauth: {
        accessTokenLifetime: 60 * 60 * 24,
        refreshTokenLifetime: 60 * 60 * 24 * 7,
      },
    };

    let token = yield Auth.login.oauth(req, options).catch((err) => (console.error(err), null));

    if (!token) { throw new HttpError(404, 'Wrong password'); }

    this.body = {data: result, token: token};
  });
