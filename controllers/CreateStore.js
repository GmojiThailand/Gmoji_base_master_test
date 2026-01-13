// TODO: Доделать описание полей в комментарии
/**
 * Создание торговой точки
 *
 * @param - поля таблицы
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');
const AdminLogData = require('../models/dictionaries/AdminLogData');
const uuid = require('uuid');

const utils = require('../models/utils');

const router = new Router();

router.post('/create_store',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let fields = this.request.fields;
    const admins = [RolesDictionary.ADMIN_SECOND, RolesDictionary.ADMIN_SUPER];

    if (~admins.indexOf(this.user.role.id.toString()) && !fields.user_id) {
      throw new HttpError(400, 'Contargent id required');
    }

    if (this.user.role.id == RolesDictionary.CONTRAGENT) {
      fields.user_id = this.user.id.toString();
    }

    if (fields.subcontragent_name) {
      fields.subcontragent_name = fields.subcontragent_name.toLowerCase().trim();
    } else {
      fields.subcontragent_name = uuid.v1();
    }

    try {
      yield utils.checkUniqueParams(this.application, {username: fields.subcontragent_name});
    } catch (error) {
      throw new HttpError(400, 'Subcontragent is not unique');
    }

    let newSca = yield utils.createNewSca(
      this.application,
      {
        contragentId: fields.user_id,
        username: fields.subcontragent_name,
      }
    );

    if (!newSca) { throw new HttpError(404, 'Problem with subcontragent creation'); }

    let newStore = fields;
    newStore.subcontragent = newSca.id;
    newStore.status = StatusesDictionary.ACTIVE;

    const storesTable = yield Table.fetch('stores', this.application.id);
    let store;
    try {
      store = yield storesTable.create(newStore);
    } catch (e) {
      yield utils.deleteSca(this.application, newSca.user_id);
      throw new HttpError(404, 'Problem with store creation');
    }

    let options = {
      operationType: AdminLogData.LOG_OPERATION.CREATE,
      userId: this.user.id,
      tableName: AdminLogData.LOG_TABLE.STORE,
      entityId: store.id,
    };
    yield utils.createAdminLog(this.application, options);


    this.body = store;
  });

module.exports = router;
