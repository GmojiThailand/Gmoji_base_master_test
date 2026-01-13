/**
 * Создание карточки контрагента, которая привязана к товару и описывает особенности их связи
 *
 * @param {string} contragent_id - системный id контрагента в системе
 * @param {string} product_id - id товара из таблицы products
 * @param {number} commission_individual - коммиссия, назначеная вручную администратором для данного товара
 *                                         относительно контрагента
 * @param {...string} stores - список выбранных торговых точек, где товар в наличии относительно контрагента
 * @param {string} product_name_aliase - назание товара индивидуальное относительно контрагента
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const Locks = require('../models/Locks');
const HttpError = require('../models/Error');
const StatusesDictionary = require('../models/dictionaries/Status');
const AdminLogData = require('../models/dictionaries/AdminLogData');

const utils = require('../models/utils');

const Config = require('../config/general');

const router = new Router();

router.all('/create_product_contragent_card',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.contragent_id || !fields.product_id || fields.commission_individual === undefined) {
      throw new HttpError(400, 'Incorrect request fields');
    }

    const contragentsTable = yield Table.fetch('contragents', this.application.id);
    let contragent = yield contragentsTable.find({user_id: fields.contragent_id, status: StatusesDictionary.ACTIVE})
      .catch((error) => ({data: null}));

    if (!contragent || !contragent.data) {
      throw new HttpError(404, 'Contragent not found');
    }

    let lockId = fields.product_id;
    try {
      Locks.isLocked([lockId]);
      Locks.lock([lockId]);

      const productsTable = yield Table.fetch('products', this.application.id);
      let product = yield productsTable.find({id: fields.product_id, status: StatusesDictionary.ACTIVE})
        .catch((error) => ({data: null}));

      if (!product || !product.data) {
        throw new HttpError(404, 'Product not found');
      }
      product = product.data;

      const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
      const card = yield cardsTable.find({
        contragent_id: fields.contragent_id,
        product_id: fields.product_id,
        status: StatusesDictionary.ACTIVE,
      })
        .catch((e) => ({data: null}));

      if (card && card.data) {
        throw new HttpError(400, 'Card already exist');
      }

      if (typeof fields.product_name_aliase === 'object') {
        if (fields.product_name_aliase[Config.defaultLocale]) {
          fields.product_name_aliase = fields.product_name_aliase[Config.defaultLocale];
        } else {
          fields.product_name_aliase = '';
        }
      }

      let newCard = fields;
      if (!fields.stores) {
        newCard.stores = [];
      }

      newCard.status = StatusesDictionary.ACTIVE;

      const photos = fields.photos;
      let cardPhotos = [];
      if (photos && photos.length > 0) {
        const productPhotoTable = yield Table.fetch('product_photo', this.application.id);

        for (let i = 0; i < photos.length; i++) {
          let photo = yield productPhotoTable.create({
            photo: photos[i].photo,
            thumbnail: photos[i].thumbnail,
          });
          if (photo) {
            cardPhotos.push(photo.id);
          }
        }
      }

      newCard.photos = cardPhotos;

      let result = yield cardsTable.create(newCard);

      let contragent_name = contragent.data.name;

      if (contragent.data.localized_name && contragent.data.localized_name[Config.defaultLocale]) {
        contragent_name = contragent.data.localized_name[Config.defaultLocale];
      }

      Object.assign(result, {contragent_name: contragent_name});

      this.body = result;

      let pf = {id: fields.product_id};
      pf.contragent = product.contragent.map((v) => v.id.toString());
      const contragentId = contragent.data.id.toString();
      if (!pf.contragent.includes(contragentId)) {
        pf.contragent.push(contragentId);
      }
      pf.user_id = product.user_id;
      if (!pf.user_id.includes(contragent.data.user_id)) {
        pf.user_id.push(contragent.data.user_id);
      }
      let pr = yield product.update(pf);
      Locks.unlock([lockId]);

      yield utils.updateProductCities(this.application, [product.id]);

      // Создание записи в логе действий администраторов
      let options = {
        operationType: AdminLogData.LOG_OPERATION.CREATE,
        userId: this.user.id,
        tableName: AdminLogData.LOG_TABLE.PRODUCT_CONTRAGENT_CARD,
        entityId: result.id,
      };
      yield utils.createAdminLog(this.application, options);

    } catch (error) {
      Locks.unlock([lockId]);
      throw error;
    }
  });

module.exports = router;
