/**
 * Технический скрипт для установки определенным записям статсу активен
 */
'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');

const router = new Router();

router.use('/technical_status_implemetation',
  {appId: true},
  function* () {
    const activeStatus = '598d9bac47217f28ba69e0f5';

    const certificatesTable = yield Table.fetch('users', req.application.id);

    let certificates = yield certificatesTable.findAll({status: {$exists: false}});

    yield certificates.data.map(function* (certificate) {
      yield certificate.update({status: activeStatus});
    });

    return done();
  });
