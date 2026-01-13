/**
 * Создания контрагента
 *
 * @param {string} username - логин пользователя в системе
 * @param {string} name - название контрагента
 * @param {string} phone - телефон контрагента
 * @param {string} fact_city - фактический город контрагента
 * @param - остальные как в БД по желанию
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const User = require('../models/User');
const Service = require('../models/Service');
const RolesDictionary = require('../models/dictionaries/Role');
const AdminLogData = require('../models/dictionaries/AdminLogData');
const uuid = require('uuid');

const utils = require('../models/utils');

const router = new Router();

router.all('/create_new_ca',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let fields = this.request.fields || this.request.query;

    // Check commission_common only if it's provided
    if (fields.commission_common !== undefined && fields.commission_common !== null) {
      if (fields.commission_common < 0) { throw new HttpError(400, 'Incorrect commission value'); }
    }

    if (fields.username) {
      fields.username = fields.username.toLowerCase();
    } else {
      fields.username = uuid.v1();
    }

    try {
      yield utils.checkUniqueParams(this.application, {username: fields.username, role: 'contragents'});
    } catch (error) {
      throw new HttpError(400, 'Contragent is not unique');
    }

    let password = Math.round(Math.random() * (999999 - 129899) + 129899).toString();

    let userSys = new User(
      {
        username: fields.username,
        role: RolesDictionary.CONTRAGENT,
        type: 'oauth',
      },
      this.application.id
    );
    userSys.password = password;
    yield userSys.save();

    // Try to send notification, but don't fail if service is unavailable
    try {
      let notify = yield Service.fetch('notify', this.application.id);
      notify.data = {password, email: [{email: userSys.username}]};
      yield notify.request('password_gen', this);
    } catch (err) {
      console.error('Failed to send notification:', err);
      // Continue execution even if notification fails
    }

    delete fields.username;

    let newContragent = {user_id: userSys.id};
    Object.assign(newContragent, fields);

    // Ensure commission_common is set if not provided
    if (newContragent.commission_common === undefined || newContragent.commission_common === null) {
      newContragent.commission_common = 0;
    }

    let contragentsTable = yield Table.fetch('contragents', this.application.id);
    let contragent = yield contragentsTable.create(newContragent);

    // Try to create admin log, but don't fail if it's not possible
    try {
      let options = {
        operationType: AdminLogData.LOG_OPERATION.CREATE,
        userId: this.user.id,
        tableName: AdminLogData.LOG_TABLE.CONTRAGENT,
        entityId: contragent.id,
      };
      yield utils.createAdminLog(this.application, options);
    } catch (err) {
      console.error('Failed to create admin log:', err);
      // Continue execution even if admin log fails
    }

    this.body = {data: {contragent}};
  });

module.exports = router;
