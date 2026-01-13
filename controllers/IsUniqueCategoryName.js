'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');

const router = new Router();

router.all('/is_unique_category_name',
  {
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (fields.name) {
      let categoryTable = yield Table.fetch('product_categories', this.application.id);
      let category = yield categoryTable.find({name: fields.name})
        .catch((e) => ({data: null}));

      if (!category.data) {
        this.body = {isUnique: true};
      }
    }

    this.body = {isUnique: false};
  });

module.exports = router;
