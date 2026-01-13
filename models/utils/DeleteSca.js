
'use strict';

const HttpError = require('../Error');
const Table = require('../Table');
const User = require('../User');

exports.exec = function* (application, scaUserId) {
  if (!scaUserId) {
    throw new HttpError(400, 'Subcontragent id required');
  }

  let SubCaTable = yield Table.fetch('subcontragents', application.id);
  try {
    let userSys = new User({id: scaUserId}, application.id);
    yield userSys.remove();
    yield SubCaTable.remove({user_id: scaUserId});
  } catch (e) {
    throw new HttpError(500, e.message);
  }
  return {data: 'ok'};
};
