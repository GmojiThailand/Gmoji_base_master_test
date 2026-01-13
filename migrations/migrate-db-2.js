/**
 * НЕ ЗАБЫТЬ ОБНОВИТЬ db.entities !!!!!!
 * ТАБЛИЦУ RULES, СТАТУС на всякий и прочее
 */
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
    function createNewSub(store) {
      return new Promise((resolve, reject) => {
        let userSys = new User(
          {
            username: `tmp_${store.id.toString()}`,
            role: RolesDictionary.SUB_CONTRAGENT,
            type: 'oauth',
          },
          appId
        );
        userSys.password = `tmp_${store.id.toString()}`;

        return userSys.save()
          .then(() => {
            return subcontragentTable.create({
              status: StatusesDictionary.ACTIVE,
              contragent_id: store.user_id.toString(),
              user_id: userSys.id,
            })
              .then((sub) => {
                return store.update({subcontragent: sub.id.toString()})
                  .then((store) => {
                    TotalBoundedStores++;

                    console.log(`store ${store.name} subca tmp_${store.id.toString()} created`);
                    resolve();
                  })
                  .catch((err) => console.log('Reject', err) || resolve());
              })
              .catch((err) => console.log('Reject', err) || resolve());
          })
          .catch((err) => console.log('Reject', err) || resolve());
      });
    }

    function attachSubToStore(store, scaId) {
      return new Promise((resolve, reject) => {
        return store.update({subcontragent: scaId})
          .then(() => {
            TotalUpdatedStores++;

            console.log(`store ${store.name} subca ${store.subcontragent} attched`);
            resolve();
          })
          .catch((err) => console.log('Reject', err) || resolve());
      });
    }
    // Каждому стору прикрепляем представителя
    const storesTable = yield Table.fetch('stores', appId);
    let stores = yield storesTable.findAll({status: StatusesDictionary.ACTIVE});
    stores = stores.data;

    const subcontragentTable = yield Table.fetch('subcontragents', appId);
    let subcontragents = yield subcontragentTable.findAll({status: StatusesDictionary.ACTIVE});
    subcontragents = subcontragents.data;

    let contragentIds = subcontragents.map((sca) => sca.contragent_id);

    const contragentTable = yield Table.fetch('contragents', appId);
    let contragents = yield contragentTable.findAll({
      user_id: {$in: contragentIds},
      status: StatusesDictionary.ACTIVE,
    });
    contragents = contragents.data;

    let TotalSca = subcontragents.length;
    let TotalScaWithCa = 0;
    let TotalScaWithCaWithNonZeroStores = 0;
    let TotalActiveStores = stores.length;
    let TotalUpdatedStores = 0;

    let promises = Promise.resolve();
    subcontragents.map((sca) => {
      console.log(`SUBCONTRAGENT: ${sca.email}`);
      contragents.map((ca) => {
        if (ca.user_id == sca.contragent_id) {
          TotalScaWithCa++;
          console.log(`Contragent: ${ca.name}`);
          let caStores = [];
          stores.map((store) => {
            if (store.user_id == ca.user_id) {
              caStores.push(store);
            }
          });

          console.log('Stores:\n', caStores.map((caStore) => `${caStore.name} ${caStore.id.toString()}`));
          if (caStores.length) {
            TotalScaWithCaWithNonZeroStores++;
            promises = promises.then(() => attachSubToStore(caStores[0], sca.id.toString()));
          }
        }
      });
    });

    yield promises;

    let unboundedStores = yield storesTable.findAll({
      subcontragent: {$exists: false},
      status: StatusesDictionary.ACTIVE,
    });
    unboundedStores = unboundedStores.data;

    let TotalUnboundedStores = unboundedStores.length;
    let TotalBoundedStores = 0;

    promises = Promise.resolve();
    for (let i = 0; i < unboundedStores.length; i++) {
      promises = promises.then(() => createNewSub(unboundedStores[i]));
    }

    yield promises;

    console.log('\n=============================================================');
    console.log('Total Subcontragents:', TotalSca);
    console.log('Total Subcontragents With Contragent:', TotalScaWithCa);
    console.log('Total Subcontragents With Contragent With Non Zero Stores:', TotalScaWithCaWithNonZeroStores);
    console.log('Total Active Stores:', TotalActiveStores);
    console.log('Total Updated Stores:', TotalUpdatedStores);
    console.log('Total Unbounded Stores:', TotalUnboundedStores);

    console.log('\n=============================================================');
    console.log('Total Bounded Stores:', TotalBoundedStores);


    // Блок создания счетчиков
    const countersTable = yield Table.fetch('counters', appId);

    yield countersTable.create({value: {main: 0}, name: 'product_categories'});
    yield countersTable.create({value: {}, name: 'products'});
    yield countersTable.create({value: {main: 0}, name: 'users'});

    // Проставление всем контрагентам дефолтной комиссии в 0
    const contragentsTable = yield Table.fetch('contragents', appId);
    yield contragentsTable.updateMany({}, {$set: {commission_common: 0}}, {new: true});
  } catch (error) {
    console.error(error);
    process.exit();
  }

  process.exit();
});
