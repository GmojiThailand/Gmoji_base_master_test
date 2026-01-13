const co = require('co');
require('dotenv').config();
const SDK = require('../vendor/sdk');
const sdkConfig = require('../config/sdk')();
SDK.configure(sdkConfig);

const username = process.argv[2] || 'example@example.ru';
const password = process.argv[3] || 'ExamplePassword';
const applicationId = '587640c995ed3c0c59b14600';

co(function* () {
  const Application = SDK.Application;
  const application = yield Application.find({id: applicationId});
  if (!application) { console.error('Application not found'); process.exit(1); }

  const User = SDK.User;
  const existing = yield User.find({username}, {}, application.id).catch(() => null);
  if (existing) {
    console.log('User already exists:', existing.id, existing.username);
    process.exit(0);
  }

  // Create user object without passing password in constructor to ensure
  // setter is used (which performs hashing via User.password setter).
  let userObj = new User({ username }, application.id);
  // Use setter so password is hashed according to User implementation
  userObj.password = password;
  try {
    const saved = yield userObj.save();
    console.log('User created:');
    console.log(' id:', saved.id);
    console.log(' username:', saved.username);
    console.log(' role:', saved.role ? saved.role.toString ? saved.role.toString() : String(saved.role) : null);
  } catch (e) {
    console.error('Error creating user:', e && e.message ? e.message : e);
    if (e && e.stack) console.error(e.stack);
    process.exit(1);
  }
  process.exit(0);
}).catch((e) => { console.error('Fatal:', e); process.exit(1); });
