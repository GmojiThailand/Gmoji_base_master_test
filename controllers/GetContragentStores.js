/**
 * Получение списка торговых точек контрагентов в товаре
 *
 * @param {string} product_id - id продукта
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.all('/get_contragent_stores',
  {
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.product_id) { throw new HttpError(400, 'Store id required'); }

    const productsTable = yield Table.fetch('products', this.application.id);
    let product = yield productsTable.find({id: fields.product_id, status: StatusesDictionary.ACTIVE})
      .catch((e) => ({data: null}));
    product = product.data;

    if (!product) { throw new HttpError(404, 'Product not found'); }

    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
    let cards = yield cardsTable.findAll({product_id: fields.product_id, status: StatusesDictionary.ACTIVE});
    cards = cards.data;

    if (!cards.length) { return this.body = []; }

    let storeIds = [];
    cards.map((card) => {
      if (card.stores) { storeIds = storeIds.concat(card.stores); }
    });

    const storesTable = yield Table.fetch('stores', this.application.id);

    let stores = yield storesTable.findAll({id: {$in: storeIds}, status: StatusesDictionary.ACTIVE});
    stores = stores.data;

    this.body = stores;
  });

module.exports = router;
