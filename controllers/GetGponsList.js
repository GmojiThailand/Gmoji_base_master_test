/**
 * Выгрузка списка джипонов
 *
 * @param {date} end_sale_date - фильтр по дате до которой действуют джипоны
 * @param {number} limit
 * @param {number} page
 * @param {number} sort
 */
'use strict';

const Router = require('../models/Router');

const utils = require('../models/utils');

const router = new Router();

router.all('/get_gpons_list',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    const list = yield utils.getGponsList(this.application, this.user, {fields});

    this.body = {data: list, count: list.length};
  });

module.exports = router;
