'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');

const router = new Router();

router.all('/product_list_with_certificate_count',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    try {
      let productsTable = yield Table.fetch('products', this.application.id);
      let products = yield productsTable.findAll();
      let certificatesTable = yield Table.fetch('certificates', this.application.id);

      // TODO: Переделать цикл запросов
      products.data = yield products.data.map(function* (product) {
        let certificates = yield certificatesTable.findAll({product: product.id});
        product = Object.assign(product, {certificates_count: certificates.data.length});
        return product;
      });

      this.body = products;
    } catch (error) {
      this.body = new HttpError(error.stack);
    }
  });

module.exports = router;
