/**
 * Выгрузка списка сертификатов юзера, которые он подарил
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const StatusesDictionary = require('../models/dictionaries/Status');

const utils = require('../models/utils');

const Config = require('../config/general');

const router = new Router();

router.all('/get_send_certificates',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = Object.assign(this.request.fields || {}, this.request.query || {});
    let options = yield utils.getOptions(fields);
    if (fields.out === 'short') {
      options.populate = {product: {select: ['_id', 'name', 'description', 'is_delivery', 'code_type', 'icon', 'is_coupon_limited', 'delivery_type', 'localized_name']}};
    }
    options.sort = 'status end_sale_date';

    const certGivingTable = yield Table.fetch('certificate_giving_history', this.application.id);
    let sentGponsHistory = yield certGivingTable.findAll({giver_id: this.user.id}, {sort: {createdAt: -1}});
    sentGponsHistory = sentGponsHistory.data;

    let sentGponIds = sentGponsHistory.map((gpon) => gpon.certificate.toString());

    if (!sentGponIds.length) {
      this.body = [];
    }

    let uniqueSentGponIds = [...new Set(sentGponIds)];
    uniqueSentGponIds = uniqueSentGponIds.reverse();

    const certificatesTable = yield Table.fetch('certificates', this.application.id);
    let sentGpons = yield certificatesTable.findAll({
      id: {$in: uniqueSentGponIds},
      status: {$ne: StatusesDictionary.DELETED},
    }, options);
    sentGpons = sentGpons.data;

    let sentGponsOrdered = sentGpons;

    const categoriesTable = yield Table.fetch('product_categories', this.application.id);
    let categories = yield categoriesTable.findAll({status: StatusesDictionary.ACTIVE});
    categories = categories.data;

    sentGponsOrdered = sentGponsOrdered.map((gpon) => {
      if (gpon.product && gpon.product.categories) {
        let categoryArray = [];
        gpon.product.categories.map((category) => {
          categories.map((item) => {
            if (item.id.toString() == category.toString()) {
              categoryArray.push(item);
            }
          });
        });

        gpon.product.categories = categoryArray;
      }

      gpon = utils.detectCertificateStatus(gpon);

      return gpon;
    });

    if (fields.out === 'short') {
      sentGponsOrdered = sentGponsOrdered.map((gpon) => {
        delete gpon.product.is_coupon_limited;
        delete gpon.product.delivery_type;
        return gpon;
      });
    }

    sentGponsOrdered.forEach(function (gpon) {
      if (gpon.product && gpon.product.localized_name) {
        if (fields.locale && gpon.product.localized_name[fields.locale]) {
          gpon.product.name = gpon.product.localized_name[fields.locale];
        } else if(gpon.product.localized_name[Config.defaultLocale]) {
          gpon.product.name = gpon.product.localized_name[Config.defaultLocale];
        }
      }
    });

    this.body = sentGponsOrdered;
  });

module.exports = router;
