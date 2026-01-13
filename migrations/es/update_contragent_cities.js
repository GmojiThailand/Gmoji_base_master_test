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
    let cityMap = new Map([
      ['МО', 'Московская обл'],
      ['г. Екатеринбург', 'Екатеринбург'],
      ['Орел', 'Орёл'],
      ['Адлер', 'Сочи'],
      ['Шереметьево', 'Москва'],
      ['Путилково', 'Москва'],
      ['Железнодорожный', 'Балашиха'],
      ['Ленинский', 'Екатеринбург'],
      ['Федяково', 'Нижний Новгород'],
      ['Ржавки', 'Солнечногорск'],
      ['Солнечный', 'Видное'],
      ['Кудрово', 'Санкт-Петербург'],
      ['Кудрово', 'Санкт-Петербург'],
      ['Осиново', 'Зеленодольск'],
      ['п. Искателей', 'Нарьян-Мар']
    ]);

    const cityTable = yield Table.fetch('city', appId);
    const contragentsTable = yield Table.fetch('contragents', appId);

    let cities = (yield cityTable.findAll()).data;

    let cityIdByName = new Map(cities.map((city) => [city.name, city.id]));

    // Update fact_city
    let contragents = (yield contragentsTable.findAll({
      status: '598d9bac47217f28ba69e0f5',
      /* city_dict: null,*/
      fact_city: {$ne: null}
    })).data;

    let contragentGroupedByCity = contragents.reduce(
      (entryMap, e) => entryMap.set(e.fact_city, [...entryMap.get(e.fact_city)||[], e]),
      new Map()
    );

    let count = 0;

    for (const [city, contragents] of contragentGroupedByCity.entries()) {
      let cityName = cityMap.get(city) ? cityMap.get(city) : city;
      let cityId = cityIdByName.get(cityName);

      if (cityId) {
        yield contragentsTable.updateMany({fact_city: city}, {fact_city_dict: cityId});
        count++;
      }
    }

    console.log('Fact count:' + count);

    // Update law_city
    contragents = (yield contragentsTable.findAll({
      status: '598d9bac47217f28ba69e0f5',
      /* city_dict: null,*/
      law_city: {$ne: null}
    })).data;

    contragentGroupedByCity = contragents.reduce(
      (entryMap, e) => entryMap.set(e.law_city, [...entryMap.get(e.law_city)||[], e]),
      new Map()
    );

    count = 0;

    for (const [city, contragents] of contragentGroupedByCity.entries()) {
      let cityName = cityMap.get(city) ? cityMap.get(city) : city;
      let cityId = cityIdByName.get(cityName);

      if (cityId) {
        yield contragentsTable.updateMany({law_city: city}, {law_city_dict: cityId});
        count++;
      } else {
        console.log(city);
      }
    }

    console.log('Law count:' + count);

  } catch (error) {
    console.error(error);
    process.exit();
  }

  process.exit();
});
