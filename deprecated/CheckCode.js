/**
 * Скрипт для проверки кода верификации
 * @param username - логин пользователя
 * @param code - код из смс
 * @return OK
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');

const router = new Router();

router.use('/check_code',
  {appId: true},
  function* () {
    const data = this.request.fields || this.request.querystring;

    if (!data.username) { throw new HttpError(400, 'Username is empty'); }
    if (!data.code) { throw new HttpError(400, 'Code field is empty'); }

    let verificationCodesTable = yield Table.fetch('verification_codes', this.application.id);
    let verificationCode = yield verificationCodesTable.find({username: data.username, code: data.code})
      .catch((e) => (console.error(e), {data: null}));

    if (!verificationCode.data) { throw new HttpError(404, 'Code not found'); }

    this.body = {data: 'OK'};
  });
