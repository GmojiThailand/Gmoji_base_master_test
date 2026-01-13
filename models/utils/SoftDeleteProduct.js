'use strict';

const HttpError = require('../Error');
const Table = require('../Table');
const RolesDictionary = require('../dictionaries/Role');
const StatusesDictionary = require('../dictionaries/Status');
const CheckProductActiveGpons = require('./CheckProductActiveGpons');
const AdminLogData = require('../dictionaries/AdminLogData');

// TODO: Переделать на запрос к БД выбор id категории топ
const topCategoryId = '58e5f191d351f81cc3fa6a0a';

exports.exec = function* (application, user, {productIds} = options, utils) {
  if (!productIds || !productIds.length) { throw new HttpError(400, 'Product id required'); }

  let productsTable = yield Table.fetch('products', application.id);
  let cardsTable = yield Table.fetch('product_contragent_cards', application.id);

  let products = yield productsTable.findAll({id: {$in: productIds}, status: StatusesDictionary.ACTIVE});
  products = products.data;

  const activeProductIds = products.map((product) => product.id);
  const deletedProductIds = activeProductIds.map((productId) => productId.toString());

  // Проверка принадлежности товара только контрагенту, совершающему удаление
  if (user.role.id == RolesDictionary.CONTRAGENT) {
    for (let i = 0; i < activeProductIds.length; i++) {
      let otherCards = yield cardsTable.findAll({
        product_id: activeProductIds[i],
        status: StatusesDictionary.ACTIVE,
        contragent: {$ne: user.id.toString()},
      });
      otherCards = otherCards.data;

      if (otherCards && otherCards.length > 1) {
        throw new HttpError(403, 'Contragent delete product forbidden');
      }
    }
  }

  if (!activeProductIds.length) { throw new HttpError(404, 'Product not found'); }

  // Поиск активных джипонов продукта
  const haveActiveGpons = yield CheckProductActiveGpons.exec(application, {productIds: activeProductIds});
  if (haveActiveGpons) { throw new HttpError(403, 'Active gpons found'); }

  // Проставление статуса "deleted" для товаров
  let productsWithoutGpons = yield productsTable.findAll({id: {$in: activeProductIds}});
  productsWithoutGpons = productsWithoutGpons.data;
  const productWithoutGponIds = productsWithoutGpons.map((productWithoutGpons) => productWithoutGpons.id);

  let result = [];

  // Пересчет счетчиков в категориях которым принадлежал товар(ы)

  // минус в основном счетчике продукта по категориям
  let categoriesCount = {};
  productsWithoutGpons.map((prod) => {
    prod.categories.map((ctg) => {
      categoriesCount[`value.${ctg}`] = categoriesCount[ctg] ? categoriesCount[ctg] - 1 : -1;
    });
  });
  const countersTable = yield Table.fetch('counters', application.id);
  yield countersTable.findOneAndUpdate(
    {name: 'products'},
    {$inc: categoriesCount},
    {new: true}
  );

  // TODO: Переработать map, для устранения параллельных запросов
  yield productsWithoutGpons.map(function* (productWithoutGpons) {
    let topIndex = productWithoutGpons.categories.findIndex((category) => {
      return category.id.toString() == topCategoryId;
    });

    if (~topIndex) { productWithoutGpons.categories.splice(topIndex, 1); }

    let updated = yield productWithoutGpons.update({
      status: StatusesDictionary.DELETED,
      categories: productWithoutGpons.categories,
    });

    // Создание записи в логе действий администраторов
    let logOptions = {
      operationType: AdminLogData.LOG_OPERATION.DELETE,
      userId: user.id,
      tableName: AdminLogData.LOG_TABLE.PRODUCT,
      entityId: deletedProductIds.join(', '),
    };

    yield utils.createAdminLog(application, logOptions);

    // поднятие продуктов что ниже находились
    let findOptions = {
      $or: [],
      status: StatusesDictionary.ACTIVE,
    };
    let updateOptions = {};
    productWithoutGpons.categories.map((ctg) => {
      let obj = {};
      obj[`fake_id.${ctg}`] = {$gt: productWithoutGpons.fake_id[ctg]};
      findOptions.$or.push(obj);

      updateOptions[`fake_id.${ctg}`] = -1;
    });
    yield productsTable.updateMany(
      findOptions,
      {$inc: updateOptions}
    );

    result.push(updated);
  });


  // Проставление статуса "deleted" для купонов на товары
  const couponsTable = yield Table.fetch('coupons', application.id);
  yield couponsTable.updateMany(
    {
      product: {$in: productWithoutGponIds},
      status: StatusesDictionary.ACTIVE,
    },
    {status: StatusesDictionary.DELETED}
  );

  // Проставление статуса "deleted" для карточек контрагентов из товара
  yield cardsTable.updateMany(
    {
      product_id: {$in: productWithoutGponIds},
      status: StatusesDictionary.ACTIVE,
    },
    {status: StatusesDictionary.DELETED}
  );

  return result;
};
