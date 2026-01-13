'use strict';

const HttpError = require('../Error');
const Table = require('../Table');
const User = require('../User');
const CreateNewSca = require('./CreateNewSca');

exports.exec = function* (application, {contragentId, username, password} = options) {
  if (!contragentId) {
    throw new HttpError(400, 'Enter correct data!');
  }

  if (username) { username = username.toLowerCase(); }

  let subcontragent;
  const subcontragentsTable = yield Table.fetch('subcontragents', application.id);
  subcontragent = yield subcontragentsTable.find({contragent_id: contragentId})
    .catch((e) => (console.error(e), {data: null}));

  let userSys = yield User.find({id: subcontragent.data.user_id}, {}, application.id);

  if (username) {
    if (!userSys) {
      subcontragent = yield CreateNewSca.exec(application, {contragentId, username, password});
    } else {
      userSys.username = username;
      yield subcontragent.data.update({email: username});
    }
  }

  if (!userSys) { throw new HttpError(400, 'Need to create subcontragent'); }

  if (password) {
    userSys.password = password;
  }

  yield userSys.save();

  return {data: subcontragent.data};
};
