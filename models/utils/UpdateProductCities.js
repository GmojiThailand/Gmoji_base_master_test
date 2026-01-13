const Table = require('../Table');
const StatusesDictionary = require('../dictionaries/Status');
const HttpError = require('../Error');

exports.exec = function* (application, productIds) {

  const cardsTable = yield Table.fetch('product_contragent_cards', application.id);
  const productsTable = yield Table.fetch('products', application.id);

  if (!productIds.length) { throw new HttpError(400, 'Incorrect request fields'); }

  for (let i = 0; i < productIds.length; i++) {

    let productId = productIds[i];

    const cards = (yield cardsTable.findAll({
      product_id: productId,
      status: StatusesDictionary.ACTIVE
    })).data;

    let storeIds = [].concat(...cards.map((card) => card.stores));
    storeIds = [...new Set(storeIds)];

    const storesTable = yield Table.fetch('stores', application.id);
    let stores = (yield storesTable.findAll({
      id: {$in: storeIds},
      status: StatusesDictionary.ACTIVE
    }))
      .data
      .filter((store) => (store.city_dict));

    const cities = [...new Set(stores.map((store) => store.city_dict.id.toString()))];

    let result = yield productsTable.findOneAndUpdate({id: productId}, {cities: cities});

    if (!result) { throw new HttpError(400, 'Problem with product editing'); }
  }
};