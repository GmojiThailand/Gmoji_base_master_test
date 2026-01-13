'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');

const router = new Router();


router.get('/find_url_pairs',
  {
    appId: true,
  },
  function* () {
    const {origin, encoded} = this.request.query;
    const URLTable = yield Table.fetch('encoded_url_pairs', this.application.id);
    let urlPair;
    if(origin) {
        urlPair = yield URLTable.findAll({origin});
    } else {
        urlPair = yield URLTable.findAll({encoded});
    }
    if (urlPair.data.length === 0) throw new HttpError(404, 'Pair not found');
    this.body = urlPair;
  });


router.post('/create_url_pairs',
  {
    appId: true,
  },
  function* () {
    const {origin, encoded} = this.request.fields;
    const URLTable = yield Table.fetch('encoded_url_pairs', this.application.id);
    let result = {};
     result.data = yield URLTable.create({origin, encoded});
     this.body = result;
  });


module.exports = router;
