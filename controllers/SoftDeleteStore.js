'use strict';

const Router = require('../models/Router');

const utils = require('../models/utils');

const router = new Router();

router.post('/soft_delete_store',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;
    const deletedStores = yield utils.softDeleteStore(
      this.application,
      this.user,
      {storeIds: fields.storeIds || [fields.storeId]},
      utils
    );

    this.body = deletedStores;
  });

module.exports = router;
