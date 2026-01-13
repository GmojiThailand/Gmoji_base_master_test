/**
 * Редактирование категории
 *
 * @param {string} id - id категории
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const Locks = require('../models/Locks');
const AdminLogData = require('../models/dictionaries/AdminLogData');
const StatusesDictionary = require('../models/dictionaries/Status');

const utils = require('../models/utils');

const router = new Router();

router.post('/edit_category',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.querystring;

    if (!fields.id) { throw new HttpError(400, 'Category id required'); }

    const localeTable = yield Table.fetch('locale', this.application.id);
    let locales = (yield localeTable.findAll({status: StatusesDictionary.ACTIVE})).data;
    if (locales.length < 1 && fields.name) {
        const isUnique = yield utils.validateEntity(this.application, {id: fields.id, categoryName: fields.name});
        if (!isUnique) { throw new HttpError(400, 'Name is not unique'); }
    } else {
        delete fields.name;
    }

    let result;
    try {
      delete fields.fake_id;
      Locks.isLocked([fields.id]);
      Locks.lock([fields.id]);

      let categoryTable = yield Table.fetch('product_categories', this.application.id);
      let category = yield categoryTable.find({id: fields.id})
        .catch((e) => ({data: null}));

      if (!category || !category.data) { throw new HttpError(404, 'Category not found'); }

      const productTable = yield Table.fetch('products', this.application.id);

      yield productTable.updateMany(
        {
          categories: fields.id,
          status: StatusesDictionary.ACTIVE,
        },
        {is_adult: !!fields.is_adult}
      );

      let logOptions = {
        operationType: AdminLogData.LOG_OPERATION.UPDATE,
        userId: this.user.id,
        tableName: AdminLogData.LOG_TABLE.PRODUCT_CATEGORY,
        entityId: category.data.id,
        updatedFields: yield utils.getUpdatedFields(category.data, fields, categoryTable.db.schema),
      };

      result = yield category.data.update(fields);

      Locks.unlock([fields.id]);

      if (!result) { throw new HttpError(400, 'Problem with category editing'); }

      yield utils.createAdminLog(this.application, logOptions);
    } catch (error) {
      Locks.unlock([fields.id]);

      throw error;
    }

    this.body = result;
  });

router.post('/hide_category',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.querystring;

    if (!fields.id) {
      throw new HttpError(400, 'Category id required');
    }

    let categoryTable = yield Table.fetch('product_categories', this.application.id);
    let category = yield categoryTable.find({id: fields.id})
      .catch((e) => ({data: null}));

    if (!category || !category.data) { throw new HttpError(404, 'Category not found'); }

    category = category.data;

    this.body = yield category.update({hidden: !category.hidden});
  });

module.exports = router;
