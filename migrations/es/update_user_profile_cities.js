'use strict';

const co = require('co');
const Config = require('../../config/general');
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
    const cityTable = yield Table.fetch('city', appId);
    const userTable = yield Table.fetch('users', appId);

    let cities = (yield cityTable.findAll()).data;

    let cityIdByName = new Map(cities.map((city) => {
      let cityName = city.localized_name && city.localized_name[Config.defaultLocale] ? city.localized_name[Config.defaultLocale] : city.name;
      return [cityName, city.id];
    }));

    let users = (yield userTable.findAll({
      status: '598d9bac47217f28ba69e0f5',
      city: {$ne: null}
    })).data;

    let userGroupedByCity = users.reduce(
      (entryMap, e) => entryMap.set(e.city, [...entryMap.get(e.city)||[], e]),
      new Map()
    );

    let count = 0;

    for (const [city, users] of userGroupedByCity.entries()) {
      let cityId = cityIdByName.get(city);

      if (cityId) {
        yield userTable.updateMany({city: city}, {city_dict: cityId});
        count++;
      }
    }

    console.log('Count:' + count);
  } catch (error) {
    console.error(error);
    process.exit();
  }

  process.exit();
});
