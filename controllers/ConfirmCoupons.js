'use strict';

const Router = require('../models/Router');
const utils = require('../models/utils');

const router = new Router();

router.all('/confirm_coupons',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    const result = yield utils.confirmCoupons(this.application, {guid: fields.guid, productId: fields.product_id});

    this.body = result;
  });

module.exports = router;
