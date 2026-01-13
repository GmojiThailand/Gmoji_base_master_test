'use strict';

const Router = require('../models/Router');

const utils = require('../models/utils');

const router = new Router();

router.all('/check_is_adult',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const isAdult = yield utils.checkIsAdult(this.application, this.user);
    this.body = {isAdult};
  });

module.exports = router;
