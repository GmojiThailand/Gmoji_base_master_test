'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');
const AdminLogData = require('../models/dictionaries/AdminLogData');

const utils = require('../models/utils');

const Config = require('../config/general');

const router = new Router();
// ДОБАВИТЬ В ТАБЛИЦУ RULES
router.post('/create_product_store_card',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    // product_id	- store_id	- contragent_card_id	- product_name	- product_price	status
    // валидации
    let {product_id, store_id, contragent_card_id, product_name, product_price, stores} = this.request.fields;
    const PSCTable = yield Table.fetch('product_store_cards', this.application.id);

    if (typeof product_name === 'object') {
      if (product_name[Config.defaultLocale]) {
        product_name = product_name[Config.defaultLocale];
      } else {
        product_name = '';
      }
    }

    if(stores && stores.constructor === Array && stores.length > 0) {
        let cards = [];
        for (let i = 0; i < stores.length; i++) {
            let store_id = stores[i];
            let FindCard = yield PSCTable.find({product_id, store_id, contragent_card_id, status: StatusesDictionary.ACTIVE}).catch((e) => ({data: null}));
            if (FindCard.data) { continue; }

            let PSCard = yield PSCTable.create({
                product_id,
                store_id,
                contragent_card_id,
                product_name,
                product_price,
                status: StatusesDictionary.ACTIVE,
            });
            cards.push(PSCard);
            // Создание записи в логе действий администраторов
            let options = {
              operationType: AdminLogData.LOG_OPERATION.CREATE,
              userId: this.user.id,
              tableName: AdminLogData.LOG_TABLE.PRODUCT_STORE_CARD,
              entityId: PSCard.id,
            };
            yield utils.createAdminLog(this.application, options);
        }
        this.body = cards;
    } else {
        let FindCard = yield PSCTable.find({product_id, store_id, contragent_card_id, status: StatusesDictionary.ACTIVE}).catch((e) => ({data: null}));
        if (FindCard.data) { throw new HttpError(400, 'Card already exists'); }

        let PSCard = yield PSCTable.create({
          product_id,
          store_id,
          contragent_card_id,
          product_name,
          product_price,
          status: StatusesDictionary.ACTIVE,
        });
        this.body = PSCard;
      // Создание записи в логе действий администраторов
      let options = {
        operationType: AdminLogData.LOG_OPERATION.CREATE,
        userId: this.user.id,
        tableName: AdminLogData.LOG_TABLE.PRODUCT_STORE_CARD,
        entityId: PSCard.id,
      };
      yield utils.createAdminLog(this.application, options);
    }

  });


router.post('/edit_product_store_card',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;
    const PSCTable = yield Table.fetch('product_store_cards', this.application.id);

    let PSCard = yield PSCTable.find(
      {
        id: fields.id,
        status: StatusesDictionary.ACTIVE,
      }
    ).catch((e) => ({data: null}));

    PSCard = PSCard.data;

    if (!PSCard) { throw new HttpError(404, 'Card not found'); }

    let logOptions = {
      operationType: AdminLogData.LOG_OPERATION.UPDATE,
      userId: this.user.id,
      tableName: AdminLogData.LOG_TABLE.PRODUCT_STORE_CARD,
      entityId: PSCard.id,
      updatedFields: yield utils.getUpdatedFields(PSCard, fields, PSCTable.db.schema),
    };

    PSCard = yield PSCard.update(fields);

    yield utils.createAdminLog(this.application, logOptions);

    this.body = PSCard;
  });

router.post('/edit_product_store_cards',
  {
    auth: true,
    appId: true,
  },
  function* () {
    const data = this.request.fields;
    if (!data) throw new HttpError(400, 'Bad request');
    let update = {};
    if (data.product_name) {
      update.product_name = data.product_name;
    }
    if (data.product_price) {
      update.product_price = data.product_price;
    }
    const PSCTable = yield Table.fetch('product_store_cards', this.application.id);
    try {
      yield PSCTable.updateMany({id: {$in: data.ids}}, update);
    } catch (e) {
      throw new HttpError(400, 'Invalid id');
    }

    this.body = {data: 'ok'};
  });


router.post('/delete_product_store_card',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id} = this.request.fields;
    if (!id) throw new HttpError(400, 'Bad request');
    const PSCTable = yield Table.fetch('product_store_cards', this.application.id);
    try {
      yield PSCTable.findOneAndUpdate({id}, {status: StatusesDictionary.DELETED});
    } catch (e) {
      throw new HttpError(400, 'Invalid id');
    }
    let logOptions = {
      operationType: AdminLogData.LOG_OPERATION.DELETE,
      userId: this.user.id,
      tableName: AdminLogData.LOG_TABLE.PRODUCT_STORE_CARD,
      entityId: {id},
    };
    yield utils.createAdminLog(this.application, logOptions);
    this.body = {data: 'ok'};
  });

router.post('/delete_product_store_cards',
  {
    auth: true,
    appId: true,
  },
  function* () {
    const {ids} = this.request.fields;
    if (!ids) throw new HttpError(400, 'Bad request');
    const PSCTable = yield Table.fetch('product_store_cards', this.application.id);
    try {
      yield PSCTable.updateMany({id: {$in: ids}}, {status: StatusesDictionary.DELETED});
    } catch (e) {
      throw new HttpError(400, 'Invalid id');
    }
    for (let id of ids) {
      let logOptions = {
        operationType: AdminLogData.LOG_OPERATION.DELETE,
        userId: this.user.id,
        tableName: AdminLogData.LOG_TABLE.PRODUCT_STORE_CARD,
        entityId: {id},
      };
      yield utils.createAdminLog(this.application, logOptions);
    }

    this.body = {data: 'ok'};
  });

router.all('/get_product_store_card',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id} = this.request.fields;
    const PSCTable = yield Table.fetch('product_store_cards', this.application.id);
    let PSCard;
    if (id) {
      PSCard = yield PSCTable.find({id}).catch((e) => ({data: null}));
      if (!PSCard.data) throw new HttpError(404, 'Card not found');
    } else {
      PSCard = yield PSCTable.findAll({id});
    }
    this.body = PSCard.data;
  });

router.post('/get_product_store_cards',
    {
        auth: true,
        access: true,
        appId: true
    },
    function* () {

        let fields = this.request.fields || this.request.query;
        let {sort, page, offset, limit, populate, select} = fields;

        let options = {populate: ['categories']};
        delete fields.sort;
        delete fields.page;
        delete fields.offset;
        delete fields.limit;
        delete fields.populate;
        delete fields.select;

        if (select) {
            options.select = select;
        }

        if (limit) {
            limit = parseInt(limit);
            page = page ? parseInt(page) : 0;
            let skip = parseInt(offset) || page * limit;
            Object.assign(options, {skip, limit});
        }

        if (sort) {
            Object.keys(sort).map((k) => sort[k] = parseInt(sort[k]));
            options.sort = sort;
        }

        if (populate) { options.populate = populate; }

        const admins = [RolesDictionary.ADMIN_SUPER, RolesDictionary.ADMIN_SECOND, RolesDictionary.ADMIN_FIRST];

        if (~admins.indexOf(this.user.role.id.toString()) && !fields.contragent_id) {
            throw new HttpError(400, 'Contragent id required');
        }

        if (this.user.role.id.toString() == RolesDictionary.CONTRAGENT) {
            fields.contragent_id = this.user.id.toString();
        }

        let contragentsTable = yield Table.fetch('contragents', this.application.id);
        let contragent = yield contragentsTable.find({user_id: fields.contragent_id, status: StatusesDictionary.ACTIVE})
            .catch((err) => ({data: null}));
        contragent = contragent.data;

        if (!contragent) { throw new HttpError(404, 'Contragent not found'); }

        let cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
        let card = yield cardsTable.find({contragent_id: fields.contragent_id, product_id: fields.product_id, status: StatusesDictionary.ACTIVE})
            .catch((err) => ({data: null}));
        card = card.data;

        if (!card) { throw new HttpError(404, 'Product card not found'); }

        let productTable = yield Table.fetch('products', this.application.id);
        let product = yield productTable.find({_id: fields.product_id}, {select: ["name","localized_name","icon", "stores"]})
            .catch((err) => ({data: null}));
        product = product.data;

        if (!product) { throw new HttpError(404, 'Product not found'); }


        let storesTable = yield Table.fetch('stores', this.application.id);
        let stores = yield storesTable.findAll({user_id: fields.contragent_id, _id : {$in: card.stores}, status: StatusesDictionary.ACTIVE}, options);
        stores = stores.data;

        let storeCardsTable = yield Table.fetch('product_store_cards', this.application.id);
        let storeCards = yield storeCardsTable.findAll({contragent_card_id: card.id, status: StatusesDictionary.ACTIVE});
        storeCards = storeCards.data;

        let busyStores = storeCards.map(v => v.store_id.toString());
        let freeStores = stores.filter(v => busyStores.indexOf(v.id.toString()) === -1);

        this.body = {
            contragent: contragent,
            card: card,
            product: product,
            stores: stores,
            freeStores : freeStores,
            count: storeCards.length,
            data: storeCards
        };
    });

module.exports = router;
