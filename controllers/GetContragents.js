/**
 * Получение списка контрагентов с количеством продуктов и торговых точек
 *
 * @param {string} name - наименование контрагента дял фильтрации(опционально)
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const Validator = require('../models/Validator');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.all('/get_contragents',
  {
    auth: true,
    access: [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND],
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    let params = {status: StatusesDictionary.ACTIVE};

    if (fields.name) {
      let re = Validator.buildMongoRegex(fields.name, {});

      params.name = re;
    }

    let {sort, page, offset, limit, populate, select} = fields;

    let options = {};
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

    const contragentsTable = yield Table.fetch('contragents', this.application.id);
    let contragents = yield contragentsTable.findAll(params, options);
    contragents = contragents.data;
    const contragentIds = contragents.map((contragent) => contragent.user_id.toString());

    const storesTable = yield Table.fetch('stores', this.application.id);
    let stores = yield storesTable.findAll(
      {
        user_id: {$in: contragentIds},
        status: StatusesDictionary.ACTIVE,
      },
      {
        select: ['user_id'],
      }
    );
    stores = stores.data;

    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
    let cards = yield cardsTable.findAll(
      {
        contragent_id: {$in: contragentIds},
        status: StatusesDictionary.ACTIVE,
      },
      {
        select: ['contragent_id', 'product_id'],
        populate: ['product_id']
      }
    );
    cards = cards.data;

    contragents = contragents.map((contragent) => {
      let storesCount = 0;
      let productsCount = 0;

      for (let i = 0; i < stores.length; i++) {
        if (stores[i].user_id.toString() == contragent.user_id.toString()) {
          storesCount += 1;
        }
      }

      for (let i = 0; i < cards.length; i++) {
        if (cards[i].contragent_id.toString() == contragent.user_id.toString() && cards[i].product_id.status.id == StatusesDictionary.ACTIVE) {
          productsCount += 1;
        }
      }

      contragent.stores_count = storesCount;
      contragent.products_count = productsCount;
      return contragent;
    });

    this.body = contragents;
  });

module.exports = router;
