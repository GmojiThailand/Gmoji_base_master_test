/**
 * Проверка существования телефона или электронной почты для текущего юзера в системе
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');

const router = new Router();

router.all('/check_mail_and_phone',
  {
    auth: true,
    appId: true,
  },
  function* () {
    const usersTable = yield Table.fetch('users', this.application.id);
    let user = yield usersTable.find({user_id: this.user.id})
      .catch((e) => ({data: null}));

    if (!user || !user.data) {
      return this.body = {
        statusCode: 404,
        message: 'Profile not found',
      };
    }

    if (!user.data.email || !user.data.phone) {
      return this.body = {
        statusCode: 404,
        message: 'Email or phone not found',
      };
    }

    this.body = {
      statusCode: 200,
      message: 'Email and phone present',
    };
  });

module.exports = router;
