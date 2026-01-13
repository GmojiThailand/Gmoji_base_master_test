/*
 * Создание представителя контрагента
 *
 * @param {Object} application - объект с информацией о приложении Api Factory
 * @param {Object} options - входные параметры для создания представителя
 *
 * @param {string} contragentId - id контрагента из таблицы contragents
 * @param {string} username - логин/имя представителя в системе
 */
'use strict';

const HttpError = require('../Error');
const Table = require('../Table');
const User = require('../User');
const StatusesDictionary = require('../dictionaries/Status');
const RolesDictionary = require('../dictionaries/Role');

exports.exec = function* (application, {contragentId, username} = options) {
  if (!contragentId) {
    throw new HttpError(400, 'Contragent id required');
  }

  if (!username) {
    throw new HttpError(400, 'Username required');
  }

  let userSys = new User(
    {
      username: username,
      role: RolesDictionary.SUB_CONTRAGENT,
      type: 'oauth',
    },
    application.id
  );

  userSys.password = username;

  yield userSys.save();

  let newSubContragent = {
    user_id: userSys.id,
    contragent_id: contragentId,
    status: StatusesDictionary.ACTIVE,
  };

  let usersTable = yield Table.fetch('subcontragents', application.id);
  let user = yield usersTable.create(newSubContragent);

  return user;
};
