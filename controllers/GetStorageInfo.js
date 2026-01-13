/**
 * Выгрузка данные для контрагента, его представителя и админа в LocalStorage
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const RolesDictionary = require('../models/dictionaries/Role');

const utils = require('../models/utils');

const router = new Router();

router.all('/get_storage_info',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND, RolesDictionary.ADMIN_FIRST];

    let result = {};
    if (this.user.role.id == RolesDictionary.CONTRAGENT) {
      const contragentTable = yield Table.fetch('contragents', this.application.id);
      let contragent = yield contragentTable.find({user_id: this.user.id})
        .catch((e) => ({data: null}));
      contragent = contragent.data;

      if (!contragent) { throw new HttpError(404, 'Contragent not found'); }

      let rules = yield utils.getContragentProductRules(this.application);

      Object.assign(result, {
        user_id: this.user.id.toString(),
        username: this.user.username,
        role: this.user.role.id.toString(),
        user_giftclub_id: contragent.id.toString(),
        rules,
      });
    }

    if (~admins.indexOf(this.user.role.id.toString())) {
      Object.assign(result, {
        user_id: this.user.id.toString(),
        username: this.user.username,
        role: this.user.role.id.toString(),
      });
    }

    if (this.user.role.id == RolesDictionary.SUB_CONTRAGENT) {
      const subcontragentTable = yield Table.fetch('subcontragents', this.application.id);
      let subcontragent = yield subcontragentTable.find({user_id: this.user.id})
        .catch((e) => ({data: null}));
      subcontragent = subcontragent.data;

      if (!subcontragent) { throw new HttpError(404, 'Subcontragent not found'); }

      Object.assign(result, {
        user_id: this.user.id.toString(),
        username: this.user.username,
        role: this.user.role.id.toString(),
        user_giftclub_id: subcontragent.id.toString(),
      });
    }

    this.body = result;
  });

module.exports = router;
