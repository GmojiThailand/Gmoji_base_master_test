/**
 * Выгрузка списка контрагентов и соответствующих им торговых точек, привязанных к товару
 *
 * @param {string} product_id - id продукта по которму запрашиваются контрагенты
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const StatusesDictionary = require('../models/dictionaries/Status');
const utils = require('../models/utils');
const Config = require('../config/general');

const router = new Router();

router.all('/contragents_by_product',
  {
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.product_id) { throw new HttpError(400, 'Product id required!'); }

    const productTable = yield Table.fetch('products', this.application.id);

    let product = yield productTable.find({id: fields.product_id, status: StatusesDictionary.ACTIVE})
      .catch((e) => ({data: null}));
    product = product.data;

    if (!product) {
      return this.body = [];
    }

    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
    let cards = yield cardsTable.findAll({
      product_id: fields.product_id,
      status: StatusesDictionary.ACTIVE,
    });
    cards = cards.data;

    let contragentIds = [];
    let storeIds = [];
    cards.map((card) => {
      if (card.contragent_id) { contragentIds.push(card.contragent_id); }
      if (card.stores) { storeIds = storeIds.concat(card.stores); }
    });

    const storesTable = yield Table.fetch('stores', this.application.id);
    const contragentsTable = yield Table.fetch('contragents', this.application.id);

    let contragents = yield contragentsTable.findAll({
      user_id: contragentIds,
      status: StatusesDictionary.ACTIVE,
    });
    contragents = contragents.data;

    let stores = yield storesTable.findAll({
      id: {$in: storeIds},
      status: StatusesDictionary.ACTIVE,
    });
    stores = stores.data;
    stores = stores.map((store) => {
      store.city = store.city_dict ? store.city_dict.name : null;
      return store;
    });

    contragents = contragents.map((contragent) => {
      let contragentStores = [];

      stores.map((store) => {
        if (store.user_id.toString() == contragent.user_id.toString()) {
          contragentStores.push(store);
        }
      });

      contragentStores = contragentStores.map((contragentStore) => {
        contragentStore.geo = contragentStore.geo.reverse();

        return contragentStore;
      });

      contragent.stores = contragentStores;

      if (contragent.localized_name) {
        if (fields.locale && contragent.localized_name[fields.locale]) {
          contragent.name = contragent.localized_name[fields.locale];
        } else if (contragent.localized_name[Config.defaultLocale]) {
          contragent.name = contragent.localized_name[Config.defaultLocale];
        }
        delete contragent.localized_name;
      }

      return contragent;
    });

    this.body = contragents;
  });


router.all('/cities_by_product',
  {
    auth: true,
    appId: true
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.product_id) { throw new HttpError(400, 'Product id required!'); }

    const productTable = yield Table.fetch('products', this.application.id);

    let product = yield productTable.find({id: fields.product_id, status: StatusesDictionary.ACTIVE})
      .catch((e) => ({data: null}));
    product = product.data;

    if (!product) {
      return this.body = [];
    }

    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
    let cards = yield cardsTable.findAll({
      product_id: fields.product_id,
      status: StatusesDictionary.ACTIVE,
    });
    cards = cards.data;

    let contragentIds = [];
    let storeIds = [];
    cards.map((card) => {
      if (card.contragent_id) { contragentIds.push(card.contragent_id); }
      if (card.stores) { storeIds = storeIds.concat(card.stores); }
    });

    const storesTable = yield Table.fetch('stores', this.application.id);

    let stores = yield storesTable.findAll({
      id: {$in: storeIds},
      status: StatusesDictionary.ACTIVE
    }, {select: ['city'], sort: 'city'});
    stores = stores.data;

    let cities = stores.map((v) => v.city).filter((value, index, self) => self.indexOf(value) === index);

    let result = {cities: cities};

    if(fields.city && cities.indexOf(fields.city) >= 0) {
      let options = yield utils.getOptions(fields);
      options.sort = 'city street building';
      let stores = yield storesTable.findAll({
        id: {$in: storeIds},
        status: StatusesDictionary.ACTIVE,
        city: fields.city
      }, options);
      result.stores = stores.data.map((store) => {
        store.geo = store.geo.reverse();
        return store;
      });
    }

    this.body = result;
  });

router.all('/points_by_product',
  {
    auth: true,
    appId: true
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.product_id) { throw new HttpError(400, 'Product id required!'); }

    const productTable = yield Table.fetch('products', this.application.id);

    let product = yield productTable.find({id: fields.product_id, status: StatusesDictionary.ACTIVE})
      .catch((e) => ({data: null}));
    product = product.data;

    if (!product) {
      return this.body = [];
    }

    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
    let cards = yield cardsTable.findAll({
      product_id: fields.product_id,
      status: StatusesDictionary.ACTIVE,
    });
    cards = cards.data;

    let storeIds = [];
    cards.map((card) => {
      if (card.stores) { storeIds = storeIds.concat(card.stores); }
    });

    const storesTable = yield Table.fetch('stores', this.application.id);


    let filter = {
      id: {$in: storeIds},
      status: StatusesDictionary.ACTIVE
    };
    let options = yield utils.getOptions(fields);
    options.sort = 'name street building';

    if(fields.city) {
      const cityTable = yield Table.fetch('city', this.application.id);
      let city = yield cityTable.find({
        name: fields.city
      }).catch((e) => ({data: null}));
      city = city.data;
      if(city) {
        filter.city_dict = city.id;
      }
    }
    let stores = yield storesTable.findAll(filter, options);

    yield processStores(stores, fields.locale, this.application.id);

    this.body = stores.data.map((store) => {
      store.geo = store.geo.reverse();
      store.city = store.city_dict ? store.city_dict.name : null;
      return store;
    });
  });

router.all('/map_points_by_product',
  {
    auth: true,
    appId: true
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.product_id) { throw new HttpError(400, 'Product id required!'); }
    if (!fields.min_lat) { throw new HttpError(400, 'min_lat required!'); }
    if (!fields.max_lat) { throw new HttpError(400, 'max_lat required!'); }
    if (!fields.min_lng) { throw new HttpError(400, 'min_lng required!'); }
    if (!fields.max_lng) { throw new HttpError(400, 'max_lng required!'); }

    const productTable = yield Table.fetch('products', this.application.id);

    let product = yield productTable.find({id: fields.product_id, status: StatusesDictionary.ACTIVE})
      .catch((e) => ({data: null}));
    product = product.data;

    if (!product) {
      return this.body = [];
    }

    const cardsTable = yield Table.fetch('product_contragent_cards', this.application.id);
    let cards = yield cardsTable.findAll({
      product_id: fields.product_id,
      status: StatusesDictionary.ACTIVE
    });
    cards = cards.data;

    let storeIds = [];
    cards.map((card) => {
      if (card.stores) { storeIds = storeIds.concat(card.stores); }
    });

    const storesTable = yield Table.fetch('stores', this.application.id);

    let filter = {
      id: {$in: storeIds},
      status: StatusesDictionary.ACTIVE,
      geo: { $geoWithin: { $box:  [ [ fields.min_lng, fields.min_lat ], [ fields.max_lng, fields.max_lat ] ] } }
    };
    let options = yield utils.getOptions(fields);
    options.sort = 'name city street building';

    let stores = yield storesTable.findAll(filter, options);

    yield processStores(stores, fields.locale,  this.application.id);

    this.body = stores.data.map((store) => {
      store.geo = store.geo.reverse();
      return store;
    });
  });

function* processStores(stores, locale, applicationId) {
  stores = stores.data;

  for (let i = 0; i < stores.length; i++) {
    let store = stores[i];
    if (store.localized_name) {
      if (locale && store.localized_name[locale]) {
        store.name = store.localized_name[locale];
      } else if (store.localized_name[Config.defaultLocale]) {
        store.name = store.localized_name[Config.defaultLocale];
      }
      delete store.localized_name;
    }
    if (store.localized_street) {
      if (locale && store.localized_street[locale]) {
        store.street = store.localized_street[locale];
      } else if (store.localized_street[Config.defaultLocale]) {
        store.street = store.localized_street[Config.defaultLocale];
      }
      delete store.localized_street;
    }
    if (store.subway_stations && store.subway_stations.length > 0) {
      const subwayStationTable = yield Table.fetch('subway_station', applicationId);
      for (let i = 0; i < store.subway_stations.length; i++) {
        let subwayStation = store.subway_stations[i];
        let station = (yield subwayStationTable.find(
          {id: subwayStation.station},
          {select: ['name', 'color', 'localized_name']})
        ).data;
        subwayStation.name = station.name;
        if (station.localized_name) {
          if (locale && station.localized_name[locale]) {
            subwayStation.name = station.localized_name[locale];
          } else if (station.localized_name[Config.defaultLocale]) {
            subwayStation.name = station.localized_name[Config.defaultLocale];
          }
          delete store.localized_name;
        }
        subwayStation.color = station.color;
        delete subwayStation.station;
      }
    }
  }
}

module.exports = router;
