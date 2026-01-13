const request = require('request-promise');
const host = 'http://localhost';
const port = '4305';
const appId = '587640c995ed3c0c59b14600';


gcStart(appId)
  .then((res) => {
    console.log(res);
    console.log('GC succesfully done!');
    process.exit();
  })
  .catch((err) => {
    console.log(err);
    console.log('Get failed!');
    process.exit();
  });

async function gcStart(appId) {
  let response = await request({
    method: 'POST',
    url: `${host}:${port}/payture/gc_start`,
    body: {appId},
    headers: {
      'Content-Type': 'application/json',
    },
    json: true,
    resolveWithFullResponse: true,
  });
  return response.body;
}
