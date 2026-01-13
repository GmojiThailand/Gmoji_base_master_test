/**
 * Обертка гашения сертификата в системе
 */

'use strict';

const Router = require('../models/Router');
const HttpError = require('../models/Error');
const Table = require('../models/Table');
const RolesDictionary = require('../models/dictionaries/Role');
const AdminLogData = require('../models/dictionaries/AdminLogData');

const utils = require('../models/utils');

const router = new Router();

router.all('/cash_certificate_wrap',
  {
    auth: true,
    access: true,
    appId: true,
  },
  function* () {
    const fields = this.request.fields || this.request.query;

    function* logCashingError(user, application) {
      if (user.role.id.toString() != RolesDictionary.ADMIN_SUPER) {
        let tryCashingRecord = {
          user_id: user.id,
          certificate_id: fields.certificate_id,
          attempts: 1,
        };

        const tryingCashingHistoryTable = yield Table.fetch('trying_cashing_history', application.id);

        let tryCash = yield tryingCashingHistoryTable.find({
          user_id: user.id,
          certificate_id: fields.certificate_id,
        })
          .catch((e) => ({data: null}));

        if (!tryCash.data) {
          yield tryingCashingHistoryTable.create(tryCashingRecord);
        } else {
          yield tryCash.data.update({attempts: tryCash.data.attempts + 1});
        }
      }
    };

    // Если новый представитель, то доставляет store id из привязанного магазина
    if (this.user.role.id.toString() == RolesDictionary.SUB_CONTRAGENT) {
      const subcontragentTable = yield Table.fetch('subcontragents', this.application.id);
      const storesTable = yield Table.fetch('stores', this.application.id);

      let subcontragent = yield subcontragentTable.find({user_id: this.user.id.toString()}, {select: 'id'})
        .catch((e) => ({data: null}));
      subcontragent = subcontragent.data;

      if (!subcontragent) {
        throw new HttpError(404, 'Subcontragent not found');
      }

      let store = yield storesTable.find({subcontragent: subcontragent.id.toString()}, {select: 'id'})
        .catch((e) => ({data: null}));
      store = store.data;

      if (store) {
        if (!fields.store_id || fields.store_id.length != 24) {
          fields.store_id = store.id.toString();
        }
      }
    }

    try {
      let result = yield utils.cashCertificate(
        this.application,
        this.user,
        {
          certificateId: fields.certificate_id,
          storeId: fields.store_id,
          pin: fields.pin,
          phone: fields.phone,
          rawData: fields.raw_data,
          rawType: fields.raw_type,
        }
      );

      if (result === false) {
        yield logCashingError(this.user, this.application);

        this.status = 400;
        this.body = {
          statusCode: 400,
          message: 'Incorrect pin',
        };
      } else {
        this.body = result;
      }


      // Создание записи в логе действий администраторов
      if (this.user.role.id.toString() == RolesDictionary.ADMIN_SECOND) {
        let options = {
          operationType: AdminLogData.LOG_OPERATION.CASH,
          userId: this.user.id,
          tableName: AdminLogData.LOG_TABLE.CERTIFICATES,
          entityId: result.data.id,
        };

        yield utils.createAdminLog(this.application, options);
      }
    } catch (error) {
      console.error(error);
      yield logCashingError(this.user, this.application);

      if (error instanceof HttpError) {
        throw error;
      } else {
        throw new HttpError(400, 'Cashing Gpon Error');
      }
    }
  });

module.exports = router;
