const co = require('co');
require('dotenv').config();
const SDK = require('../vendor/sdk');
const sdkConfig = require('../config/sdk')();
SDK.configure(sdkConfig);

const usernameToCheck = process.argv[2] || 'example@example.ru';

co(function* () {
  const application = yield SDK.Application.find({id: '587640c995ed3c0c59b14600'});
  if (!application) { console.error('Application not found'); process.exit(1); }

  const User = SDK.User;
  console.log('Searching for username:', usernameToCheck, 'in application', application.id);

  try {
    const user = yield User.find({username: usernameToCheck}, {}, application.id);
    if (!user) {
      console.log('User not found');
      process.exit(0);
    }

    console.log('User found:');
    console.log(' id:', user.id);
    console.log(' username:', user.username);
    console.log(' role:', user.role ? (user.role.toString ? user.role.toString() : String(user.role)) : null);
    console.log(' raw object:', JSON.stringify(user, null, 2));
  } catch (e) {
    console.error('Error searching user:', e && e.message ? e.message : e);
  }
  process.exit(0);
}).catch((e) => { console.error(e); process.exit(1); });
