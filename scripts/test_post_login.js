const http = require('http');

const payload = JSON.stringify({
  username: 'example@example.ru',
  password: 'ExamplePassword'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/login_administration',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'accept': 'application/json',
    'Authorization': 'Basic NTg3NjQwYzk5NWVkM2MwYzU5YjE0NjAwOjg4YmYxY2Q3MGQ=',
    'X-Api-Factory-Application-Id': '587640c995ed3c0c59b14600'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:', res.headers);
  let data = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('BODY:', data);
  });
});

req.on('error', (e) => { console.error('problem with request:', e.message); });
req.write(payload);
req.end();
