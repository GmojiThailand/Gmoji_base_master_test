/*
 * Скрипт который будет валидировать имена у сущностей Товары, Категории, Контрагенты, Торговые точки.
 * @param - productName
 * @param - categoryName
 * @param - contragentName
 * @param - storeName
 *
 * закрыт для внешнего использования
 */
'use strict';

const Router = require('../models/Router');

const utils = require('../models/utils');

const router = new Router();

router.use('/entity_validator',
  {appId: true},
  function* () {
    const data = this.request.fields || this.request.querystring;

    const isUnique = yield utils.validateEntity(this.application,
                                                {
                                                  productName: data.productName,
                                                  categoryName: data.categoryName,
                                                  contragentName: data.contragentName,
                                                  storeName: data.storeName,
                                                });

    this.body = JSON.stingify(isUnique);
  });
