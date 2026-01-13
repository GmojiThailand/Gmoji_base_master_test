'use strict';

const Router = require('../models/Router');

const utils = require('../models/utils');

const router = new Router();

router.all('/soft_delete_products',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;
    const deletedProducts = yield utils.softDeleteProduct(
      this.application,
      this.user,
      {productIds: fields.productIds || [fields.productId]},
      utils
    );

    this.body = deletedProducts;
  });

module.exports = router;
