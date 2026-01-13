/**
 * Запросы к пользовательской таблице contragents
 */
'use strict';

const Router = require('../../models/Router');
const Table = require('../../models/Table');
const HttpError = require('../../models/Error');
const RolesDictionary = require('../../models/dictionaries/Role');
const router = new Router();

router.get('/:data_id',
  {
    auth: true,
    // access: true,
    appId: true,
  },
  function* () {
    if (![RolesDictionary.CONTRAGENT, RolesDictionary.ADMIN_SUPER].includes(this.user.role.id.toString())) {
      throw new HttpError(403, 'Permission denied');
    }

    let options = {};
    let {populate, select, sort} = this.request.query;

    delete this.request.query.populate;
    delete this.request.query.select;
    delete this.request.query.sort;
    delete this.request.query.formatOptions;

    if (populate) { options.populate = populate; }
    if (select) { options.select = select; }
    if (sort) {
      Object.keys(sort).map((k) => sort[k] = parseInt(sort[k]));
      options.sort = sort;
    }

    const contragentsTable = yield Table.fetch('contragents', this.application.id);

    let contragent = yield contragentsTable.find(this.params.data_id, options);

    this.body = contragent;
  });

router.get('/',
  {
    auth: true,
    // access: true,
    appId: true,
  },
  function* () {
    if (![RolesDictionary.CONTRAGENT, RolesDictionary.ADMIN_SUPER].includes(this.user.role.id.toString())) {
      throw new HttpError(403, 'Permission denied');
    }

    let options = {};
    let {sort, page, offset, limit, populate} = this.request.query;

    options.select = this.request.query.select;
    delete this.request.query.sort;
    delete this.request.query.page;
    delete this.request.query.offset;
    delete this.request.query.limit;
    delete this.request.query.populate;
    delete this.request.query.formatOptions;
    delete this.request.query.select;

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

    let filter = this.request.query;

    const contragentsTable = yield Table.fetch('contragents', this.application.id);
    let contragents = yield contragentsTable.findAll(filter, options);

    this.body = contragents;
  });

module.exports = router;
