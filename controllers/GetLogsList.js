'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');

const router = new Router();

router.all('/get_logs_list',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.querystring;

    const logsTable = yield Table.fetch('administration_logs', this.application.id);

    let params = {};
    let options = {};

    if (fields.limit) { options.limit = fields.limit; }
    if (fields.page) { options.skip = (fields.page - 1) * fields.limit || 0; }
    if (fields.sort) { options.sort = fields.sort; }

    let logs = yield logsTable.findAll(params, options);

    let total = (yield logsTable.findAll()).count;

    this.body = {
      list: logs.data,
      total: total,
    };
  });

module.exports = router;
