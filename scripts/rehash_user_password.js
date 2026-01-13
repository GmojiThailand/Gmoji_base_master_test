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
  let user = yield User.find({username}, {}, application.id).catch(() => null);
  if (!user) { console.error('User not found'); process.exit(1); }

  console.log('Before update, password (raw getter):', user.password);
  // Use update to trigger setter and save
  try {
    user = yield user.update({ password });
    console.log('Password updated for user:', user.id);
  } catch (e) {
    console.error('Error updating password:', e && e.message ? e.message : e);
    process.exit(1);
  }

  // Dump raw document to confirm
  const mongoose = require('mongoose');
  yield new Promise((res) => setTimeout(res, 300));
  const db = mongoose.connection.db;
  const doc = yield db.collection('user_587640c995ed3c0c59b14600').findOne({ username });
  console.log('Raw DB doc after update:', JSON.stringify(doc, null, 2));
  
  // If password still not hashed (looks like plain text), compute md5 and update directly
  const crypto = require('crypto');
  const hashed = crypto.createHash('md5').update(password).digest('hex');
  if (doc && doc.password && doc.password !== hashed) {
    yield db.collection('user_587640c995ed3c0c59b14600').updateOne({ _id: doc._id }, { $set: { password: hashed, updatedAt: new Date() } });
    const doc2 = yield db.collection('user_587640c995ed3c0c59b14600').findOne({ username });
    console.log('Raw DB doc after direct hash update:', JSON.stringify(doc2, null, 2));
  }
  process.exit(0);
}).catch((e) => { console.error(e); process.exit(1); });
