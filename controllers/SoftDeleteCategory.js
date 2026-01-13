'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');
const AdminLogData = require('../models/dictionaries/AdminLogData');

const utils = require('../models/utils');

const router = new Router();

const categoryTopId = '58e5f191d351f81cc3fa6a0a';

router.all('/soft_delete_category',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const data = this.request.fields || this.request.querystring;

    if (!data.categoryId) {
      throw new HttpError(400, 'Incorrect request fields');
    }

    if (this.user.role.id.toString() != RolesDictionary.ADMIN_SUPER) {
      throw new HttpError(404, 'Only admin allowed');
    }

    if (data.categoryId == categoryTopId) {
      throw new HttpError(403, 'Delete category Top forbidden');
    }

    const productCategoriesTable = yield Table.fetch('product_categories', this.application.id);
    const productsTable = yield Table.fetch('products', this.application.id);

    let category = yield productCategoriesTable.find({id: data.categoryId, status: StatusesDictionary.ACTIVE})
      .catch((e) => ({data: null}));
    category = category.data;

    if (!category) {
      throw new HttpError(404, 'Category not found');
    }

    let products = yield productsTable.findAll({
      categories: category.id.toString(),
      status: StatusesDictionary.ACTIVE,
    });
    products = products.data;

    if (products.length) {
      let productIds = products.map((product) => product.id.toString());

      let haveActivegGpons = yield utils.checkProductActiveGpons(this.application, {productIds});
      if (haveActivegGpons) {
        throw new HttpError(400, 'Active gpons found');
      }

      yield utils.softDeleteProduct(this.application, this.user, {productIds}, utils);
    }

    let categoryPosition = category.fake_id;
    let result = yield category.update({
      fake_id: 0,
      status: StatusesDictionary.DELETED,
    });

    // минус в основном счетчике категорий
    const countersTable = yield Table.fetch('counters', this.application.id);
    yield countersTable.findOneAndUpdate(
      {name: 'product_categories'},
      {$inc: {'value.main': -1}},
      {new: true}
    );

    // удаление из счетчиков продуктов
    let categoryMark = `value.${result.id}`;
    let newCategoryCounter = {};
    newCategoryCounter[categoryMark] = 1;

    yield countersTable.findOneAndUpdate(
      {name: 'products'},
      {$unset: newCategoryCounter},
      {new: true}
    );

    // поднятие категорий что ниже находились
    yield productCategoriesTable.updateMany(
      {
        fake_id: {$gt: categoryPosition},
        status: StatusesDictionary.ACTIVE,
      },
      {$inc: {fake_id: -1}}
    );

    // Создание записи в логе действий администраторов
    let logOptions = {
      operationType: AdminLogData.LOG_OPERATION.DELETE,
      userId: this.user.id,
      tableName: AdminLogData.LOG_TABLE.PRODUCT_CATEGORY,
      entityId: result.id,
    };

    yield utils.createAdminLog(this.application, logOptions);

    this.body = result;
  });

module.exports = router;
