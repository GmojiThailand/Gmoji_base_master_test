/**
 * Получение списка торговых точек контрагентов
 *
 * @param {string} contragent_id - id продукта
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const Validator = require('../models/Validator');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.all('/get_contractor_stores',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let fields = this.request.fields || this.request.query;
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

    let params = {
      user_id: fields.contragent_id,
      status: StatusesDictionary.ACTIVE,
    };

    if (fields.name) {
      let re = Validator.buildMongoRegex(fields.name, {});

      params.name = re;
    }

    let storesTable = yield Table.fetch('stores', this.application.id);
    let stores = yield storesTable.findAll(params, options);
    stores = stores.data;

    this.body = {
      count: stores.length,
      data: stores,
    };
  });

module.exports = router;
