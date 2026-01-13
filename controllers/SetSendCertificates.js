/**
 * Скрипт сохранения сертификата в истории отправленных
 *
 * @param {string} certificate_id - id сертификата
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const HttpError = require('../models/Error');

const router = new Router();

router.all('/set_send_certificates',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.certificate_id) {
      throw new HttpError(400, 'Certificate id required');
    }

    const certificateGivingTable = yield Table.fetch('certificate_giving_history', this.application.id);
    const sentGpon = yield certificateGivingTable.find({giver_id: this.user.id, certificate: fields.certificate_id})
      .catch((e) => ({data: null}));

    if (sentGpon.data) { return this.body = {}; }

    let sentCertificate = yield certificateGivingTable.create({
      giver_id: this.user.id,
      certificate: fields.certificate_id,
      status_updated_at: Date.now(),
    });

    this.body = sentCertificate;
  });

module.exports = router;
