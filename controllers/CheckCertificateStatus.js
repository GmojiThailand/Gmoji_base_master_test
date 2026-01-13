'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');

const router = new Router();

router.get('/check_certificate_status',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {certificate_id: id} = this.request.query;
    const certificatesTable = yield Table.fetch('certificates', this.application.id);
    let gmoji = yield certificatesTable.find({id})
      .catch((e) => ({data: null}));
    if (gmoji.data) {
      this.body = gmoji.data.status;
    } else {
      throw new HttpError(404, 'Not found');
    }
  });

module.exports = router;
