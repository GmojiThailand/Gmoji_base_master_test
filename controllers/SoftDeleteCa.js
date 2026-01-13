'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const User = require('../models/User');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');
const AdminLogData = require('../models/dictionaries/AdminLogData');

const utils = require('../models/utils');

const router = new Router();

router.all('/soft_delete_ca',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (this.user.role.id != RolesDictionary.ADMIN_SUPER) {
      throw new HttpError(403, 'Only admin allowed');
    }

    if (!fields.userId) {
      throw new HttpError(400, 'Incorrect request fields');
    }

    const contragentsTable = yield Table.fetch('contragents', this.application.id);
    const storesTable = yield Table.fetch('stores', this.application.id);
    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
    const productsTable = yield Table.fetch('products', this.application.id);

    let userSys = yield User.find({id: fields.userId, role: RolesDictionary.CONTRAGENT}, {}, this.application.id);

    if (!userSys) { throw new HttpError(404, 'User not found'); }

    let contragent = yield contragentsTable.find({user_id: userSys.id})
      .catch((e) => ({data: null}));
    contragent = contragent.data;

    if (!contragent) { throw new HttpError(404, 'Contragent not found'); }

    let cards = yield cardsTable.findAll({
      contragent_id: userSys.id.toString(),
      status: StatusesDictionary.ACTIVE,
    });
    cards = cards.data;

    // Проставление "deleted" для карточек контрагента в товаре
    let productIds = [];
    if (cards.length) {
      const cardIds = cards.map((card) => card.id.toString());
      productIds = cards.map((card) => card.product_id.toString());

      // Замена на карточку Soon, если карточка контрагента была последней в товаре
      let productsWithLastCard = yield utils.checkIsLastCard(this.application, {productIds});
      let productWithLastCardIds = productsWithLastCard.map((item) => item.id.toString());

      // Поиск активных джипонов контрагента
      let haveActiveGpons = false;
      if (productWithLastCardIds.length) {
        haveActiveGpons = yield utils.checkProductActiveGpons(this.application, {productIds: productWithLastCardIds});
      }

      if (haveActiveGpons) { throw new HttpError(404, 'Contragent have active gpons'); }

      for (let i = 0; i < productWithLastCardIds.length; i++) {
        yield utils.soonContragentCreation(this.application, {productId: productWithLastCardIds[i]});
      }

      yield cardsTable.updateMany({id: {$in: cardIds}}, {status: StatusesDictionary.DELETED});

      let products = yield productsTable.findAll({
        id: {$in: productIds},
        status: StatusesDictionary.ACTIVE,
      });
      products = products.data;

      for (let i = 0; i < products.length; i++) {
        let contragents = products[i].contragent.filter((item) => (item.id.toString() != contragent.id.toString()));
        yield products[i].update({contragent: contragents});
      }
    }

    // Проставление статуса "deleted" для торговых точек контрагента
    let storesToDelete = yield storesTable.findAll({
      user_id: userSys.id.toString(),
      status: StatusesDictionary.ACTIVE,
    });
    let storesToDeleteIds = storesToDelete.data.map((storeToDelete) => storeToDelete.id.toString());

    if (storesToDeleteIds.length) {
      yield utils.softDeleteStore(this.application, this.user, {storeIds: storesToDeleteIds}, utils);
    }

    // Проставление роли "ban" для системного юзера контрагента
    userSys.role = RolesDictionary.BAN;
    yield userSys.save();

    // Проставление статуса "deleted" для профиля контрагента
    let result = yield contragent.update({status: StatusesDictionary.DELETED});

    if (productIds.length) {
      yield utils.updateProductCities(this.application, productIds);
    }

    // Создание записи в логе действий администраторов
    let options = {
      operationType: AdminLogData.LOG_OPERATION.DELETE,
      userId: this.user.id,
      tableName: AdminLogData.LOG_TABLE.CONTRAGENT,
      entityId: result.id,
    };

    yield utils.createAdminLog(this.application, options);

    this.body = result;
  });

module.exports = router;
