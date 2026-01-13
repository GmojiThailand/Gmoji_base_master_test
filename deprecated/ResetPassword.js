/**
 * Функция восстановления пароля мобильного пользователя
 * 1---
 * @param username - логин пользователя
 * 2---
 * @param username - логин пользователя
 * @param code - код верификации
 * @param newPassword - новый пароль
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const Service = require('../models/Service');

const router = new Router();

router.use('/reset_password',
  {appId: true},
  function* () {
    const data = this.request.fields || this.request.querystring;

    let mobileUserRole = '58b40f669154c320f9831bfa';

    if (!data.username) { throw new HttpError(400, 'Username is empty'); }

    let userSys = yield User.find({username: data.username, role: mobileUserRole, type: 'oauth'},
                                  {}, this.application.id);

    if (!userSys) { throw new HttpError(404, 'User not found'); }

    if (data.username && !data.code) {
      let code = Math.round(Math.random() * (9999 - 1298) + 1298);

      let verificationCodesTable = yield Table.fetch('verification_codes', this.application.id);
      let verificationCode = yield verificationCodesTable.find({username: userSys.username})
        .catch((e) => (console.error(e), {data: null}));

      if (!verificationCode.data) {
        verificationCode = yield verificationCodesTable.create({username: userSys.username, code: code});
      } else {
        verificationCode = yield verificationCode.data.update({code: code});
      }

      let notify = yield Service.fetch('notify', this.application.id);
      notify.data = {to: [{number: userSys.username}], code: code};
      yield notify.request('sms_reset_psw', this);

      return this.body = {data: 'SMS has been send!'};
    }

    if (data.username && data.code && data.newPassword) {
      let verificationCodesTable = yield Table.fetch('verification_codes', this.application.id);
      let verificationCode = yield verificationCodesTable.find({username: userSys.username, code: data.code})
        .catch((e) => (console.error(e), {data: null}));

      if (!verificationCode.data) { throw new HttpError(404, 'Code not found'); }

      yield verificationCodesTable.remove({id: verificationCode.data.id});

      userSys.password = data.newPassword;

      yield userSys.save();

      return this.body = {data: 'OK'};
    }

    throw new HttpError(400, 'Bad request');
  });
