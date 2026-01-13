/**
 * Замена на карточку Soon, если карточка контрагента была последней в товаре
 */

const Table = require('../Table');
const StatusesDictionary = require('../dictionaries/Status');

// TODO: Перенести в конфиг или выгружать из БД контрагента "Скоро"
const soonContragentId = '5ab25ed7b8c83b6d7a6391ad';
const soonContragentProfileId = '5ab25ed9b8c83b6d7a6391af';

exports.exec = function* (application, {productId} = options) {
  const cardsTable = yield Table.fetch('product_contragent_cards', application.id);

  yield cardsTable.create({
    status: StatusesDictionary.ACTIVE,
    product_id: productId,
    contragent_id: soonContragentId,
    stores: ['Soon'],
    commission_individual: 0,
    product_name_aliase: 'Скоро',
    contragent_name: 'Скоро',
  });

  const productsTable = yield Table.fetch('products', application.id);

  let product = yield productsTable.find({id: productId, status: StatusesDictionary.ACTIVE})
    .catch((e) => ({data: null}));
  product = product.data;
  product.contragent = product.contragent.map((item) => item.id.toString());

  if (product && !product.user_id.includes(soonContragentId)) {
    product.user_id.push(soonContragentId);
  }

  if (product && !product.contragent.includes(soonContragentProfileId)) {
    product.contragent.push(soonContragentProfileId);
  }

  const limitsTable = yield Table.fetch('limits', application.id);
  let limit = yield limitsTable.find({product_id: productId})
    .catch((err) => ({data: null}));
  limit = limit.data;

  if (limit) {
    yield limit.update({limit: 0});
  }

  yield product.update({
    user_id: product.user_id,
    contragent: product.contragent,
  });
};
