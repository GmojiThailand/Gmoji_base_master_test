/**
 * Получение списка продуктов контрагента
 *
 * @param {string} contragent_id - системный id контрагента
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const Validator = require('../models/Validator');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');

const utils = require('../models/utils');

const router = new Router();

router.all('/get_contractor_products',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let fields = this.request.fields || this.request.query;
    let {sort, page, offset, limit, populate, select} = fields;

    let options = {populate: ['categories']};
    delete fields.sort;
    delete fields.page;
    delete fields.offset;
    delete fields.limit;
    delete fields.populate;
    delete fields.select;

    if (select) {
      options.select = select;
    }

    if (limit) {
      limit = parseInt(limit);
      page = page ? parseInt(page) : 0;
      let skip = parseInt(offset) || page * limit;
      Object.assign(options, {skip, limit});
    }

    if (sort) {
      Object.keys(sort).map((k) => sort[k] = parseInt(sort[k]));
      options.sort = sort;
    }

    if (populate) { options.populate = populate; }

    const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND, RolesDictionary.ADMIN_FIRST];

    if (~admins.indexOf(this.user.role.id.toString()) && !fields.contragent_id) {
      throw new HttpError(400, 'Contragent id required');
    }

    if (this.user.role.id.toString() == RolesDictionary.CONTRAGENT) {
      fields.contragent_id = this.user.id.toString();
    }

    let contragentsTable = yield Table.fetch('contragents', this.application.id);
    let contragent = yield contragentsTable.find({user_id: fields.contragent_id, status: StatusesDictionary.ACTIVE})
      .catch((err) => ({data: null}));
    contragent = contragent.data;

    if (!contragent) { throw new HttpError(404, 'Contragent not found'); }

    let cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
    let cards = yield cardsTable.findAll({
      contragent_id: fields.contragent_id,
      status: StatusesDictionary.ACTIVE,
    });
    cards = cards.data;

    if (!cards.length) {
      this.body = {
        count: 0,
        data: [],
      };

      return;
    }

    let productIds = cards.map((card) => card.product_id.toString());

    let cardIds = [];
    cards.forEach((card) => cardIds[card.product_id.toString()] = card.id.toString());

    let params = {
      id: {$in: productIds},
      status: StatusesDictionary.ACTIVE
    };

    if (fields.name) {
      let re = Validator.buildMongoRegex(fields.name, {});

      params.name = re;
    }

    const products = yield utils.getProducts(this.application, {params, options});
    products.forEach((product) => product.cardId  = cardIds[product.id.toString()]);

    this.body = {
      count: products.length,
      data: products,
    };
  });

module.exports = router;
