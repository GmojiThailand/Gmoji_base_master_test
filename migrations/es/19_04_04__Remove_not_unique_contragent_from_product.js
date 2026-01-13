'use strict';

const co = require('co');
require('sdk').configure({
  db: {
    mongodb: {
      host: 'localhost',
      port: '27017',
      name: 'api-factory',
    },
  },
});
const Table = require('sdk').Table;

const appId = '587640c995ed3c0c59b14600';

co(function* () {
  try {
    const productTable = yield Table.fetch('products', appId);
    let products = (yield productTable.findAll({
      status: '598d9bac47217f28ba69e0f5'
    })).data;

    for (let i = 0; i < products.length; i++) {
      let product = products[i];
      let contragents = product.contragent;
      if (contragents && contragents.length > 1) {
        yield product.update({contragent: [...new Set(contragents)]});
      }
    }
  } catch (error) {
    console.error(error);
    process.exit();
  }

  process.exit();
});
