/**
 * Script to reset login counter
 * Run: node reset_counter.js
 */

const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/v1/reset_login_counter',
  method: 'POST',
  headers: {
    'X-Api-Factory-Application-Id': '587640c995ed3c0c59b14600',
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Success:');
      console.log(data);
    } else {
      console.log('❌ Error:', res.statusCode);
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
  console.log('\n⚠️  Please make sure:');
  console.log('   1. Server is running on http://127.0.0.1:3001');
  console.log('   2. Server has been restarted after adding the endpoint');
});

req.end();

