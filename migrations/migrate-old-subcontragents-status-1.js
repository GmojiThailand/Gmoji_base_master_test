/**
 * Единичный запуск
 * Добавление статусов профилям представителей subcontragents
 *
 * bash$ env NODE_ENV=production node migrate-old-subcontragents-status.js
 */
'use strict';

const co = require('co');
require('sdk').configure({
  db: {
    mongodb: {
      host: 'localhost',
      port: '27017',
      name: 'api-factory',
      // username: 'api-factory',
      // password: 'MinerVA20022016',
      // authSource: 'admin',
    },
  },
});
const Table = require('sdk').Table;
const User = require('sdk').User;
const RolesDictionary = require('../models/dictionaries/Role');
const StatusesDictionary = require('../models/dictionaries/Status');

const appId = '587640c995ed3c0c59b14600';

co(function* () {
  try {
    let subcontragentsTable = yield Table.fetch('subcontragents', appId);

    let subcontragents = yield subcontragentsTable.findAll({status: {$exists: false}});
    subcontragents = subcontragents.data;

    let promises = Promise.resolve();

    function setSubcontragent(subcontragent) {
      console.log(`SUBCONTRAGENT: ${subcontragent.user_id}`);
      return new Promise((resolve, reject) => {
        return User.find(
          {id: subcontragent.user_id},
          {},
          appId
        )
          .then((userSys) => {
            let currentRole = userSys && userSys.role.toString() == RolesDictionary.SUB_CONTRAGENT ? true : false;
            if (!userSys) {
              console.log('SYS USER NOT FOUND');

              return subcontragent.remove()
                .then(() => {
                  totalScaRemoved++;

                  console.log('Resolve');
                  resolve();
                })
                .catch((err) => console.log('Reject', err) || resolve());
            } else {
              console.log(`SYS USER: ${userSys.username} - ${currentRole ? 'active' : 'banned'}`);

              return subcontragent.update({
                status: currentRole ? StatusesDictionary.ACTIVE : StatusesDictionary.DELETED,
              })
                .then(() => {
                  if (subcontragent.status == StatusesDictionary.ACTIVE) { totalScaUpdatedWithActiveStatus++; }
                  if (subcontragent.status == StatusesDictionary.DELETED) { totalScaUpdatedWithDeletedStatus++; }

                  console.log('Resolve', subcontragent.status);
                  resolve();
                })
                .catch((err) => console.log('Reject', err) || resolve());
            }
          })
          .catch((err) => console.log('Reject', err) || resolve());
      });
    }

    let totalScaWithoutStatus = subcontragents.length;
    let totalScaUpdatedWithActiveStatus = 0;
    let totalScaUpdatedWithDeletedStatus = 0;
    let totalScaRemoved = 0;
    subcontragents.map((subcontragent) => {
      promises = promises.then(() => setSubcontragent(subcontragent));
    });

    yield promises;

    console.log('\n======================================');
    console.log('Total Subcontragents Without Status:', totalScaWithoutStatus);
    console.log('Total Subcontragents Updated With Status Active:', totalScaUpdatedWithActiveStatus);
    console.log('Total Subcontragents Updated With Status Deleted:', totalScaUpdatedWithDeletedStatus);
    console.log('Total Subcontragents Removed:', totalScaRemoved);
  } catch (error) {
    console.error(error);
    process.exit();
  }

  process.exit();
});
