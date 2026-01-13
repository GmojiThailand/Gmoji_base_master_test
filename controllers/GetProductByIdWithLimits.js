/**
 * Выгрузка списка продуктов, дополненная лимитами
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.all('/get_product_by_id_with_limits',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.productId) { throw new HttpError(400, 'Product id required'); }

    const productTable = yield Table.fetch('products', this.application.id);
    let product = yield productTable.find({id: fields.productId, status: StatusesDictionary.ACTIVE})
      .catch((e) => ({data: null}));

    if (!product.data) { throw new HttpError(404, 'Product not found'); }

    const limitsTable = yield Table.fetch('limits', this.application.id);
    let limit = yield limitsTable.find({product_id: fields.productId})
      .catch((e) => ({data: null}));

    if (!limit.data) { throw new HttpError(404, 'Limit not found'); }

    Object.assign(product.data, {product_limit: limit.data.limit});

    this.body = product.data;
  });

module.exports = router;
