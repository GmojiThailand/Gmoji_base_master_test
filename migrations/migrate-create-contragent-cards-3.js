/**
 * Единичный запуск
 * Создание карточек контрагентов в текущих товарах products
 *
 * bash$ node create-contragent-cards.js
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
    const productTable = yield Table.fetch('products', appId);
    const cardsTable = yield Table.fetch('product_contragent_cards', appId);
    const contragentsTable = yield Table.fetch('contragents', appId);
    const storesTable = yield Table.fetch('stores', appId);

    let products = yield productTable.findAll({status: StatusesDictionary.ACTIVE}, {populate: []});
    products = products.data;

    let contragentUserIds = [];
    products.map((product) => {
      contragentUserIds = contragentUserIds.concat(product.user_id);
    });

    // console.log('Row user_id Concat:\n', contragentUserIds);

    contragentUserIds = [...new Set(contragentUserIds)];

    // console.log('Unique user_id Array:\n', contragentUserIds);

    let contragents = yield contragentsTable.findAll({
      user_id: {$in: contragentUserIds},
      status: StatusesDictionary.ACTIVE,
    });
    contragents = contragents.data;

    let stores = yield storesTable.findAll({
      user_id: {$in: contragentUserIds},
      status: StatusesDictionary.ACTIVE,
    });
    stores = stores.data;

    let totalProducts = products.length;
    let totalContragents = contragents.length;
    let TotalCardsCreated = 0;
    let TotalPossibleCardsWithZeroStores = 0;

    // Создание карточек контрагента
    let newCards = [];
    products.map((product) => {
      console.log('\nPRODUCT:', product.name);

      product.user_id.map((userId) => {
        let currentContragent = {};
        contragents.map((contragent) => {
          if (contragent.user_id == userId) {
            currentContragent = contragent;
          }
        });

        let currentStores = stores.filter((store) => {
          if (store.user_id == userId) {
            return true;
          } else {
            return false;
          }
        });

        if (currentStores.length) {
          TotalCardsCreated++;

          let newCard = {
            status: StatusesDictionary.ACTIVE,
            contragent_name: currentContragent.name || '$empty',
            product_name_aliase: product.name,
            contragent_id: userId,
            stores: currentStores,
            commission_individual: -1,
            product_id: product.id.toString(),
          };

          newCards.push(newCard);
        } else {
          TotalPossibleCardsWithZeroStores++;
        }
      });
    });


    console.log('\n=============================================================');
    console.log('Total Active Products:', totalProducts);
    console.log('Total Active Contragents:', totalContragents);
    console.log('Total Possible Cards Created:', TotalCardsCreated);
    console.log('Total Possible Cards With Zero Stores:', TotalPossibleCardsWithZeroStores);

    yield cardsTable.insertMany(newCards);
  } catch (error) {
    console.error(error);
    process.exit();
  }

  process.exit();
});
