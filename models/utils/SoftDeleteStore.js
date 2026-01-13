/**
 * @param storeIds {..string} - список id торговых точек одного контрагента в рамках одной карточки в товаре
 */
const Table = require('../Table');
const User = require('../User');
const HttpError = require('../Error');
const StatusesDictionary = require('../dictionaries/Status');
const RolesDictionary = require('../dictionaries/Role');
const AdminLogData = require('../dictionaries/AdminLogData');
const CheckProductActiveGpons = require('./CheckProductActiveGpons');
const SoonContragentCreation = require('./SoonContragentCreation');

exports.exec = function* (application, user, {storeIds} = options, utils) {
  if (!storeIds || !storeIds.length) { throw new HttpError(400, 'Store id required'); }

  let storesTable = yield Table.fetch('stores', application.id);
  let productsTable = yield Table.fetch('products', application.id);
  let subcontragentsTable = yield Table.fetch('subcontragents', application.id);
  let cardsTable = yield Table.fetch('product_contragent_cards', application.id);

  // Проверка можно ли удалять торговые точки
  let cards = yield cardsTable.findAll({
    stores: {$in: storeIds},
    status: StatusesDictionary.ACTIVE,
  });
  cards = cards.data;
  const cardProductIds = cards.map((card) => card.product_id.toString());

  let productCards = yield cardsTable.findAll({
    product_id: {$in: cardProductIds},
    status: StatusesDictionary.ACTIVE,
  });
  productCards = productCards.data;

  let products = yield productsTable.findAll({
    id: {$in: cardProductIds},
    status: StatusesDictionary.ACTIVE,
  });
  products = products.data;

  products = products.map((product) => {
    product.cards = [];
    product.cards_count = 0;

    productCards.map((productCard) => {
      if (productCard.product_id.toString() == product.id.toString()) {
        product.cards.push(productCard);
        product.cards_count += 1;
      }
    });

    return product;
  });

  let soloCards = products.filter((product) => {
    if (product.cards.length > 1 && product.cards_count > 1) { return false; }

    return product;
  });

  soloCards = soloCards.map((soloCard) => soloCard.cards[0]);

  function* checkCard(soloCard) {
    let cardStores = soloCard.stores.filter((store) => {
      if (~storeIds.indexOf(store.toString())) { return false; }
      return store;
    });

    if (!cardStores.length) {
      const haveActiveGpons = yield CheckProductActiveGpons.exec(
        application,
        {productIds: [soloCard.product_id.toString()]}
      );

      if (haveActiveGpons) {
        flag = true;
      }
    }
  }

  let flag = false;
  yield soloCards.map(checkCard);

  if (flag) {
    throw new HttpError(403, 'Active gpons found');
  }

  // Проставление статуса "deleted" для торговых точек контрагента
  yield storesTable.updateMany(
    {
      id: {$in: storeIds},
      status: StatusesDictionary.ACTIVE,
    },
    {status: StatusesDictionary.DELETED}
  );

  let deletedStores = yield storesTable.findAll({
    id: {$in: storeIds},
    status: StatusesDictionary.DELETED,
  });
  deletedStores = deletedStores.data;
  const deletedStoreIds = deletedStores.map((deletedStore) => deletedStore.id.toString());
  let subcontragentIds = deletedStores.map((deletedStore) => deletedStore.subcontragent.toString());
  const contragentUserId = deletedStores[0].user_id;

  // Проставление статуса "deleted" для профилей представителей контрагента
  yield subcontragentsTable.updateMany(
    {
      id: {$in: subcontragentIds},
      status: StatusesDictionary.ACTIVE,
    },
    {status: StatusesDictionary.DELETED}
  );

  let deletedSubcontragents = yield subcontragentsTable.findAll({
    id: {$in: subcontragentIds},
    status: StatusesDictionary.DELETED,
  });
  deletedSubcontragents = deletedSubcontragents.data;
  const userSysIds = deletedSubcontragents.map((deletedSubcontragent) => deletedSubcontragent.user_id.toString());

  // Проставление роли "ban" для системных юзеров представителей контрагента
  // TODO: Создать для User updateMany, findOneAndUpdate, insertMany в sdk
  for (let i = 0; i < userSysIds.length; i++) {
    try {
      let userSys = yield User.find(
        {
          id: userSysIds[i],
          role: RolesDictionary.SUB_CONTRAGENT,
        },
        {},
        application.id
      );

      userSys.role = RolesDictionary.BAN;
      yield userSys.save();
    } catch (error) {
      console.error(error);
    }
  }

  // Удаление из массива торговых точек карточки контрагента в товаре текущих удаленных торговых точек.
  // Если массив оказался пустым, то подставляется карточка контрагента "Скоро"
  cards = yield cardsTable.findAll({
    stores: {$in: deletedStoreIds},
    status: StatusesDictionary.ACTIVE,
  });
  cards = cards.data;

  for (let i = 0; i < cards.length; i++) {
    let cardStores = cards[i].stores.filter((store) => {
      if (~deletedStoreIds.indexOf(store.toString())) { return false; }
      return store;
    });

    try {
      if (cardStores.length) {
        yield cards[i].update({stores: cardStores});
      } else {
        yield cards[i].update({status: StatusesDictionary.DELETED});
        let currentProductId = cards[i].product_id.toString();
        let currentProduct;

        products.map((product) => {
          if (product.id.toString() == currentProductId) {
            currentProduct = product;
          }
        });

        if (currentProduct) {
          currentProduct.contragent = currentProduct.contragent.filter((item) => {
            if (item.user_id == contragentUserId) {
              return false;
            }

            return true;
          });

          currentProduct.user_id = currentProduct.user_id.filter((item) => {
            if (item == contragentUserId) {
              return false;
            }

            return true;
          });
        }

        yield currentProduct.update(currentProduct);

        let cardsCount = yield cardsTable.findAll({
          product_id: cards[i].product_id.toString(),
          status: StatusesDictionary.ACTIVE,
        });
        cardsCount = cardsCount.data.length;

        // Замена на карточку Soon, если карточка контрагента была последней в товаре
        if (!cardsCount) {
          yield SoonContragentCreation.exec(application, {productId: currentProductId});
        }
      }

      yield utils.updateProductCities(application, [cards[i].product_id]);
    } catch (error) {
      console.error(error);
    }
  }

  // Создание записи в логе действий администраторов
  let options = {
    operationType: AdminLogData.LOG_OPERATION.DELETE,
    userId: user.id,
    tableName: AdminLogData.LOG_TABLE.STORES,
    entityId: deletedStoreIds.join(', '),
  };

  yield utils.createAdminLog(application, options);

  return deletedStores;
};
