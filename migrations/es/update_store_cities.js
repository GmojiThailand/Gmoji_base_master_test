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
    const cardsTable = yield Table.fetch('product_contragent_cards', appId);
    const productsTable = yield Table.fetch('products', appId);

    let cities = (yield cityTable.findAll()).data;

    let cityIdByName = new Map(cities.map((city) => [city.name, city.id]));

    let storesTable = yield Table.fetch('stores', appId);

    let stores = (yield storesTable.findAll({
      status: '598d9bac47217f28ba69e0f5',
      /* city_dict: null,*/
      city: {$ne: null}
    })).data;

    const storeGroupedByCity = stores.reduce(
      (entryMap, e) => entryMap.set(e.city, [...entryMap.get(e.city)||[], e]),
      new Map()
    );

    for (const [city, stores] of storeGroupedByCity.entries()) {
      let cityName = cityMap.get(city) ? cityMap.get(city) : city;
      let cityId = cityIdByName.get(cityName);

      if (cityId) {
        let productIds = new Set();
        for (let i = 0; i < stores.length; i++) {
          let store = stores[i];

          yield store.update({city_dict: cityId});

          (yield cardsTable.findAll({
            stores: store.id,
            status: '598d9bac47217f28ba69e0f5'
          }))
            .data
            .map((card) => card.product_id)
            .forEach((productId) => productIds.add(productId));
        }
        yield productsTable.updateMany({id: {$in: [...productIds]}}, {$addToSet: {cities: cityId}});
      }
    }

  } catch (error) {
    console.error(error);
    process.exit();
  }

  process.exit();
});
