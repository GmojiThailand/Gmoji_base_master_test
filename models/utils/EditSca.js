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
const User = require('../User');
const RolesDictionary = require('../dictionaries/Role');

exports.exec = function* (application, {userSysId, username} = options) {
  if (!username) {
    throw new HttpError(400, 'Username required');
  }

  if (!userSysId) {
    throw new HttpError(400, 'User id required');
  }

  let userSys = yield User.find(
    {
      id: userSysId,
      role: RolesDictionary.SUB_CONTRAGENT,
    },
    {},
    application.id
  );

  userSys.username = username;
  userSys.password = username;

  yield userSys.save();

  return userSys;
};
