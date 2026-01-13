require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  // ensure SDK's mongoose connection is used: require vendor sdk DBAdapter to init connection
  require('../vendor/sdk/DBAdapters/MongoDB');

  // wait until connected
  await new Promise((resolve, reject) => {
    if (mongoose.connection && mongoose.connection.readyState === 1) return resolve();
    mongoose.connection.once('connected', resolve);
    setTimeout(() => reject(new Error('Timed out waiting for mongoose connection')), 5000);
  });

  const db = mongoose.connection.db;
  const cols = await db.listCollections().toArray();
  const target = 'example@example.ru';
  let found = null;
  for (const c of cols) {
    try {
      const doc = await db.collection(c.name).findOne({ username: target });
      if (doc) {
        console.log('Found in collection:', c.name);
        console.log(JSON.stringify(doc, null, 2));
        found = true;
        break;
      }
    } catch (e) {
      // ignore
    }
  }
  if (!found) console.log('User not found in any collection');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });