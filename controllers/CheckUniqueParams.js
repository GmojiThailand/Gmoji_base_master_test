/**
 * Проверка на уникальность логина или имени нового пользователя в системе
 *
 * @param {string} username - логин нового юзера в системе
 * @param {string} name - имя нового юзера в системе
 */
'use strict';

const Router = require('../models/Router');

const utils = require('../models/utils');

const router = new Router();

router.all('/check_unique_params',
  {
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    const checkUniqueResult = yield utils.checkUniqueParams(
      this.application,
      {
        username: fields.username,
        name: fields.name,
        role: fields.role,
      }
    );

    this.body = checkUniqueResult;
  });

module.exports = router;
