'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const User = require('../models/User');
const router = new Router();

router.all('/get_user_info',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {limit, page, sort, userId} = this.request.fields || this.request.query;

    if (!userId) { throw new HttpError(400, 'User id required'); }

    const usersTable = yield Table.fetch('users', this.application.id);
    const certificatesTable = yield Table.fetch('certificates', this.application.id);
    const certificateCashingTable = yield Table.fetch('certificate_cashing', this.application.id);
    const paytureOrdersTable = yield Table.fetch('payture_orders', this.application.id);

    let options = {};
    if (limit) { options.limit = limit; }
    if (page) { options.skip = page * limit || 0; }
    if (sort) { options.sort = sort; }

    let user = yield usersTable.find({user_id: userId})
      .catch((e) => ({data: null}));

    if (!user.data) { throw new HttpError(404, 'User not found'); }


    let certificates = yield certificatesTable.findAll({buyer_id: userId}, options);

    let certificatesIds = certificates.data.map((c) => c.id.toString());
    let certificateOrdersIds = certificates.data.map((c) => c.order_id.toString());
    let orders = yield paytureOrdersTable.findAll({order_id: {$in: certificateOrdersIds}});
    let cash = yield certificateCashingTable.findAll({certificate_id: {$in: certificatesIds}}, {populate: 'cashing_place'});

    // Блок статистики
    // -------------------

    let userCertificates = yield certificatesTable.findAll({buyer_id: userId}); // куплено
    let userCertificatesIds = userCertificates.data.map((uc) => uc.id.toString());
    let userCertificatesOrderIds = userCertificates.data.map((uc) => uc.order_id.toString());
    let userOrders = yield paytureOrdersTable.findAll({order_id: {$in: userCertificatesOrderIds}});
    let sumCounter = 0; // сумма
    userOrders.data.map((uo) => {
      sumCounter = sumCounter + uo.amount / 100;
    });
    let userCash = yield certificateCashingTable.findAll({certificate_id: {$in: userCertificatesIds}}); // погашено

    // -------------------

    certificates.data.map((certificate) => {
      certificate.isCash = false;
      let certificateCash = cash.data.filter((ch) => {
        if (certificate.id.toString() == ch.certificate_id.toString()) {
          certificate.isCash = true;
          return ch;
        }
      });
      let certificateOrder = orders.data.filter((o) => {
        if (o.order_id == certificate.order_id) return o;
      });

      certificate.price = certificateOrder[0] ? certificateOrder[0].amount / 100 : null;
      certificate.store = certificateCash[0] ? certificateCash[0].cashing_place : null;
    });

    this.body = {user: user.data, certificates: certificates.data, counters: {sumCounter, buyGmoji: userCertificates.count, cashGmoji: userCash.count}};
  });

module.exports = router;
