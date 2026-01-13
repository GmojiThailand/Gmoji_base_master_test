/**
 * Единичный запуск
 * Вывод контрагентов в текущих товарах products
 *
 * bash$ node check-current-contragents.js
 */
'use strict';

const appId = '587640c995ed3c0c59b14600';
const co = require('co');
require('sdk').configure({});
const Table = require('sdk').Table;
const StatusesDictionary = require('../models/dictionaries/Status');

co(function* () {
  try {
    const productTable = yield Table.fetch('products', appId);
    const cardsTable = yield Table.fetch('product_contragent_cards', appId);
    // let cashingTable = yield Table.fetch('certificate_cashing', appId);

    // let cashingHistory = yield cashingTable.findAll({});
    // cashingHistory = cashingHistory.data;

    // let cashingHistoryByProducts = {};
    // cashingHistory.map((item) => {
    //   let productId = item.product_id.toString();

    //   if (cashingHistoryByProducts[productId] == undefined) {
    //     cashingHistoryByProducts[productId] = [];
    //   }

    //   cashingHistoryByProducts[productId].push(item.contragent_id.toString());
    // });

    // console.log('Cashing Result Tree:\n', cashingHistoryByProducts);

    // Object.keys(cashingHistoryByProducts).map((key) => {
    //   cashingHistoryByProducts[key] = [...new Set(cashingHistoryByProducts[key])];
    // });

    // console.log('Cashing Result Tree Unique Set:\n', cashingHistoryByProducts);

    let products = yield productTable.findAll({status: StatusesDictionary.ACTIVE});
    products = products.data;
    let productIds = products.map((product) => product.id.toString());

    let cards = yield cardsTable.findAll({product_id: {$in: productIds}, status: StatusesDictionary.ACTIVE});
    cards = cards.data;

    let moreContragents = [];
    let moreUserIds = [];
    products.map((product) => {
      console.log('\nPRODUCT:', product.name);
      console.log(`contragent(${product.contragent.length}):\n`, product.contragent.map((v) => v.id.toString()));
      console.log(`user_id(${product.user_id.length}):\n`, product.user_id);

      let currentCards = cards.filter((card) => card.product_id.toString() == product.id.toString());
      console.log(`cards(${currentCards.length}):\n`, currentCards.map((v) => v.id.toString()));

      if (product.contragent.length > product.user_id.length) {
        moreContragents.push(`${product.name} ${product.contragent.length} > ${product.user_id.length}`);
      }

      if (product.contragent.length < product.user_id.length) {
        moreUserIds.push(`${product.name} ${product.contragent.length} < ${product.user_id.length}`);
      }
    });

    console.log('More Contragents:\n', moreContragents);
    console.log('More User Ids:\n', moreUserIds);
  } catch (error) {
    console.error(error);
    process.exit();
  }

  process.exit();
});
