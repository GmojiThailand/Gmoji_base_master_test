
/**
 * единичный запуск
 * обнулить счетчик в таблице counters
 * bash$ env NODE_ENV=production node create_entity_id.js
 */
'use strict';

const appId = '587640c995ed3c0c59b14600';
const co = require('co');
require('sdk').configure({});
const Table = require('sdk').Table;

co(function* () {
  try {
    let categoriesTable = yield Table.fetch('product_categories', appId);
    let countersTable = yield Table.fetch('counters', appId);

    categoriesTable.updateMany({}, {fake_id: 0});
    let categories = yield categoriesTable.findAll({status: '598d9bac47217f28ba69e0f5'}, {sort: {createdAt: 1}});
    yield categories.data.map(function* (category) {
      let counter = yield countersTable.findOneAndUpdate({name: 'product_categories'}, {$inc: {value: 1}}, {new: true})
        .catch((e) => (console.error(e), {data: null}));
      return category.update({fake_id: counter.data.value});
    });
  } catch (error) {
    console.error(error);
  }

  process.exit();
});

