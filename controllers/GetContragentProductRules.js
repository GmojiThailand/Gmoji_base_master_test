'use strict';

const Router = require('../models/Router');

const utils = require('../models/utils');

const router = new Router();

router.all('/get_contragent_product_rules',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const result = yield utils.getContragentProductRules(this.application);
    this.body = result;
  });

module.exports = router;
