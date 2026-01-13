const http = require('http');

function doRequest(path, payloadObj, cb) {
  const payload = payloadObj ? JSON.stringify(payloadObj) : '';
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: path,
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
    let data = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      cb(null, {status: res.statusCode, headers: res.headers, body: data});
    });
  });
  req.on('error', (e) => cb(e));
  if (payload) req.write(payload);
  req.end();
}

console.log('Calling /reset_login_counter...');
doRequest('/api/v1/reset_login_counter', null, (err, res) => {
  if (err) { console.error('Reset error', err); process.exit(1); }
  console.log('Reset response:', res.status, res.body);

  // Now try login with sample user using username as password
  const user = '+66919791491';
  const payload = { username: user, password: user };
  console.log('Attempting login with username-as-password for', user);
  doRequest('/api/v1/login_administration', payload, (err2, res2) => {
    if (err2) { console.error('Login error', err2); process.exit(1); }
    console.log('Login status:', res2.status);
    console.log('Login headers:', res2.headers);
    console.log('Login body:', res2.body);
  });
});
