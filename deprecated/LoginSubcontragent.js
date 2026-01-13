// Метод для внешних разработчиков
'use strict';

const Router = require('../models/Router');
const utils = require('../models/utils');

const router = new Router();

router.use('/login_subcontragent',
  {
    appId: true,
  },
  function* () {
    const data = this.request.fields || this.request.querystring;

    const loginResult = yield utils.loginSubcontragent(this, this.application,
                                                       {
                                                         username: data.username,
                                                         password: data.password,
                                                       });

    this.body = loginResult;
  });
