'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const Validator = require('../models/Validator');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.all('/get_users_list',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.querystring;

    const usersTable = yield Table.fetch('users', this.application.id);
    const certificatesTable = yield Table.fetch('certificates', this.application.id);
    const cashingTable = yield Table.fetch('certificate_cashing', this.application.id);

    let params = {status: StatusesDictionary.ACTIVE};
    if (fields.name) {
      let re = Validator.buildMongoRegex(fields.name, {});

      params.name = re;
    }
    if (fields.phone) {
      let re = Validator.buildMongoRegex(fields.phone, {});

      params.phone = re;
    }

    let options = {};
    if (fields.limit) { options.limit = fields.limit; }
    if (fields.page) { options.skip = fields.page * fields.limit || 0; }
    if (fields.sort) { options.sort = fields.sort; }

    let users = yield usersTable.findAll(params, options);

    yield users.data.map(function* (user) {
      let buyedGpons = yield certificatesTable.findAll({buyer_id: user.user_id});
      buyedGpons = buyedGpons.data;

      let buyedGponIds = buyedGpons.map((gpon) => gpon.id.toString());

      let cashedGpons = yield cashingTable.findAll({certificate_id: {$in: buyedGponIds}});
      cashedGpons = cashedGpons.data;

      Object.assign(
        user,
        {
          buyed_gpons_count: buyedGpons.length,
          cash_gpons_count: cashedGpons.length,
        }
      );
    });

    this.body = users.data;
  });

module.exports = router;
