/**
 * На вход ["Миша", "Саша", "Маша"]
 */
'use strict';

const uuid = require('uuid');

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.all('/csv_parse_finish',
  {
    auth: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.querystring;

    const couponsTable = yield Table.fetch('coupons', this.application.id);
    const guidTable = yield Table.fetch('guid', this.application.id);
    if (!fields.fileData.includes('******')) {
      // --- validation
      let coupons = yield couponsTable.findAll({
        status: {$in: [StatusesDictionary.ACTIVE, StatusesDictionary.DEACTIVATED]},
      });

      yield fields.fileData.map(function* (c) {
        let ind = coupons.data.findIndex((coupon) => {
          return c == coupon.code;
        });

        if (ind >= 0 && coupons.data[ind].guid) {
          let checkGuid = yield guidTable.find({guid: coupons.data[ind].guid})
            .catch((e) => ({data: null}));

          if (!checkGuid.data) { throw new HttpError(400, 'Coupon already exists'); }

          if (checkGuid.data.status == StatusesDictionary.ACTIVE) {
            throw new HttpError(400, 'Coupon already exists');
          }
        }
      });
      // --- validation end
    }


    // --- gen guid and first-stage-writing
    let uidCode = uuid.v4();
    let newGuid = yield guidTable.create({guid: uidCode, status: StatusesDictionary.PENDING});

    fields.fileData = fields.fileData.map((c) => {
      return {code: c, guid: newGuid.id, status: StatusesDictionary.PENDING};
    });

    let newRows = yield couponsTable.insertMany(fields.fileData);

    this.body = {guid: newGuid.guid, coupons_count: newRows.data.length};
  });

module.exports = router;
