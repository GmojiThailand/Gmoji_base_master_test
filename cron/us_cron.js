const co = require('co');
const request = require('request-promise');
const config = require('../config/general');

const host = 'http://localhost';
const port = config.port;

co(function* () {
  const appId = '587640c995ed3c0c59b14600';

  let response = yield request({
    method: 'GET',
    url: `${host}:${port}/api/v1/update_certificate_status`,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Factory-Application-Id': appId,
    },
    json: true,
    resolveWithFullResponse: true,
  });

  return response.body;
})
  .then((res) => {
    console.log(`[${(new Date()).toLocaleString()}] US succesfully done!`);
    process.exit();
  })
  .catch((err) => {
    console.log(`[${(new Date()).toLocaleString()}] ` + err && err.message || 'US failed!');
    process.exit();
  });
