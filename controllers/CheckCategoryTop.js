/**
 * Проверка заполнения списка топ товаров(до 20 шт)
 */
'use strict';

const Router = require('../models/Router');

const utils = require('../models/utils');

const router = new Router();

router.all('/check_category_top',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let result = yield utils.checkCategoryTop(this.application);

    this.body = JSON.stringify(result);
  });

module.exports = router;
