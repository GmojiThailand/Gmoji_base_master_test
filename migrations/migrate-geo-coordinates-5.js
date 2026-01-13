/**
 * Единичный запуск
 * Конвертация гео-координат stores
 *
 * bash$ env NODE_ENV=production node migrate-geo-coordinates.js
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
    let storeTable = yield Table.fetch('stores', appId);

    let stores = yield storeTable.findAll({status: '598d9bac47217f28ba69e0f5'});
    stores = stores.data;

    let promises = Promise.resolve();

    function setGeo(store) {
      console.log('GEO ARRAY:', store.name, store.geo);
      return new Promise((resolve, reject) => {
        return store.update({geo: store.geo.reverse()})
          .then((result) => console.log('Resolve', store.name, store.geo) || resolve())
          .catch((err) => console.log('Reject', err) || resolve());
      });
    }

    stores.map((store) => {
      promises = promises.then(() => setGeo(store));
    });

    yield promises;
  } catch (error) {
    console.error(error);
    process.exit();
  }

  process.exit();
});
