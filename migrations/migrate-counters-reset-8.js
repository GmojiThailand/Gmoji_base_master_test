/**
 * Единичный запуск
 * Сброс порядка сортировки категорий и товаров в категориях для drag'n'drop
 *
 * bash$ env NODE_ENV=production node migrate-counters-reset-8.js
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
    // Инициализация таблиц
    const countersTable = yield Table.fetch('counters', appId);
    const categoriesTable = yield Table.fetch('product_categories', appId);
    const usersTable = yield Table.fetch('users', appId);
    const productsTable = yield Table.fetch('products', appId);

    // Функции
    function simpleCounter(target, index) {
      return new Promise((resolve, reject) => {
        return target.update({fake_id: index + 1})
          .then(() => {
            console.log(target.id, 'Fake id set');
            resolve();
          })
          .catch((err) => {
            console.log('Reject', err);
            resolve();
          });
      });
    }

    function difficultCounter(target) {
      return new Promise((resolve, reject) => {
        let value = {};
        target.categories.map((c) => {
          value[`value.${c}`] = 1;
        });

        return countersTable.findOneAndUpdate({name: 'products'}, {$inc: value}, {new: true})
          .catch((e) => (console.error(e), {data: null}))
          .then((counter) => {
            let fakeIdObject = {};
            target.categories.map((c) => {
              if (c in counter.data.value) {
                fakeIdObject[c] = counter.data.value[c];
              }
            });
            return target.update({fake_id: fakeIdObject})
              .then(() => {
                console.log(target.id, 'difficult count done');
                resolve();
              });
          });
      });
    }

    let categoriesIds = yield categoriesTable.findAll({status: StatusesDictionary.ACTIVE}, {sort: {createdAt: 1}, id: 1});

    // Сброс всех счетчиков на 0 в таблице counters
    console.log('====DROP COUNTERS====\n');
    let value = {};
    categoriesIds.data.map((category) => {
      value[category.id] = 0;
    });
    yield countersTable.findOneAndUpdate({name: 'products'}, {value});
    yield countersTable.findOneAndUpdate({name: 'product_categories'}, {value: {main: 0}});
    yield countersTable.findOneAndUpdate({name: 'users'}, {value: {main: 0}});

    let promises;

    // Обработка счетчиков по количтеству категорий
    console.log('====UPDATE CATEGORY COUNTERS====\n');
    promises = Promise.resolve();

    yield categoriesTable.updateMany({}, {$set: {fake_id: 0}});

    let categories = yield categoriesTable.findAll({status: StatusesDictionary.ACTIVE}, {sort: {createdAt: 1}});
    categories = categories.data;

    console.log('CATEGORIES:\n', categories.map((v) => v.id.toString()));

    categories.map((category, index) => {
      promises = promises.then(() => simpleCounter(category, index));
    });

    yield promises;

    yield countersTable.findOneAndUpdate(
      {name: 'product_categories'},
      {$set: {'value.main': categories.length}},
      {new: true}
    );

    // ----------------------------------------------

    console.log('====UPDATE USER COUNTES====\n');
    promises = Promise.resolve();

    yield usersTable.updateMany({}, {$set: {fake_id: 0}});

    let users = yield usersTable.findAll({}, {sort: {createdAt: 1}});
    users = users.data;

    console.log('USERS:\n', users.map((v) => v.id.toString()));

    users.map((user, index) => {
      promises = promises.then(() => simpleCounter(user, index));
    });

    yield promises;

    yield countersTable.findOneAndUpdate(
      {name: 'users'},
      {$set: {'value.main': users.length}},
      {new: true}
    );

    // ----------------------------------------------

    console.log('====UPDATE PRODUCT COUNTES====\n');
    promises = Promise.resolve();

    yield productsTable.updateMany({}, {$set: {fake_id: {}}});
    let products = yield productsTable.findAll({status: StatusesDictionary.ACTIVE}, {sort: {createdAt: 1}});
    products = products.data;
    console.log('PRODUCTS:\n', products.map((v) => v.id.toString()));

    for (let i = 0; i < products.length; i++) {
      promises = promises.then(() => difficultCounter(products[i]));
    }
    yield promises;
  } catch (error) {
    console.error(error);
    process.exit();
  }

  process.exit();
});
