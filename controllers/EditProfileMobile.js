/**
 * Редактирование профиля мобильного пользователя
 *
 * 1 Запрос на смену логина для получения кода верификации
 * @param {string} newUsername - новый логин пользователя
 *
 * 2 Запрос на обновление профиля с кодом верификации
 * @param {string} newUsername - новый логин пользователя
 * @param {string} code - код верификации
 * @param {string} email - новый email пользователя
 * @param {string} birthdate - новая дата рождения пользователя
 * @param {string} sex - новый пол пользователя
 * @param {string} city - новый город пользователя
 * @param {string} name - новое имя пользователя
 *
 * 3 Запрос на обновление профиля без кода верификации
 * @param {string} email - новый email пользователя
 * @param {string} birthdate - новая дата рождения пользователя
 * @param {string} sex - новый пол пользователя
 * @param {string} city - новый город пользователя
 * @param {string} name - новое имя пользователя
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const User = require('../models/User');
const Service = require('../models/Service');
const RolesDictionary = require('../models/dictionaries/Role');

const router = new Router();


router.all('/edit_profile_mobile',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let fields = this.request.fields || this.request.query;

    delete fields.phone;
    delete fields.username;

    if (fields.newUsername && !fields.code) {
      let userSys = yield User.find(
        {
          id: this.user.id,
          role: RolesDictionary.USER,
          type: this.user.type,
        },
        {},
        this.application.id
      );

      if (!userSys) { throw new HttpError(404, 'User not found'); }

      let newUserSys = yield User.find(
        {
          username: fields.newUsername,
          role: RolesDictionary.USER,
          type: 'oauth',
        },
        {},
        this.application.id
      );

      if (newUserSys) { throw new HttpError(400, 'Phone already in use'); }

      let usersTable = yield Table.fetch('users', this.application.id);
      let user = yield usersTable.find({phone: fields.newUsername})
        .catch((e) => ({data: null}));

      if (user.data) { throw new HttpError(400, 'Phone already in use'); }

      let code = Math.round(Math.random() * (9999 - 1298) + 1298);
      let verificationCodesTable = yield Table.fetch('verification_codes', this.application.id);

      let verificationCode = yield verificationCodesTable.find({username: fields.newUsername})
        .catch((e) => ({data: null}));

      if (!verificationCode.data) {
        yield verificationCodesTable.create({username: fields.newUsername, code: code});
      } else {
        yield verificationCode.data.update({code: code});
      }

      let notify = yield Service.fetch('notify', this.application.id);
      notify.data = {to: [{number: fields.newUsername}], code: code};
      yield notify.request('sms_verify', this);

      return this.body = 'SMS has been sent!';
    }

    if (fields.newUsername && fields.code) {
      let verificationCodesTable = yield Table.fetch('verification_codes', this.application.id);
      let verificationCode = yield verificationCodesTable.find({username: fields.newUsername, code: fields.code})
        .catch((e) => ({data: null}));

      if (!verificationCode.data) {
        return this.body = {
          message: 'Code not found',
          statusCode: 404,
        };
      }

      yield verificationCodesTable.remove({id: verificationCode.data.id});

      let newUserSys = yield User.find({username: fields.newUsername, role: RolesDictionary.USER, type: 'oauth'},
        {}, this.application.id);
      if (newUserSys) { throw new HttpError(400, 'Phone already in use'); }

      let usersTable = yield Table.fetch('users', this.application.id);
      let user = yield usersTable.find({phone: fields.newUsername})
        .catch((e) => ({data: null}));

      if (user.data) { throw new HttpError(400, 'Phone already in use'); }

      let userSys = yield User.find({id: this.user.id, role: RolesDictionary.USER, type: this.user.type},
        {}, this.application.id);

      if (!userSys) { throw new HttpError(404, 'User not found'); }

      if (userSys.type && userSys.type == 'oauth') { yield userSys.update({username: fields.newUsername}); }

      fields.phone = fields.newUsername;
      delete fields.newUsername;
      delete fields.code;
    }

    if (!fields.newUsername && !fields.code) {
      let userSys = yield User.find(
        {
          id: this.user.id,
          role: RolesDictionary.USER,
          type: this.user.type,
        },
        {},
        this.application.id
      );

      if (!userSys) { throw new HttpError(404, 'User not found'); }

      let usersTable = yield Table.fetch('users', this.application.id);
      let user = yield usersTable.find({user_id: userSys.id})
        .catch((e) => ({data: null}));
      user = user.data;

      if (user && user.email && fields.email && user.email == fields.email) {
        delete fields.email;
      }

      let contains = ['birthdate', 'sex', 'email', 'city', 'name', 'phone'].some((field) => {
        return fields[field];
      });

      let row = {};
      if (contains) {
        if (fields.email) {
          let userSysEmail = yield User.find(
            {
              username: fields.email,
              role: RolesDictionary.USER,
              type: 'oauth',
            },
            {},
            this.application.id
          );

          if (userSysEmail) { throw new HttpError(400, 'Email already in use'); }

          let userByEmail = yield usersTable.find({email: fields.email})
            .catch((e) => ({data: null}));

          if (userByEmail.data) { throw new HttpError(400, 'Email already in use'); }

          row.email = fields.email;
        }

        if (fields.phone) {
          let userSysPhone = yield User.find(
            {
              username: fields.phone,
              role: RolesDictionary.USER,
              type: 'oauth',
            },
            {},
            this.application.id
          );

          if (userSysPhone) { throw new HttpError(400, 'Phone already in use'); }

          let userByPhone = yield usersTable.find({phone: fields.phone})
            .catch((e) => ({data: null}));

          if (userByPhone.data) { throw new HttpError(400, 'Phone already in use'); }

          row.phone = fields.phone;
        } else {
          if (userSys.username.match(/^7\d{10}$/g)) { row.phone = userSys.username; }
        }

        if (fields.birthdate) { row.birthdate = fields.birthdate; }
        if (fields.sex) { row.sex = fields.sex; }
        if (fields.city) { row.city = fields.city; }
        if (fields.name) { row.name = fields.name; }
      }

      const countersTable = yield Table.fetch('counters', this.application.id);
      if (user) {
        if (!user.fake_id) {
          let counterValue = yield countersTable.findOneAndUpdate({name: 'users'}, {$inc: {value: 1}}, {new: true});
          Object.assign(row, {fake_id: counterValue.data.value});
        }

        yield user.update(row);
      } else {
        if (!contains) { throw new HttpError(404, 'Profile not found'); }

        let counterValue = yield countersTable.findOneAndUpdate({name: 'users'}, {$inc: {value: 1}}, {new: true});
        Object.assign(row, {user_id: userSys.id, fake_id: counterValue.data.value});

        user = yield usersTable.create(row);
      }

      Object.assign(user, {statusCode: 200});

      this.body = user;
    }
  });

module.exports = router;
