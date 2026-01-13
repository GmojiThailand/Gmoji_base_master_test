/**
 * Единичный запуск
 * Объединение контрагентов Скоро в системного
 *
 * bash$ env NODE_ENV=production node migrate-soon-contractor.js
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
const soonContragentId = '5ab25ed7b8c83b6d7a6391ad';

co(function* () {
  try {
    function setSoonCard(productId) {
      return {
        status: StatusesDictionary.ACTIVE,
        product_id: productId,
        contragent_id: soonContragentId,
        stores: ['Soon'],
        commission_individual: 0,
        product_name_aliase: 'Скоро',
        contragent_name: 'Скоро',
      };
    }

    let contragentTable = yield Table.fetch('contragents', appId);
    let soonContragents = yield contragentTable.findAll({
      user_id: {$ne: soonContragentId},
      name: {$regex: 'Скоро', $options: 'i'},
      status: '598d9bac47217f28ba69e0f5',
    });
    soonContragents = soonContragents.data;
    console.log('OLD SOON CONTRAGENTS:\n', soonContragents);

    let soonContragentIds = soonContragents.map((item) => item.user_id.toString());

    let cardTable = yield Table.fetch('product_contragent_cards', appId);
    let currentCards = yield cardTable.findAll({
      contragent_id: {$in: soonContragentIds},
      status: StatusesDictionary.ACTIVE,
    });
    currentCards = currentCards.data;
    console.log('CURRENT SOON CONTRAGENT CARDS:\n', currentCards);

    let currentCardIds = [];
    let currentCardProductIds = [];
    currentCards.map((card) => {
      currentCardIds.push(card.id.toString());
      currentCardProductIds.push(card.product_id.toString());
    });

    yield cardTable.updateMany(
      {
        id: {$in: currentCardIds},
        status: StatusesDictionary.ACTIVE,
      },
      {status: StatusesDictionary.DELETED}
    );

    let newCards = [];
    currentCardProductIds.map((productId) => {
      let newCard = setSoonCard(productId);
      newCards.push(newCard);
    });
    console.log('NEW SOON CONTRAGENT CARDS:\n', newCards);

    yield cardTable.insertMany(newCards);
  } catch (error) {
    console.error(error);
    process.exit();
  }

  process.exit();
});
