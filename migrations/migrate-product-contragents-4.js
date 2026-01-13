/**
 * Единичный запуск
 * Синхронизация актуальных КА продукта в таблице products
 *
 * bash$ env NODE_ENV=production node migrate-product-contragents.js
 */
'use strict';

const co = require('co');
require('sdk').configure({
  db: {
    mongodb: {
      host: 'localhost',
      port: '27017',
      name: 'api-factory',
      // username: 'api-factory',
      // password: 'MinerVA20022016',
      // authSource: 'admin',
    },
  },
});
const Table = require('sdk').Table;
const StatusesDictionary = require('../models/dictionaries/Status');

const appId = '587640c995ed3c0c59b14600';

co(function* () {
  try {
    let productsTable = yield Table.fetch('products', appId);
    let cardsTable = yield Table.fetch('product_contragent_cards', appId);
    let contragentsTable = yield Table.fetch('contragents', appId);

    let products = yield productsTable.findAll({});
    products = products.data;
    let productIds = products.map((product) => product.id.toString());

    let cards = yield cardsTable.findAll({
      product_id: {$in: productIds},
      status: StatusesDictionary.ACTIVE,
    });
    cards = cards.data;
    let contragentIds = cards.map((card) => card.contragent_id.toString());

    let contragents = yield contragentsTable.findAll({
      user_id: {$in: contragentIds},
      status: StatusesDictionary.ACTIVE,
    });
    contragents = contragents.data;

    let promises = Promise.resolve();

    function setContragents(product) {
      let currentProductContragents = product.contragent &&
          product.contragent.map((contragent) => (`${contragent.name} - ${contragent.id}`));
      console.log(`${product.name} OLD CONTRAGENT ARRAY:\n`, currentProductContragents);
      return new Promise((resolve, reject) => {
        let productContragents = [];
        let productContragentUserIds = [];
        let productCards = cards.filter((card) => (card.product_id.toString() == product.id.toString()));
        let userIds = productCards.map((card) => card.contragent_id.toString());
        console.log(`${product.name} USER IDS:\n`, userIds);

        contragents.map((contragent) => {
          userIds.map((userId) => {
            console.log(contragent.user_id, userId, userId == contragent.user_id ? '\u2611' : '\u2612');
            if (userId == contragent.user_id) {
              productContragents.push(contragent.id.toString());
              productContragentUserIds.push(contragent.user_id.toString());
            }
          });
        });

        return product.update({contragent: productContragents, user_id: productContragentUserIds})
          .then((result) => console.log(`${product.name} NEW CONTRAGENT ARRAY:\n`, product.contragent) || resolve())
          .catch((err) => console.log('reject', err) || resolve());
      });
    }

    products.map((product) => {
      promises = promises.then(() => setContragents(product));
    });

    yield promises;
  } catch (error) {
    console.error(error);
    process.exit();
  }

  process.exit();
});
