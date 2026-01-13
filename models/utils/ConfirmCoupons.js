'use strict';

const HttpError = require('../Error');
const Table = require('../Table');

exports.exec = function* (application, {guid, productId} = options) {
  if (!guid || !productId) { throw new HttpError(400, 'Not enough params!'); }

  const activeStatus = '598d9bac47217f28ba69e0f5';

  const guidTable = yield Table.fetch('guid', application.id);
  let guidData = yield guidTable.find({guid: guid}).catch((e) => ({data: null}));

  if (!guidData.data) { throw new HttpError(404, 'Giud not found!'); }

  const couponsTable = yield Table.fetch('coupons', application.id);

  yield couponsTable.updateMany({guid: guidData.data.id}, {status: activeStatus, product: productId});

  let result = yield guidData.data.update({status: activeStatus});

  return result;
};
