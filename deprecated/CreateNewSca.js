/**
 * Скрипт создания представителя контрагента
 *
 * @param {string} username - логин пользователя в системе
 * @param {string} contragent_id - id контрагента (системного пользователя) которого он представляет в системе
 *
 * Таблица subcontragents
 * contragent_id - системный id контрагента
 * user_id - системный id представителя
 */

'use strict';

const Router = require('../models/Router');

const utils = require('../models/utils');

const router = new Router();

router.use('/create_new_sca',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const data = this.request.fields || this.request.query;

    const result = yield utils.createNewSca(this.application,
                                            {
                                              contragentId: data.contragent_id,
                                              username: data.username,
                                            });

    this.body = result;
  });
