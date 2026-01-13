const co = require('co');
require('dotenv').config();
const SDK = require('../vendor/sdk');
const sdkConfig = require('../config/sdk')();
SDK.configure(sdkConfig);

co(function* () {
  // fetch application
  const Application = SDK.Application;
  const application = yield Application.find({id: '587640c995ed3c0c59b14600'});
  if (!application) {
    console.error('Application not found');
    process.exit(1);
  }

  const Table = SDK.Table;
  let tables = {};
  try {
    tables = yield Table.fetchAll(application.id);
  } catch (e) {
    console.error('No tables found or error:', e.message || e);
  }

  // list collections from mongoose connection
  const mongoose = require('mongoose');
  mongoose.connection.on('error', () => {});

  yield new Promise((res) => setTimeout(res, 500)); // wait for connection

  const db = mongoose.connection.db;
  const cols = yield db.listCollections().toArray();
  const names = cols.map(c => c.name).sort();

  console.log('\n=== Collections in DB ('+names.length+') ===');
  names.forEach(n => console.log(' -', n));

  console.log('\n=== Tables configured (name -> id -> tablename) ===');
  Object.keys(tables).forEach(name => {
    const t = tables[name];
    console.log(` - ${name} -> id=${t.id} -> tablename=${t.tablename}`);
  });

  console.log('\n=== Mapping: find collections that include table id or table name ===');
  Object.keys(tables).forEach(name => {
    const t = tables[name];
    const matches = names.filter(n => n.indexOf(t.id) >= 0 || n.toLowerCase().indexOf(name.toLowerCase()) >= 0 || n.toLowerCase().indexOf('tableentity') >= 0);
    console.log(` - ${name} matches ${matches.length} collections:`);
    matches.forEach(m => console.log('    *', m));
  });

  process.exit(0);
}).catch((e) => { console.error(e); process.exit(1); });
