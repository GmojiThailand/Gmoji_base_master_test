/**
 * Редактирование торговой точки
 *
 * @param {string} id - id торговой точки
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');
const AdminLogData = require('../models/dictionaries/AdminLogData');

const utils = require('../models/utils');

const router = new Router();

router.post('/edit_store',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    let fields = this.request.fields;

    if (!fields.id) { throw new HttpError(406, 'Store id required'); }

    let params = {
      id: fields.id,
      status: StatusesDictionary.ACTIVE,
    };

    if (this.user.role.id == RolesDictionary.CONTRAGENT) {
      params.user_id = this.user.id.toString();
    }

    const storesTable = yield Table.fetch('stores', this.application.id);

    let store = yield storesTable.find(params)
      .catch((e) => ({data: null}));
    store = store.data;

    if (!store) { throw new HttpError(404, 'Store not found'); }

    if (fields.subcontragent_name) {
      fields.subcontragent_name = fields.subcontragent_name.toLowerCase().trim();

      try {
        yield utils.checkUniqueParams(this.application, {username: fields.subcontragent_name});
      } catch (error) {
        throw new HttpError(400, 'Subcontragent is not unique');
      }

      const subcontragentId = store.subcontragent;
      const subcontragentsTable = yield Table.fetch('subcontragents', this.application.id);
      let subcontragent = yield subcontragentsTable.find({id: subcontragentId, status: StatusesDictionary.ACTIVE})
        .catch((e) => ({data: null}));
      subcontragent = subcontragent.data;

      if (!subcontragent) { throw new HttpError(404, 'Subcontragent not found'); }

      let editedSca = yield utils.editSca(
        this.application,
        {
          userSysId: subcontragent.user_id,
          username: fields.subcontragent_name,
        }
      );

      if (!editedSca) { throw new HttpError(404, 'Problem with subcontragent editing'); }
    }

    let logOptions = {
      operationType: AdminLogData.LOG_OPERATION.UPDATE,
      userId: this.user.id,
      tableName: AdminLogData.LOG_TABLE.STORE,
      entityId: store.id,
      updatedFields: yield utils.getUpdatedFields(store, fields, storesTable.db.schema),
    };

    let result = yield storesTable.findOneAndUpdate(params, fields, {new: true})
      .catch((e) => ({data: null}));

    if (!result || !result.data) { throw new HttpError(400, 'Problem with store editing'); }

    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
    let cards = (yield cardsTable.findAll({
      stores: store.id,
      status: StatusesDictionary.ACTIVE
    })).data;

    let productIds = cards.map((card) => card.product_id);
    productIds = [...new Set(productIds)];

    if (productIds.length) {
      yield utils.updateProductCities(this.application, productIds);
    }

    yield utils.createAdminLog(this.application, logOptions);

    this.body = result.data;
  });

module.exports = router;
