'use strict';

const HttpError = require('../Error');
const Table = require('../Table');
const User = require('../User');
const Auth = require('../Auth');

exports.exec = function* (req, application, {username, password} = options) {
  const subcontragentRole = '5988108288955d4a0dc7d644';

  if (!username || !password) { throw new HttpError(400, 'Username or password is empty'); }

  let userSys = yield User.find({username: username, role: subcontragentRole}, {}, application.id);

  if (!userSys) { throw new HttpError(404, 'User not found'); }

  let subcontragentTable = yield Table.fetch('subcontragents', application.id);

  let subcontragent = yield subcontragentTable.find({user_id: userSys.id})
    .catch((e) => (console.error(e), {data: null}));

  let result;
  if (!subcontragent.data) {
    result = {id: userSys.id};
  } else {
    result = subcontragent.data;
  }

  req.request.fields = {username: username, password: password};

  let options = {
    oauth: {
      accessTokenLifetime: 60 * 60 * 24,
      refreshTokenLifetime: 60 * 60 * 24 * 7,
    },
  };

  let token = yield Auth.login.oauth(req, options).catch((err) => done(err));

  return {data: result, token: token, role: subcontragentRole};
};
