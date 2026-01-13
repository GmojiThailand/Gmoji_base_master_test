// TODO: заполнить комментарий с описанием полей
/**
 * Создание категории товаров
 *
 * @param {string} name - название категории
 * @param {boolean} is_adult - флаг категории для взрослых(18+)
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const RolesDictionary = require('../models/dictionaries/Role');
const Table = require('../models/Table');
const AdminLogData = require('../models/dictionaries/AdminLogData');
const StatusesDictionary = require('../models/dictionaries/Status');

const utils = require('../models/utils');

const router = new Router();

router.post('/create_category',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields;

    if (!fields.is_adult) fields.is_adult = false;

    const localeTable = yield Table.fetch('locale', this.application.id);
    let locales = (yield localeTable.findAll({status: StatusesDictionary.ACTIVE})).data;
    if (locales.length < 1 && fields.name) {
        const isUnique = yield utils.validateEntity(this.application, {categoryName: fields.name});
        if (!isUnique) { throw new HttpError(400, 'Name is not unique'); }
    } else {
        delete fields.name;
    }

    if (fields.localized_name) {
      const locales = Object.keys(fields.localized_name);

      for (let i = 0; i < locales.length; i++) {
        const code = locales[i];

        const isUnique = yield utils.validateEntity(this.application, {categoryLocalizedName: {code: code, name: fields.localized_name[code]}});

        if (!isUnique) { throw new HttpError(400, 'Name is not unique(' + code + ')'); }
      }
    }

    const categoryTable = yield Table.fetch('product_categories', this.application.id);

    // Добавление fake_id категории
    const countersTable = yield Table.fetch('counters', this.application.id);
    let counterValue = yield countersTable.findOneAndUpdate(
      {name: 'product_categories'},
      {$inc: {'value.main': 1}},
      {new: true}
    )
      .catch((e) => ({data: null}));

    if (!counterValue || !counterValue.data) { throw new HttpError(404, 'Counter not found'); }

    let newCategory = fields;
    newCategory.fake_id = counterValue.data.value.main;

    let result = yield categoryTable.create(newCategory);

    if (!result) { throw new HttpError(404, 'Problem with category creation'); }

    let categoryMark = `value.${result.id}`;
    let newCategoryCounter = {};
    newCategoryCounter[categoryMark] = 0;

    yield countersTable.findOneAndUpdate(
      {name: 'products'},
      {$set: newCategoryCounter},
      {new: true}
    );

    // Создание записи в логе действий администраторов
    let options = {
      operationType: AdminLogData.LOG_OPERATION.CREATE,
      userId: this.user.id,
      tableName: AdminLogData.LOG_TABLE.PRODUCT_CATEGORY,
      entityId: result.id,
    };

    yield utils.createAdminLog(this.application, options);

    this.body = result;
  });

module.exports = router;
