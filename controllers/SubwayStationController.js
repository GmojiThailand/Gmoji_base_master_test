'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const StatusesDictionary = require('../models/dictionaries/Status')

const router = new Router();

router.post('/create_subway_station',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {localized_name, name, city_dict, color} = this.request.fields;
    if (!city_dict) throw new HttpError(400, 'Bad request');
    const subwayStationTable = yield Table.fetch('subway_station', this.application.id);
    let subwayStation = yield subwayStationTable.create({localized_name, name, city_dict, color, status: StatusesDictionary.ACTIVE});
    this.body = subwayStation;
  });

router.post('/edit_subway_station',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const data = this.request.fields;
    if (!data.id) throw new HttpError(400, 'Bad request');
    const subwayStationTable = yield Table.fetch('subway_station', this.application.id);
    let station;
    try {
      station = yield subwayStationTable.findOneAndUpdate({
        id: data.id,
        status: StatusesDictionary.ACTIVE
      }, data, {new: true});
    } catch (e) {
      throw new HttpError(404, 'Station not found');
    }

    this.body = station.data;
  });

router.all('/get_subway_station',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id} = this.request.fields || this.request.query;
    if (!id) throw new HttpError(400, 'Bad request');
    const subwayStationTable = yield Table.fetch('subway_station', this.application.id);
    let station = yield subwayStationTable.find({id, status: StatusesDictionary.ACTIVE}).catch((e) => ({data: null}));
    if (!station.data) {
      throw new HttpError(404, 'Station not found');
    }
    this.body = station.data;
  });

router.all('/get_all_subway_stations',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {city_dict} = this.request.fields || this.request.query;
    let filter = {status: StatusesDictionary.ACTIVE};
    if (city_dict) {
      filter.city_dict = city_dict;
    }
    const subwayStationTable = yield Table.fetch('subway_station', this.application.id);
    let stations = yield subwayStationTable.findAll(filter).catch((e) => ({data: null}));
    if (!stations.data) {
      throw new HttpError(404, 'Stations not found');
    }
    this.body = stations.data;
  });

router.post('/delete_subway_station',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const {id} = this.request.fields;
    if (!id) throw new HttpError(400, 'Bad request');
    try {
      const subwayStationTable = yield Table.fetch('subway_station', this.application.id);
      yield subwayStationTable.remove({id});
    } catch (e) {
      throw new HttpError(400, 'Cant delete station');
    }
    this.body = {data: 'ok'};
  });


module.exports = router;
