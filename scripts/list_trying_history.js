const co = require('co');
require('dotenv').config();
const SDK = require('../vendor/sdk');
const sdkConfig = require('../config/sdk')();
SDK.configure(sdkConfig);

co(function* () {
  const application = yield SDK.Application.find({id: '587640c995ed3c0c59b14600'});
  if (!application) { console.error('Application not found'); process.exit(1); }
  const Table = SDK.Table;
  const tryingLoginHistory = yield Table.fetch('trying_login_history', application.id);
  const list = yield tryingLoginHistory.findAll({}, {limit: 50});
  console.log('Found', (list && list.length) || 0, 'records');
  if (list && list.length) {
    list.forEach((r, i) => {
      console.log(i+1, JSON.stringify(r, null, 2));
    });
  }
  process.exit(0);
}).catch((e) => { console.error(e); process.exit(1); });
