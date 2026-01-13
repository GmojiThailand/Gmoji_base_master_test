/**
 * Изменение пароля для контрагентов.
 *
 * @param {string} username - логин пользователя системы
 * @param {string} role - роль пользователя в системе
 *
 * Изменять пароль может только администратор
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const User = require('../models/User');
const Service = require('../models/Service');
const RolesDictionary = require('../models/dictionaries/Role');

const router = new Router();

router.all('/password_gen',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    let admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND];

    if (!fields.username) { throw new HttpError(400, 'Username required'); }
    if (!~admins.indexOf(this.user.role.id.toString())) { throw new HttpError(403, 'Administrator access only'); }

    let userSys = yield User.find(
      {
        username: fields.username,
        role: RolesDictionary.CONTRAGENT,
      },
      {},
      this.application.id
    );

    let password = Math.round(Math.random() * (999999 - 129899) + 129899).toString();

    let notify = yield Service.fetch('notify', this.application.id);
    notify.data = {password, email: [{email: fields.username}]};
    yield notify.request('password_gen', this);

    userSys.password = password;

    yield userSys.save();

    this.body = {message: 'Password sent'};
  });

module.exports = router;
