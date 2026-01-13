const Table = require('../Table');
const HttpError = require('../Error');
const StatusesDictionary = require('../dictionaries/Status');

exports.exec = function* (application, {productIds} = options) {
  const productsTable = yield Table.fetch('products', application.id);
  let products = yield productsTable.findAll({
    id: {$in: productIds},
    status: StatusesDictionary.ACTIVE,
  });
  products = products.data;

  if (!products.length) { throw new HttpError(404, 'Product not found'); }

  const activeProductIds = products.map((product) => product.id.toString());

  // Подсчет количества активных карточек в товаре
  const cardsTable = yield Table.fetch('product_contragent_cards', application.id);
  let cards = yield cardsTable.findAll({
    product_id: {$in: activeProductIds},
    status: StatusesDictionary.ACTIVE,
  });
  cards = cards.data;

  let productsWithLastCard = products.filter((product) => {
    product.card_count = 0;

    cards.map((card) => {
      if (card.product_id.toString() == product.id.toString()) {
        product.card_count += 1;
      }
    });

    if (product.card_count == 1) { return product.id.toString(); }
    return false;
  });

  return productsWithLastCard;
};
