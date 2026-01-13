/**
 * Запросы к пользовательской таблице users
 */
'use strict';

const Router = require('../../models/Router');
const Table = require('../../models/Table');
const RolesDictionary = require('../../models/dictionaries/Role');
const HttpError = require('../../models/Error');

const router = new Router();

router.get('/:data_id',
  {
    auth: true,
    // access: true,
    appId: true,
  },
  function* () {
    if (this.user.role.id != RolesDictionary.USER) {
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

    const usersTable = yield Table.fetch('users', this.application.id);

    let user = yield usersTable.find({user_id: this.user.id}, options)
      .catch((err) => ({data: null}));

    this.body = user;
  });

router.get('/',
  {
    auth: true,
    // access: true,
    appId: true,
  },
  function* () {
    /**
       * Запрос используется для подгрузки профиля мобильного пользователя
       */
    if (this.user.role.id != RolesDictionary.USER) {
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

    Object.assign(filter, {user_id: this.user.id});

    const usersTable = yield Table.fetch('users', this.application.id);
    let users = yield usersTable.findAll(filter, options);

    this.body = users;
  });

module.exports = router;
