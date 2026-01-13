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

  const activeProductIds = products.map((product) => product.id);

  const certificatesTable = yield Table.fetch('certificates', application.id);
  let certificates = yield certificatesTable.findAll({
    product: {$in: activeProductIds},
    status: StatusesDictionary.ACTIVE,
  });
  certificates = certificates.data;

  if (certificates.length) { return true; }

  return false;
};
