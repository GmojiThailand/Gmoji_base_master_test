/**
 * Получение списка торговых точек контрагентов в товаре
 *
 * @param {string} product_id - id продукта
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.all('/get_contragent_stores',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.product_id) { throw new HttpError(400, 'Store id required'); }

    let productsTable = yield Table.fetch('products', this.application.id);
    let product = yield productsTable.findAll({id: fields.product_id});

    if (!product.data || !product.data.length) { throw new HttpError(404, 'Product not found'); }

    product = product.data[0];

    if (!product.contragent && !product.contragent.length) { throw new HttpError(404, 'Contragent not found'); }

    let contragentIds = product.user_id;
    let storesTable = yield Table.fetch('stores', this.application.id);

    let stores;
    if (this.user.role.id == RolesDictionary.CONTRAGENT) {
      stores = yield storesTable.findAll({user_id: this.user.id, status: StatusesDictionary.ACTIVE});
    } else {
      stores = yield storesTable.findAll({user_id: {$in: contragentIds}, status: StatusesDictionary.ACTIVE});
    }

    if (!stores.data || !stores.data.length) { throw new HttpError(404, 'Store not found'); }

    stores = stores.data;

    this.body = stores;
  });

module.exports = router;
