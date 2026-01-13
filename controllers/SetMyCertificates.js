/**
 * Сохранения сертификата в истории полученных
 *
 * @param {string} certificate_id - id сертификата
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const StatusesDictionary = require('../models/dictionaries/Status');

const utils = require('../models/utils');

const router = new Router();

router.all('/set_my_certificates',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    if (!fields.certificate_id) {
      return this.body = {
        statusCode: 400,
        message: 'Certificate id required',
      };
    }

    const certificateTable = yield Table.fetch('certificates', this.application.id);
    let certificate = yield certificateTable.find({id: fields.certificate_id})
      .catch((e) => ({data: null}));

    if (certificate.data.status.id != StatusesDictionary.ACTIVE) {
      return this.body = {
        statusCode: 400,
        message: 'Gpon status is not active',
      };
    }

    const certificateGivingTable = yield Table.fetch('certificate_giving_history', this.application.id);
    const sentCertificates = yield certificateGivingTable.find({
      giver_id: this.user.id,
      certificate: fields.certificate_id,
    })
      .catch((e) => ({data: null}));

    if (!sentCertificates.data) {
      const certificateOwningTable = yield Table.fetch('certificate_owning_history', this.application.id);
      let ownedCertificate = yield certificateOwningTable.find({certificate: fields.certificate_id})
        .catch((e) => ({data: null}));

      let checkAdult = true;

      if (certificate.data.product.is_adult == true) {
        checkAdult = yield utils.checkIsAdult(this.application, this.user);
      }

      if (checkAdult) {
        if (!ownedCertificate.data) {
          ownedCertificate = yield certificateOwningTable.create({
            owner_id: this.user.id,
            certificate: fields.certificate_id,
            status_updated_at: Date.now(),
          });
        } else {
          yield ownedCertificate.data.update({owner_id: this.user.id, status_updated_at: Date.now()});
          // return this.body = {
          //   statusCode: 400,
          //   message: 'Certificate is already been owned',
          // };
        }
      } else {
        return this.body = {
          statusCode: 400,
          message: 'Adult gpon',
        };
      }

      return this.body = ownedCertificate;
    }

    this.body = {
      statusCode: 400,
      message: 'Certificate is already been this user',
    };
  });

module.exports = router;
