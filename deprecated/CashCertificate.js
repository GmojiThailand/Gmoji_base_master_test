/**
 * Скрипт гашения сертификата
 *
 * @param {string} certificate_id - id выбранного сертификата
 * @param {number} pin
 * @param {string} store_id - id выбранного магазина
 *
 */
'use strict';

const Router = require('../models/Router');
const utils = require('../models/utils');

const router = new Router();

router.all('/cash_certificate',
  {appId: true},
  function* () {
    const data = this.request.fields || this.request.query;

    const result = yield utils.cashCertificate(this.application, this.user,
                                               {
                                                 certificateId: data.certificate_id,
                                                 storeId: data.store_id,
                                                 pin: data.pin,
                                               });

    this.body = result;
  });

module.exports = router;
