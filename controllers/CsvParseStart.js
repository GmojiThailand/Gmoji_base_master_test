'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Service = require('../models/Service');
const fs = require('fs');

const router = new Router();

router.all('/csv_parse_start',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const data = this.request.fields || this.request.querystring;

    let fileBuffer = yield readWrap(data.file[0].path);

    let params = {buffer: fileBuffer};

    const csvParser = yield Service.fetch('csv-parser', this.application.id);
    csvParser.data = params;
    let result = yield csvParser.request('parse', this)
      .catch((err) => {throw new HttpError(400, 'Parse error')});

    let resultJSON;
    try {
      resultJSON = JSON.parse(result.body);
    } catch (e) {
      throw new HttpError(500, 'Cant parse response');
    }

    if (resultJSON.statusCode && resultJSON.statusCode != 200) {
      this.status = resultJSON.statusCode || 500;
      this.body = resultJSON || {statusCode: 500, message: 'Server error'};
    }

    this.body = {data: resultJSON};

    // TODO: Заменить на readStream
    function readWrap(path) {
      return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
          if (err) reject(err);
          resolve(data);
        });
      });
    }
  });

module.exports = router;
