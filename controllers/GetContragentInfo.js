/**
 * Подгрузки данных о контрагенте и его представителе
 *
 * @param {string} user_id - системный id контрагента
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const User = require('../models/User');
const RolesDictionary = require('../models/dictionaries/Role');

const router = new Router();

router.all('/get_contragent_info',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let fields = this.request.fields || this.request.query;

    if (this.user.role.id == RolesDictionary.CONTRAGENT) { fields.user_id = this.user.id; }

    if (!fields.user_id) { throw new HttpError(400, 'Contragent id required'); }

    let result = {data: {}};
    const contragentsTable = yield Table.fetch('contragents', this.application.id);
    let contragent = yield contragentsTable.find({user_id: fields.user_id})
      .catch((e) => ({data: null}));

    let caUserSys = yield User.find({id: fields.user_id}, {}, this.application.id);

    if (!contragent || !contragent.data || !caUserSys) { throw new HttpError(404, 'Contragent not found'); }

    Object.assign(contragent.data, {email: caUserSys.username});
    Object.assign(result.data, {contragent: contragent.data});

    const subcontragentsTable = yield Table.fetch('subcontragents', this.application.id);
    let subcontragent = yield subcontragentsTable.find({contragent_id: fields.user_id})
      .catch((e) => ({data: null}));

    if (subcontragent.data) {
      let subCaUserSys = yield User.find({id: subcontragent.data.user_id}, {}, this.application.id);
      Object.assign(result.data, {subcontragent: {username: subCaUserSys.username}});
    }

    this.body = result;
  });

module.exports = router;
