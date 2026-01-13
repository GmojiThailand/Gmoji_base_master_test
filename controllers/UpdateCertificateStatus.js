/**
 * Технический контроллер для обновления статусов джипонов воркером
 */
'use strict';

const Router = require('../models/Router');
const Table = require('../models/Table');
const StatusesDictionary = require('../models/dictionaries/Status');

const router = new Router();

router.all('/update_certificate_status',
  {
    appId: true,
  },
  function* () {
    const appId = '587640c995ed3c0c59b14600';
    const certificatesTable = yield Table.fetch('certificates', appId);
    const now = Date.now();

    let toBeUpdated = yield certificatesTable.findAll({
      $and: [
        {status: StatusesDictionary.ACTIVE},
        {end_sale_date: {$lt: now}},
      ],
    });
    toBeUpdated = toBeUpdated.data;

    if (toBeUpdated && toBeUpdated.length) {
      yield certificatesTable.updateMany(
        {
          $and: [
            {status: StatusesDictionary.ACTIVE},
            {end_sale_date: {$lt: now}},
          ],
        },
        {
          status: StatusesDictionary.OVERDUE,
          deactivation_date: now,
        }
      );
    }

    const incativeStatuses = [StatusesDictionary.SPENT, StatusesDictionary.OVERDUE];
    const removalPeriod = 1000 * 60 * 60 * 24 * 30;

    let toBeDeleted = yield certificatesTable.findAll({
      $and: [
        {status: {$in: incativeStatuses}},
        {
          deactivation_date: {
            $exists: true,
            $lt: (now - removalPeriod),
          },
        },
      ],
    });
    toBeDeleted = toBeDeleted.data;

    if (toBeDeleted && toBeDeleted.length) {
      yield certificatesTable.updateMany(
        {
          $and: [
            {status: {$in: incativeStatuses}},
            {
              deactivation_date: {
                $exists: true,
                $lt: (now - removalPeriod),
              },
            },
          ],
        },
        {status: StatusesDictionary.DELETED}
      );
    }

    this.body = {
      overdued: toBeUpdated.length,
      archieved: toBeDeleted.length,
    };
  });

module.exports = router;
