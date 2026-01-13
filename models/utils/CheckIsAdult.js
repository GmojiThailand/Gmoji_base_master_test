const Table = require('../Table');
const HttpError = require('../Error');
const Config = require('../../config/general');

exports.exec = function* (application, user) {

  let adultFrom = Config.adultFrom || 18;

  const usersTable = yield Table.fetch('users', application.id);
  let userData = yield usersTable.find({user_id: user.id}).catch((e) => ({data: null}));

  if (!userData.data) { throw new HttpError(404, 'User not found'); }

  if (userData.data.birthdate === null || userData.data.birthdate === undefined) { return false; }
  if (userData.data.birthdate == 0) { return true; }

  if (new Date().getFullYear() - new Date(userData.data.birthdate).getFullYear() == adultFrom) {
    if (new Date().getMonth() - new Date(userData.data.birthdate).getMonth() > 0) {
      return true;
    }

    if (new Date().getMonth() - new Date(userData.data.birthdate).getMonth() == 0) {
      if (new Date().getDate() - new Date(userData.data.birthdate).getDate() < 0) {
        return false;
      } else {
        return true;
      }
    }

    if (new Date().getMonth() - new Date(userData.data.birthdate).getMonth() < 0) {
      return false;
    }
  }

  if (new Date().getFullYear() - new Date(userData.data.birthdate).getFullYear() < adultFrom) {
    return false;
  }

  if (new Date().getFullYear() - new Date(userData.data.birthdate).getFullYear() > adultFrom) {
    return true;
  }
};
