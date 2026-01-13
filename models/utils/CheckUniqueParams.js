'use strict';

const HttpError = require('../Error');
const Table = require('../Table');
const Validator = require('../Validator');
const User = require('../User');

exports.exec = function* (application, {username, name, role} = options) {
  const contragentsTable = yield Table.fetch('contragents', application.id);
  let result = {data: {}};

  if (username) {
    username = username.toLowerCase();

    let userSys = yield User.find({username: username}, {}, application.id);

    let user;
    if (role !== 'contragents') {
      const usersTable = yield Table.fetch('users', application.id);
      user = yield usersTable.find({email: username})
        .catch((e) => ({data: null}));
    } else {
      user = {data: null};
    }

    let contragent = yield contragentsTable.find({$or: [{email: username}, {delivery_email: username}]})
      .catch((e) => ({data: null}));

    if (userSys || user.data || contragent.data) { throw new HttpError(400, 'Username already exists'); }

    Object.assign(result.data, {checkUsername: 'OK!'});
  }

  if (name) {
    let re = Validator.buildMongoRegex(name, {});
    let agents = yield contragentsTable.findAll({name: re});

    name = name.toLowerCase();
    agents.data.map((agent) => {
      if (agent.name.toLowerCase() === name) {
        throw new HttpError(400, 'Name already exists');
      }
    });

    Object.assign(result.data, {checkName: 'OK!'});
  }

  return result;
};
