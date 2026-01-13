/**
 * Получение фото товара
 *
 * @param {string} id - id продукта
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.all('/get_product_photo',
  {
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.product_id) { throw new HttpError(400, 'Product id required'); }

    const productPhotoTable = yield Table.fetch('product_photo', this.application.id);

    let productPhotos = yield productPhotoTable.findAll({product_id: fields.product_id}, {sort: {createdAt: -1}});

    let result = [];

    if (productPhotos.data) {
      result = productPhotos.data.map((productPhoto) => ({
        photo: (productPhoto.photo && productPhoto.photo.image) ? productPhoto.photo.image.path : null,
        thumb: (productPhoto.thumbnail && productPhoto.thumbnail.image) ? productPhoto.thumbnail.image.path : null
      }));
    }

    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);

    let cards = yield cardsTable.findAll({
      product_id: fields.product_id,
      status: StatusesDictionary.ACTIVE,
    });

    cards = cards.data;

    if (cards) {
      const contragentTable = yield Table.fetch('contragents', this.application.id);

      for (let i = 0; i < cards.length; i++) {
        let card = cards[i];
        let idContragent = (yield contragentTable.find({user_id: card.contragent_id})).data.id;
        if (card.photos && card.photos.length > 0) {
          card.photos.forEach((v) => {
            if (!v) {
              return;
            }
            result.push(
              {
                agent: idContragent,
                photo: v.photo.image.path,
                thumb: (v.thumbnail && v.thumbnail.image) ? v.thumbnail.image.path : null
              }
            );
          })
        } else if (card.photo && card.photo.image) {
          result.push(
            {
              agent: idContragent,
              photo: card.photo.image.path,
              thumb: (card.thumbnail && card.thumbnail.image) ? card.thumbnail.image.path : null
            }
          );
        }
      }
    }

    this.body = result;
  });

module.exports = router;
