/**
 * Выгрузка списка торговых точек контрагента по его id
 *
 * @param {string} contragent_id - id контрагента
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.all('/contragent_card_stores',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.contragent_id) { throw new HttpError(400, 'Contragent id required'); }

    const storesTable = yield Table.fetch('stores', this.application.id);
    const contragentStores = yield storesTable.findAll({
      user_id: fields.contragent_id,
      status: StatusesDictionary.ACTIVE,
    });

    this.body = contragentStores;
  });

module.exports = router;
