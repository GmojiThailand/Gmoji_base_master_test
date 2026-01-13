/**
 * Получение информации о товаре
 *
 * @param {string} id - id продукта
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');

const utils = require('../models/utils');

const router = new Router();

router.all('/get_product',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = Object.assign(this.request.fields || {}, this.request.query || {});

    if (!fields.id) { throw new HttpError(400, 'Product id required'); }

    const products = yield utils.getProducts(
      this.application,
      {
        params: {id: fields.id, locale: fields.locale},
        options: {populate: ['categories']},
        applyLimits: true,
      });
    let product = products && products.length ? products[0] : {};

    this.body = product;
  });

module.exports = router;
