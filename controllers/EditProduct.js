/**
 * Редактирование товара
 *
 * @param id - id товара для редактирования
 * @param couponsGuid - guid купонов
 * @param limit - число купонов
 * @param duration - время действия купонов
 */

// если есть топ и топом остается проверки не нужны
// если не админ то only admin...
// лимит и проверка
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const Locks = require('../models/Locks');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');
const AdminLogData = require('../models/dictionaries/AdminLogData');

const utils = require('../models/utils');

const router = new Router();

// TODO: Переделать на запрос к БД выбор id категории топ
const categoryTopId = '58e5f191d351f81cc3fa6a0a';

router.all('/edit_product',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.id) { throw new HttpError(400, 'Product id required'); }

    // Если продукт с купонами уже, либо с лимитами, то сменить это уже нельзя
    if (fields.is_coupon_limited === false || fields.is_coupon_limited === true) {
      throw new HttpError(400, 'Product type change forbidden');
    }

    let partialUpdate = false;

    if (fields.partialUpdate) {
      partialUpdate = true;
      delete fields.partialUpdate;
    }

    const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND];

    let lockId = fields.id;
    try {
      Locks.isLocked([lockId]);
      Locks.lock([lockId]);

      let productTable = yield Table.fetch('products', this.application.id);
      let product = yield productTable.find({id: fields.id})
        .catch((e) => ({data: null}));
      product = product.data;

      if (!product) { throw new HttpError(404, 'Product not found'); }

      let catIds = product.categories.map((category) => {
        return category.toString();
      });

      if (fields.categories && !(~fields.categories.indexOf(categoryTopId) && ~catIds.indexOf(categoryTopId))) {
        if (~fields.categories.indexOf(categoryTopId) && !~admins.indexOf(this.user.role.id.toString())) {
          throw new HttpError(400, 'Only admins allowed to set products in top category');
        }

        if (~fields.categories.indexOf(categoryTopId)) {
          try {
            yield utils.checkCategoryTop(this.application);
          } catch (error) {
            throw new HttpError(400, 'Top category product limit exceeded');
          }
        }
      }

      if (fields.categories) {
        // Добавление категории
        let value = {};
        let prodCategories = product.categories.map((c) => c.toString());
        fields.categories.map((fcat) => {
          if (!prodCategories.includes(fcat)) {
            value[`value.${fcat}`] = 1;
          }
        });

        // увеличить счетчик категории в счетчике продукта и в fake_id
        const countersTable = yield Table.fetch('counters', this.application.id);
        let counterValue = yield countersTable.findOneAndUpdate(
          {name: 'products'},
          {$inc: value},
          {new: true}
        )
          .catch((e) => ({data: null}));
        counterValue = counterValue.data;

        if (!counterValue) { throw new HttpError(404, 'Counter not found'); }

        // Формирование объекта для обновления
        let fake_id = {};
        fields.categories.map((c) => {
          if (catIds.includes(c)) { // если присланная категория есть уже в продукте
            fake_id[c] = product.fake_id[c];
          } else {
            if (c in counterValue.value) {
              fake_id[c] = counterValue.value[c]; // тут последние значения в счетчиках
            }
          }
        });
        Object.assign(fields, {fake_id});

        // Удаление категории при обновлении продукта
        let deletedCategories = prodCategories.filter((pcat) => {
          if (!fields.categories.includes(pcat)) {
            return pcat;
          } else {
            return false;
          }
        });

        value = {};
        yield deletedCategories.map(function* (dcat) {
          value[`value.${dcat}`] = -1; // готовим для минуса в общем счетчике

          let categoryObject = `fake_id.${dcat}`;

          yield productTable.updateMany(
            {
              status: StatusesDictionary.ACTIVE,
              [categoryObject]: {
                $exists: true,
                $gt: product.fake_id[dcat],
              },
            },
            {$inc: {[categoryObject]: -1}}
          );

          delete fields.fake_id[dcat];
        });

        // уменьшаем на 1 общий счетчиках в продукте
        yield countersTable.findOneAndUpdate(
          {name: 'products'},
          {$inc: value},
          {new: true}
        );
      }

      let updatedFields = yield utils.getUpdatedFields(product, fields, productTable.db.schema);

      let result = yield product.update(fields);

      if (!result) { throw new HttpError(400, 'Problem with product editing'); }

      if (fields.couponsGuid) {
        yield utils.confirmCoupons(this.application, {guid: fields.couponsGuid, productId: fields.id});
      }

      if (fields.limit || fields.duration) {
        let params = {};

        if (fields.limit) { params.limit = fields.limit; }
        if (fields.duration) { params.duration = fields.duration; }

        const limitsTable = yield Table.fetch('limits', this.application.id);
        const limit = yield limitsTable.find({product_id: fields.id})
          .catch((e) => ({data: null}));

        updatedFields = updatedFields.concat(yield utils.getUpdatedFields(limit.data, params, limitsTable.db.schema));

        yield limit.data.update(params);
      }

      const productPhotos = fields.productPhotos;

      const productPhotoTable = yield Table.fetch('product_photo', this.application.id);

      if (!partialUpdate) {
        if (productPhotos && productPhotos.length > 0) {

          let productPhotoIds = productPhotos.map((photo) => photo.id).filter((id) => id != undefined);

          if (productPhotoIds && productPhotoIds.length > 0) {
            yield productPhotoTable.remove({product_id: fields.id, id: {$nin: productPhotoIds}});
          }

          for (let i = 0; i < productPhotos.length; i++) {
            let productPhoto = productPhotos[i];
            if (productPhoto.id) {
              yield productPhotoTable.findOneAndUpdate({id: productPhoto.id}, {
                photo: productPhoto.photo,
                thumbnail: productPhoto.thumbnail
              });
            } else {
              yield productPhotoTable.create({
                product_id: fields.id,
                photo: productPhoto.photo,
                thumbnail: productPhoto.thumbnail,
              });
            }
          }
        } else {
          yield productPhotoTable.remove({product_id: fields.id});
        }
      }

      Locks.unlock([lockId]);

      let logOptions = {
        operationType: AdminLogData.LOG_OPERATION.UPDATE,
        userId: this.user.id,
        tableName: AdminLogData.LOG_TABLE.PRODUCT,
        entityId: product.id,
        updatedFields,
      };

      yield utils.createAdminLog(this.application, logOptions);

      this.body = result;
    } catch (error) {
      Locks.unlock([lockId]);

      throw error;
    }
  });


router.post('/hide_product',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.querystring;

    if (!fields.id) {
      throw new HttpError(400, 'Product id required');
    }

    let productTable = yield Table.fetch('products', this.application.id);
    let product = yield productTable.find({id: fields.id})
      .catch((e) => ({data: null}));

    if (!product || !product.data) { throw new HttpError(404, 'Product not found'); }

    product = product.data;

    this.body = yield product.update({hidden: !product.hidden});
  });


module.exports = router;
