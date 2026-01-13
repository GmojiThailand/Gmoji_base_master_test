/**
 * Создание товара
 *
 * @param - столбцы таблицы
 * @param couponsGuid - guid купонов
 * @param {number} limit - число купонов
 * @param {number} duration - длительность срока действия купонов
 * @param {number} duration_date - дата истечения срока действия купонов
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const RolesDictionary = require('../models/dictionaries/Role');
const AdminLogData = require('../models/dictionaries/AdminLogData');

const utils = require('../models/utils');

const router = new Router();

// TODO: Переделать на запрос к БД выбор id категории топ
const categoryTopId = '58e5f191d351f81cc3fa6a0a';

router.all('/create_product',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND];

    if (!fields.user_id || fields.user_id.length == 0) {
      throw new HttpError(400, 'Contragent id required');
    }

    if (~fields.categories.indexOf(categoryTopId) && !~admins.indexOf(this.user.role.id.toString())) {
      throw new HttpError(403, 'Only admins allowed to set products in top category');
    }

    if (~fields.categories.indexOf(categoryTopId)) {
      try {
        yield utils.checkCategoryTop(this.application);
      } catch (error) {
        throw new HttpError(400, 'Top category product limit exceeded');
      }
    }

    // Добавление fake_id продукта
    let value = {};
    fields.categories.map((c) => {
      value[`value.${c}`] = 1;
    });

    const countersTable = yield Table.fetch('counters', this.application.id);
    let counterValue = yield countersTable.findOneAndUpdate(
      {name: 'products'},
      {$inc: value},
      {new: true}
    )
      .catch((e) => ({data: null}));

    if (!counterValue || !counterValue.data) { throw new HttpError(404, 'Counter not found'); }

    let newProduct = fields;
    newProduct.is_coupon_limited = !!fields.couponsGuid;
    let fake_id = {};
    fields.categories.map((c) => {
      if (c in counterValue.data.value) {
        fake_id[c] = counterValue.data.value[c];
      }
    });
    newProduct.fake_id = fake_id;

    const productTable = yield Table.fetch('products', this.application.id);
    let result = yield productTable.create(newProduct);
    if (!result) { throw new HttpError(404, 'Problem with product creation'); }
    if (fields.couponsGuid) {
      yield utils.confirmCoupons(this.application, {guid: fields.couponsGuid, productId: result.id});
    }

    const limitsTable = yield Table.fetch('limits', this.application.id);

    yield limitsTable.create({
      product_id: result.id,
      user_id: this.user.id,
      limit: fields.limit,
      duration: fields.duration,
    });

    const productPhotos = fields.productPhotos;

    if (productPhotos && productPhotos.length > 0) {
      const productPhotoTable = yield Table.fetch('product_photo', this.application.id);

      for (let i = 0; i < productPhotos.length; i++) {
        yield productPhotoTable.create({
          product_id: result.id,
          photo: productPhotos[i].photo,
          thumbnail: productPhotos[i].thumbnail,
        });
      }
    }

    // Создание записи в логе действий администраторов
    let options = {
      operationType: AdminLogData.LOG_OPERATION.CREATE,
      userId: this.user.id,
      tableName: AdminLogData.LOG_TABLE.PRODUCT,
      entityId: result.id,
    };
    yield utils.createAdminLog(this.application, options);

    this.body = result;
  });

module.exports = router;
