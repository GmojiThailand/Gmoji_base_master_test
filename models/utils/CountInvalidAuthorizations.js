'use strict';

const Table = require('../Table');
const HttpError = require('../Error');

exports.exec = function* (application, {requestHeaders} = options) {
  const tryingLoginHistory = yield Table.fetch('trying_login_history', application.id);

  // Get IP address with multiple fallbacks
  const requestIp = requestHeaders['x-real-ip'] 
    || requestHeaders['x-remote-addr'] 
    || (requestHeaders['x-forwarded-for'] && requestHeaders['x-forwarded-for'].split(',')[0].trim())
    || '127.0.0.1'; // fallback to localhost if no IP found

  function* createTryLogin() {
    yield tryingLoginHistory.create({
      ip: requestIp,
      last_try_time: Date.now(),
      try_counter: 1,
    });

    return 1;
  }

  console.error(new HttpError(403, 'Incorrect password/login pair'));

  let tryLogin = yield tryingLoginHistory.find({ip: requestIp})
    .catch((err) => ({data: null}));
  tryLogin = tryLogin.data;

  if (!tryLogin) {
    let result = yield createTryLogin();
    return result;
  }

  const hour = 1000 * 60 * 60;
  if ((Date.now()) - tryLogin.last_try_time > hour) {
    yield tryLogin.remove();

    let result = yield createTryLogin();
    return result;
  }

  if (tryLogin.try_counter == 1) {
    yield tryLogin.update({
      try_counter: 2,
    });

    return 2;
  } else if (tryLogin.try_counter == 2) {
    yield tryLogin.update({
      try_counter: 3,
      last_try_time: Date.now(),
    });

    return 3;
  } else if (tryLogin.try_counter >= 3) {
    let result = yield tryLogin.update({
      try_counter: tryLogin.try_counter + 1,
    });

    return result.try_counter;
  }
};
