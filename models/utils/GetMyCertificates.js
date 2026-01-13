'use strict';

const Table = require('../Table');
const CheckIsAdult = require('./CheckIsAdult');
const StatusesDictionary = require('../dictionaries/Status');
const DetectCertificateStatus = require('./DetectCertificateStatus');

const Config = require('../../config/general');

exports.exec = function* (application, user, fields, options) {
  fields = fields || {};
  options = options || {};
  if (fields.out === 'short') {
    options.populate = {product: {select: ['_id', 'name', 'description', 'is_delivery', 'code_type', 'icon', 'is_coupon_limited', 'delivery_type', 'localized_name']}};
  }
  options.sort = 'status end_sale_date';

  const isAdult = yield CheckIsAdult.exec(application, user);

  let certParams = {
    buyer_id: user.id,
    status: {$ne: StatusesDictionary.DELETED},
  };
  if (!isAdult) {
    const productsTable = yield Table.fetch('products', application.id);
    let products = yield productsTable.findAll({is_adult: true});
    products = products.data;
    const productIds = products.map((product) => product.id.toString());
    certParams.product = {$nin: productIds};
  }

  // История дарения сертификатов
  const certificateGivingTable = yield Table.fetch('certificate_giving_history', application.id);
  let sentGponsHistory = yield certificateGivingTable.findAll({giver_id: user.id});
  // Формируем список id подаренных сертификатов
  let sentGponIds = sentGponsHistory.data.map((row) => row.certificate.toString());

  // // Очищаем купленные от подаренных
  // boughtGpons.data = boughtGpons.data.filter((gpon) => {
  //   if (!~sentGponIds.indexOf(gpon.id.toString())) { return gpon; }
  //   return false;
  // });

  // История получения в подарок сертификатов
  const certificateOwningTable = yield Table.fetch('certificate_owning_history', application.id);
  let ownedGponsHistory = yield certificateOwningTable.findAll({owner_id: user.id, hidden: {$ne: true}});
  // Формируем список id полученных в подарок сертификатов
  let ownedGponIds = ownedGponsHistory.data.map((row) => row.certificate.toString());

  if (sentGponIds.length > 0 || ownedGponIds.length > 0) {
    certParams = {
      $and: [{_id: {$nin: sentGponIds}}, {
        $or: [certParams, {
          _id: {$in: ownedGponIds, $nin: sentGponIds},
          status: {$ne: StatusesDictionary.DELETED}
        }]
      }]
    };
  }

  // // Очищаем id полученных в подарок сертификатов от тех, что были далее подарены кому-то
  // ownedGponIds = ownedGponIds.filter((gponId) => {
  //   if (!~sentGponIds.indexOf(gponId)) { return gponId; }
  //   return false;
  // });

  // Находим полученные в подарок сертификаты
  // let ownedGpons = yield certificatesTable.findAll({
  //   id: {$in: ownedGponIds},
  //   status: {$ne: StatusesDictionary.DELETED},
  // });

  const certificatesTable = yield Table.fetch('certificates', application.id);
  let boughtGpons = yield certificatesTable.findAll(certParams, options);

  boughtGpons.data.forEach(function (gpon) {
    if (gpon.product && gpon.product.localized_name) {
      if (fields.locale && gpon.product.localized_name[fields.locale]) {
        gpon.product.name = gpon.product.localized_name[fields.locale];
      } else if(gpon.product.localized_name[Config.defaultLocale]) {
        gpon.product.name = gpon.product.localized_name[Config.defaultLocale];
      }
    }
  });

  let myGpons = boughtGpons.data.map((ownedGpon) => {
    let match = ownedGponsHistory.data.findIndex((item) => item.certificate == ownedGpon.id);
    if (~match) {
      ownedGpon.status_updated_at = ownedGponsHistory.data[match].status_updated_at;
    }
    return ownedGpon;
  });

  // Формируем общий список имеющихся сертификатов из всех источников
  // let myGpons = boughtGpons.data;

  // const isAdult = yield CheckIsAdult.exec(application, user);
  //
  // if (!isAdult) {
  //   myGpons = myGpons.filter((gpon) => {
  //     if (gpon.product.is_adult === false) { return gpon; }
  //     return false;
  //   });
  // }

  const categoriesTable = yield Table.fetch('product_categories', application.id);
  let categories = yield categoriesTable.findAll({status: StatusesDictionary.ACTIVE});
  categories = categories.data;

  myGpons = myGpons.map((gpon) => {
    if (gpon.product && gpon.product.categories) {
      let categoryArray = [];
      gpon.product.categories.map((category) => {
        categories.map((item) => {
          if (item.id.toString() == category.toString()) {
            categoryArray.push(item);
          }
        });
      });

      gpon.product.categories = categoryArray;
    }

    gpon = DetectCertificateStatus.exec(gpon);

    return gpon;
  });

  if (fields.out === 'short') {
    myGpons = myGpons.map((gpon) => {
      delete gpon.product.is_coupon_limited;
      delete gpon.product.delivery_type;
      return gpon;
    });
  }

  return myGpons;
};
