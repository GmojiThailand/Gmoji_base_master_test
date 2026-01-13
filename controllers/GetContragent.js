/**
 * Выгрузка данных о контрагенте для админа и контрагента
 *
 * @param {string} contragent_id - системный id контрагента
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const User = require('../models/User');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');

const utils = require('../models/utils');

const router = new Router();

router.all('/get_contragent',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let fields = this.request.fields || this.request.query;

    const params = {};
    if (fields.end_sale_date) { params.end_sale_date = {$gt: fields.end_sale_date}; }

    if (this.user.role.id == RolesDictionary.CONTRAGENT) {
      fields.contragent_id = this.user.id.toString();
      params['$or'] = [{status: StatusesDictionary.SPENT}, {status: StatusesDictionary.OVERDUE}];
    }

    if (!fields.contragent_id) { throw new HttpError(400, 'Contragent id required'); }

    params.user_id = fields.contragent_id;

    const contragentsTable = yield Table.fetch('contragents', this.application.id);
    let contragent = yield contragentsTable.find({
      user_id: fields.contragent_id,
      status: StatusesDictionary.ACTIVE,
    })
      .catch((e) => ({data: null}));
    contragent = contragent.data;

    if (!contragent) { throw new HttpError(404, 'Contragent not found'); }

    let userSys = yield User.find({id: fields.contragent_id}, {}, this.application.id);

    if (!userSys) { throw new HttpError(404, 'User not found'); }

    Object.assign(contragent, {email: userSys.username});

    const storesTable = yield Table.fetch('stores', this.application.id);
    let stores = yield storesTable.findAll({
      user_id: fields.contragent_id,
      status: StatusesDictionary.ACTIVE,
    });

    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
    let cards = yield cardsTable.findAll({
      contragent_id: fields.contragent_id,
      status: StatusesDictionary.ACTIVE,
    });
    let productIds = cards.data.map((card) => card.product_id.toString());

    const certificates = yield utils.getGponsList(this.application, this.user, {fields});

    let productsTable = yield Table.fetch('products', this.application.id);
    let products = yield productsTable.findAll({id: {$in: productIds}, status: StatusesDictionary.ACTIVE});

    this.body = {data: {
      contragent: contragent,
      stores_count: stores.count,
      products_count: products.count,
      certificates_count: certificates.length,
    }};
  });

module.exports = router;
