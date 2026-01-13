/**
 * Выгрузка списка торговых точек для гашения джипона
 *
 * @params {string} name - наименование категории(опционально)
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.all('/get_cashing_stores',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND, RolesDictionary.ADMIN_FIRST];

    if (!fields.product_id) { throw new HttpError(400, 'Product id required'); }

    const storeCardsTable = yield Table.fetch('product_store_cards', this.application.id);

    if (~admins.indexOf(this.user.role.id.toString())) {
      const contragentsTable = yield Table.fetch('contragents', this.application.id);
      let contragents = yield contragentsTable.findAll({status: StatusesDictionary.ACTIVE});
      contragents = contragents.data;

      if (!contragents.length) {
        this.body = [];
        return;
      }

      const contragentIds = contragents.map((contragent) => contragent.user_id.toString());

      const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
      let cards = yield cardsTable.findAll({
        product_id: fields.product_id,
        contragent_id: {$in: contragentIds},
        status: StatusesDictionary.ACTIVE,
      });
      cards = cards.data;

      if (!cards.length) {
        this.body = [];
        return;
      }

      let storeIds = [];
      cards.map((card) => {
        if (card.stores && card.stores.length) {
          storeIds = storeIds.concat(card.stores);
        }
      });

      if (!storeIds.length) {
        this.body = [];
        return;
      }

      const storesTable = yield Table.fetch('stores', this.application.id);
      let stores = yield storesTable.findAll({id: {$in: storeIds}, status: StatusesDictionary.ACTIVE});
      stores = stores.data;

      let storeCards = yield storeCardsTable.findAll({
        product_id: fields.product_id,
        store_id: {$in: storeIds},
        status: StatusesDictionary.ACTIVE,
      });
      storeCards = storeCards.data;

      if (storeCards.length) {
        stores = stores.map((store) => {
          storeCards.map((storeCard) => {
            if (store.id.toString() == storeCard.store_id.toString()) {
              store.store_card = storeCard;
            }
          });

          return store;
        });
      }

      this.body = stores;
      return;
    }

    if (this.user.role.id.toString() == RolesDictionary.CONTRAGENT) {
      const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
      let card = yield cardsTable.find({
        product_id: fields.product_id,
        contragent_id: this.user.id.toString(),
        status: StatusesDictionary.ACTIVE,
      })
        .catch((e) => ({data: null}));
      card = card.data;

      if (!card || !card.stores || !card.stores.length) {
        this.body = [];
        return;
      }

      const storesTable = yield Table.fetch('stores', this.application.id);
      let stores = yield storesTable.findAll({id: {$in: card.stores}, status: StatusesDictionary.ACTIVE});
      stores = stores.data;
      let storeIds = stores.map((store) => store.id.toString());

      let storeCards = yield storeCardsTable.findAll({
        product_id: fields.product_id,
        store_id: {$in: storeIds},
        status: StatusesDictionary.ACTIVE,
      });
      storeCards = storeCards.data;

      if (storeCards.length) {
        stores = stores.map((store) => {
          storeCards.map((storeCard) => {
            if (store.id.toString() == storeCard.store_id.toString()) {
              store.store_card = storeCard;
            }
          });

          return store;
        });
      }

      this.body = stores;
      return;
    }

    if (this.user.role.id.toString() == RolesDictionary.SUB_CONTRAGENT) {
      // Проверить старый ли контрагент
      const subcontragentsTable = yield Table.fetch('subcontragents', this.application.id);
      let subcontragent = yield subcontragentsTable.find({
        user_id: this.user.id.toString(),
        status: StatusesDictionary.ACTIVE,
      })
        .catch((e) => ({data: null}));
      subcontragent = subcontragent.data;

      if (!subcontragent) {
        throw new HttpError(404, 'Subcontragent not found');
      }

      const storesTable = yield Table.fetch('stores', this.application.id);
      let store = yield storesTable.find({
        subcontragent: subcontragent.id.toString(),
        status: StatusesDictionary.ACTIVE,
      })
        .catch((e) => ({data: null}));
      store = store.data;

      const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
      if (store) {
        // Алгоритм для новых представителей
        let card = yield cardsTable.find({
          product_id: fields.product_id,
          stores: store.id.toString(),
          status: StatusesDictionary.ACTIVE,
        })
          .catch((e) => ({data: null}));
        card = card.data;

        let storeCard = yield storeCardsTable.find({
          product_id: fields.product_id,
          store_id: store.id.toString(),
          status: StatusesDictionary.ACTIVE,
        })
          .catch((e) => ({data: null}));
        storeCard = storeCard.data;

        if (store && storeCard) {
          store.store_card = storeCard;
        }

        return this.body = card ? [store] : [];
      } else {
        // Алгоритм для старых представителей
        let card = yield cardsTable.find({
          product_id: fields.product_id,
          contragent_id: subcontragent.contragent_id.toString(),
          status: StatusesDictionary.ACTIVE,
        })
          .catch((e) => ({data: null}));
        card = card.data;

        if (!card || !card.stores || !card.stores.length) {
          return this.body = [];
        }

        let stores = yield storesTable.findAll({
          id: {$in: card.stores},
          status: StatusesDictionary.ACTIVE,
        });
        stores = stores.data;
        let storeIds = stores.map((store) => store.id.toString());

        let storeCards = yield storeCardsTable.findAll({
          product_id: fields.product_id,
          store_id: {$in: storeIds},
          status: StatusesDictionary.ACTIVE,
        });
        storeCards = storeCards.data;

        if (storeCards.length) {
          stores = stores.map((store) => {
            storeCards.map((storeCard) => {
              if (store.id.toString() == storeCard.store_id.toString()) {
                store.store_card = storeCard;
              }
            });

            return store;
          });
        }

        return this.body = stores;
      }
    }
  });

module.exports = router;
