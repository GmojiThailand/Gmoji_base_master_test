/**
 * Выгрузка данных о торговой точке
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const User = require('../models/User');
const HttpError = require('../models/Error');
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.all('/get_store',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    const storesTable = yield Table.fetch('stores', this.application.id);
    let store = yield storesTable.find(
      {
        id: fields.id,
        status: StatusesDictionary.ACTIVE,
      },
      {populate: ['subcontragent']}
    )
      .catch((e) => ({data: null}));
    store = store.data;

    if (!store.subcontragent) { throw new HttpError(404, 'Subcontragent not found'); }

    const subcontragentsTable = yield Table.fetch('subcontragents', this.application.id);
    let subcontragent = yield subcontragentsTable.find({
      id: store.subcontragent.id.toString(),
      status: StatusesDictionary.ACTIVE,
    })
      .catch((e) => ({data: null}));
    subcontragent = subcontragent.data;

    if (!subcontragent) { throw new HttpError(404, 'Subcontragent not found'); }

    let userSys = yield User.find(
      {
        id: subcontragent.user_id,
        role: RolesDictionary.SUB_CONTRAGENT,
      },
      {},
      this.application.id
    );

    if (!userSys) { throw new HttpError(404, 'User not found'); }

    store.subcontragent.login = userSys.username;

    if (fields.out !== 'native' && store.subway_stations && store.subway_stations.length > 0) {
      const subwayStationTable = yield Table.fetch('subway_station', this.application.id);
      for (let i = 0; i < store.subway_stations.length; i++) {
        store.subway_stations[i].station = (yield subwayStationTable.find(
          {id: store.subway_stations[i].station},
          {select: ['name', 'color', 'localized_name']})
        ).data;
      }
    }

    this.body = store;
  });

module.exports = router;
