/**
 * Редактирование карточки контрагента, которая привязана к товару и описывает особенности их связи
 *
 * @param {string} card_id - id карточки из таблицы product_contragent_cards
 * @param {number} commission_individual - коммиссия, назначеная вручную администратором для данного товара
 *                                         относительно контрагента
 * @param {...string} stores - список выбранных торговых точек, где товар в наличии относительно контрагента
 * @param {string} product_name_aliase - назание товара индивидуальное относительно контрагента
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const AdminLogData = require('../models/dictionaries/AdminLogData');

const utils = require('../models/utils');

const router = new Router();

router.all('/edit_product_contragent_card',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.card_id) { throw new HttpError(400, 'Card id required'); }

    delete fields.product_id;
    delete fields.contragent_id;
    delete fields.contragent_name;

    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
    const card = yield cardsTable.find({id: fields.card_id})
      .catch((e) => ({data: null}));

    if (!card || !card.data) { throw new HttpError(404, 'Card not found'); }

    let newData = fields;
    if (fields.commission_individual === null) { newData.commission_individual = -1; }

    const photos = fields.photos;
    delete fields.photos;

    let logOptions = {
      operationType: AdminLogData.LOG_OPERATION.UPDATE,
      userId: this.user.id,
      tableName: AdminLogData.LOG_TABLE.PRODUCT_CONTRAGENT_CARD,
      entityId: card.data.id,
      updatedFields: yield utils.getUpdatedFields(card.data, fields, cardsTable.db.schema),
    };

    const productPhotoTable = yield Table.fetch('product_photo', this.application.id);

    let cardPhotosIds = [];

    if (card.data.photos && card.data.photos.length > 0) {
      cardPhotosIds = card.data.photos.map((photo) => photo.id.toString());
    }

    let productPhotoIds = [];

    if (photos && photos.length > 0) {

      productPhotoIds = photos.map((photo) => photo.id).filter((id) => id != undefined);

      let difference = cardPhotosIds.filter((e) => !productPhotoIds.includes(e));

      if (productPhotoIds && productPhotoIds.length > 0) {
        yield productPhotoTable.remove({id: {$in: difference}});
      }

      for (let i = 0; i < photos.length; i++) {
        let productPhoto = photos[i];
        if (productPhoto.id) {
          yield productPhotoTable.findOneAndUpdate({id: productPhoto.id}, {
            photo: productPhoto.photo,
            thumbnail: productPhoto.thumbnail
          });
        } else {
          let newPhoto = yield productPhotoTable.create({
            photo: productPhoto.photo,
            thumbnail: productPhoto.thumbnail,
          });
          productPhotoIds.push(newPhoto.id);
        }
      }
    } else {
      yield productPhotoTable.remove({id: {$in: cardPhotosIds}});
    }

    newData.photos = productPhotoIds;

    let result = yield card.data.update(newData);

    yield utils.updateProductCities(this.application, [result.product_id]);

    yield utils.createAdminLog(this.application, logOptions);

    this.body = result;
  });

module.exports = router;
