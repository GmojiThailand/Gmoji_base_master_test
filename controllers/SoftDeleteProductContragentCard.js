/**
 * Удаление карточки контрагента, которая привязана к товару и описывает особенности их связи
 *
 * @param {string} card_id - id карточки из таблицы product_contragent_cards
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const Locks = require('../models/Locks');
const HttpError = require('../models/Error');
const StatusesDictionary = require('../models/dictionaries/Status');
const AdminLogData = require('../models/dictionaries/AdminLogData');

const utils = require('../models/utils');

const router = new Router();

// TODO: Перенести в конфиг или выгружать из БД контрагента "Скоро"
const soonContragentId = '5ab25ed7b8c83b6d7a6391ad';

router.all('/delete_product_contragent_card',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.card_id) {
      throw new HttpError(400, 'Card id required');
    }

    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
    let card = yield cardsTable.find({id: fields.card_id, status: StatusesDictionary.ACTIVE})
      .catch((e) => ({data: null}));
    card = card.data;

    if (!card) {
      throw new HttpError(404, 'Card not found');
    }

    let lockId = card.product_id.toString();
    try {
      Locks.isLocked([lockId]);
      Locks.lock([lockId]);

      let productTable = yield Table.fetch('products', this.application.id);
      let product = yield productTable.find({id: card.product_id.toString()})
        .catch((e) => ({data: null}));
      product = product.data;

      if (!product) {
        throw new HttpError(404, 'Product not found');
      }

      // Поиск активных джипонов продукта, к которому привязана карточка
      let cards = yield cardsTable.findAll({product_id: card.product_id, status: StatusesDictionary.ACTIVE});
      cards = cards.data;
      if (cards.length == 1) {
        const haveActiveGpons = yield utils.checkProductActiveGpons(this.application, {productIds: [card.product_id]});

        if (haveActiveGpons) {
          throw new HttpError(403, 'Active gpons found');
        }

        // Замена на карточку Soon, если карточка контрагента была последней в товаре
        yield utils.soonContragentCreation(this.application, {productId: card.product_id});
      }

      if (card.contragent_id == soonContragentId) {
        yield card.remove();
      } else {
        yield card.update({status: StatusesDictionary.DELETED});
      }


      const contragentsTable = yield Table.fetch('contragents', this.application.id);
      let contragent = yield contragentsTable.find({
        user_id: card.contragent_id,
        status: StatusesDictionary.ACTIVE,
      })
        .catch((e) => ({data: null}));
      contragent = contragent.data;

      if (contragent) {
        let pf = {id: product.id.toString()};
        pf.contragent = product.contragent
          .map((v) => v.id.toString())
          .filter((value, index, arr) => value !== contragent.id.toString());

          pf.user_id = product.user_id
              .filter((value, index, arr) => value !== contragent.user_id);

          let pr = yield product.update(pf);
      }
      Locks.unlock([lockId]);

      yield utils.updateProductCities(this.application, [product.id]);

      // Создание записи в логе действий администраторов
      let logOptions = {
        operationType: AdminLogData.LOG_OPERATION.DELETE,
        userId: this.user.id,
        tableName: AdminLogData.LOG_TABLE.PRODUCT_CONTRAGENT_CARD,
        entityId: card.id,
      };

      yield utils.createAdminLog(this.application, logOptions);

      this.body = card;

    } catch (error) {
      Locks.unlock([lockId]);

      throw error;
    }
  });

module.exports = router;
