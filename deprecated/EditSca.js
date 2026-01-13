// user.find (аргументы посмотреть тут и как обычно)
/**
 * Редактирование контрагента и представителя
 * @param - data.username
 * @param - data.password
 * @param - contragent_id - id системного пользователя
*/
'use strict';

const Router = require('../models/Router');
const utils = require('../models/utils');

const router = new Router();

router.use('/edit_sca',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const data = this.request.fields || this.request.querystring;

    const result = yield utils.editSca(this.application,
                                       {
                                         contragentId: data.contragentId,
                                         username: data.username,
                                         password: data.password,
                                       });

    this.body = result;
  });
