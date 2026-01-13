const co = require('co');
require('dotenv').config();
const SDK = require('../vendor/sdk');
const sdkConfig = require('../config/sdk')();
SDK.configure(sdkConfig);

co(function* () {
  const Application = SDK.Application;
  const application = yield Application.find({id: '587640c995ed3c0c59b14600'});
  if (!application) { console.error('Application not found'); process.exit(1); }

  const OAuth = require('../vendor/sdk/models/auth/OAuth');
  const o = new OAuth();
  o.req = { application };

  const username = process.argv[2] || 'example@example.ru';
  const password = process.argv[3] || 'ExamplePassword';

  o.getUser(username, password, (err, user) => {
    if (err) {
      console.error('getUser error:', err && err.message ? err.message : err);
      process.exit(1);
    }
    console.log('getUser success: user id=', user.id, 'username=', user.username);
    process.exit(0);
  });
}).catch((e) => { console.error(e); process.exit(1); });
