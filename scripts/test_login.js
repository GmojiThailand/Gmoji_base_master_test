const http = require('http');

const data = JSON.stringify({ username: 'GmojiTest', password: 'Pass' });

const opts = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/login_administration',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'x-api-factory-application-id': '587640c995ed3c0c59b14600'
  }
};

const req = http.request(opts, (res) => {
  console.log('status', res.statusCode);
  let b = '';
  res.on('data', (c) => b += c);
  res.on('end', () => console.log('body', b));
});
req.on('error', (e) => console.error('ERR', e.message));
req.write(data);
req.end();
