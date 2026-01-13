/**
 * Единичный запуск
 * Проставление поля date в записях таблицы payture_orders
 *
 * bash$ env NODE_ENV=production node migrate-cloudpayments-cashing-date.js
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

const appId = '587640c995ed3c0c59b14600';

co(function* () {
  try {
    let ordersTable = yield Table.fetch('payture_orders', appId);

    let ordersHistory = yield ordersTable.findAll({date: {$exists: false}, createdAt: {$exists: true}});
    ordersHistory = ordersHistory.data;

    let promises = Promise.resolve();

    function setDate(order) {
      console.log('ORDER:', order.createdAt, order.date);
      return new Promise((resolve, reject) => {
        return order.update({date: order.createdAt})
          .then((result) => console.log('Resolve', order.createdAt, order.date) || resolve())
          .catch((err) => console.log('Reject', err) || resolve());
      });
    }

    ordersHistory.map((order) => {
      promises = promises.then(() => setDate(order));
    });

    yield promises;
  } catch (error) {
    console.error(error);
    process.exit();
  }

  process.exit();
});
