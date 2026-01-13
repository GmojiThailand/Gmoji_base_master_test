/**
 * Функция регистрации мобильного пользователя oauth2
 * 1 Запрос на получение кода верификации регистрации
 * @param {string} username - логин пользователя
 *
 * 2 Запрос на сохранение данных юзера при удачной верификации
 * @param {sring} username - логин пользователя
 * @param {number} password - пароль пользователя
 * @param {number} code - код верификации
 * @param {sring} city - город
 * @param {sring} sex - пол
 * @param {date} birthdate - дата рождения
 * @param {sring} name - имя
 * @param {sring} email - email
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const User = require('../models/User');

const router = new Router();

router.use('/registration_mobile',
  {appId: true},
  function* () {
    function inUse() {
      return this.body = {
        message: 'Phone already in use',
        statusCode: 400,
      };
    };

    const data = this.request.fields || this.request.querystring;

    delete data.phone;

    let mobileUserRole = '58b40f669154c320f9831bfa';

    if (data.username && !data.code) {
      let userSys = yield User.find({username: data.username, role: mobileUserRole, type: 'oauth'},
                                    {}, this.application.id);

      if (userSys) { return inUse(); }

      let usersTable = yield Table.fetch('users', this.application.id);
      let user = yield usersTable.find({phone: data.username})
        .catch((e) => (console.error(e), {data: null}));

      if (user.data) { return inUse(); }

      let code = Math.round(Math.random() * (9999 - 1298) + 1298);
      let verificationCodesTable = yield Table.fetch('verification_codes', this.application.id);

      let verificationCode = yield verificationCodesTable.find({username: data.username})
        .catch((e) => (console.error(e), {data: null}));

      if (!verificationCode.data) {
        verificationCode = yield verificationCodesTable.create({username: data.username, code: code});
      } else {
        verificationCode = yield verificationCode.data.update({code: code});
      }

      let notify = yield Service.fetch('notify', this.application.id);
      notify.data = {to: [{number: data.username}], code: code};
      yield notify.request('sms_verify', this);

      return this.body = {
        message: 'SMS has been sent!',
        statusCode: 200,
      };
    }

    if (!data.username || !data.password || !data.code) {
      return this.body = {
        message: 'Required fields are empty',
        statusCode: 400,
      };
    }

    if (data.username && data.password && data.code) {
      let verificationCodesTable = yield Table.fetch('verification_codes', this.application.id);
      let verificationCode = yield verificationCodesTable.find({username: data.username, code: data.code})
        .catch((e) => (console.error(e), {data: null}));

      if (!verificationCode.data) {
        return this.body = {
          message: 'Code not found',
          statusCode: 404,
        };
      }

      yield verificationCodesTable.remove({id: verificationCode.data.id});
      delete data.code;

      let userSys = yield User.find({username: data.username, role: mobileUserRole, type: 'oauth'},
                                    {}, this.application.id);
      if (userSys) { return inUse(); }

      let usersTable = yield Table.fetch('users', this.application.id);
      let user = yield usersTable.find({phone: data.username})
        .catch((e) => (console.error(e), {data: null}));

      if (user.data) {
        return this.body = {
          message: 'Phone already in use',
          statusCode: 400,
        };
      }

      data.phone = data.username;

      let row = {
        is_social: false,
      };

      if (data.email) {
        function emailInUse() {
          return this.body = {
            message: 'Email already in use',
            statusCode: 400,
          };
        };

        let userSysEmail = yield User.find({username: data.email, role: mobileUserRole, type: 'oauth'},
                                           {}, this.application.id)
          .catch((e) => (console.error(e), {data: null}));

        if (userSysEmail) { return emailInUse(); }

        let userByEmail = yield usersTable.find({email: data.email})
          .catch((e) => (console.error(e), {data: null}));

        if (userByEmail.data) { return emailInUse(); }

        row.email = data.email;
      }

      if (data.phone) { row.phone = data.phone; }
      if (data.birthdate) { row.birthdate = data.birthdate; }
      if (data.sex) { row.sex = data.sex; }
      if (data.city) { row.city = data.city; }
      if (data.name) { row.name = data.name; }

      let newUserSys = new User({username: data.username, role: mobileUserRole, type: 'oauth'}, this.application.id);
      newUserSys.password = data.password;

      yield newUserSys.save();
      row.user_id = newUserSys.id;

      yield usersTable.create(row);

      this.body = {
        message: 'User created successfully',
        statusCode: 200,
        data: row,
      };
    }
  });
