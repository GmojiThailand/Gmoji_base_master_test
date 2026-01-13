#!/usr/bin/env node
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function main() {
  const base = process.env.MONGODB_URL || process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL || process.env.MONGO_URI;
  if (!base) {
    console.error('No MONGODB_URL / MONGO_URL / MONGO_PUBLIC_URL set');
    process.exit(1);
  }

  // Ensure DB name and authSource are present
  let uri = base;
  if (base.indexOf('/', 'mongodb://'.length) === -1) {
    uri = base.replace(/\/?$/, '/') + 'api-factory?authSource=admin';
  }

  console.log('Connecting to', uri.replace(/:(?=[^@]*@)[^@]+@/, ':***@'));
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  const dumpDir = path.resolve(__dirname, '..', 'migrations', 'release_dump_18_07_2018_17_50', 'api-factory');
  if (!fs.existsSync(dumpDir)) {
    console.error('Dump metadata directory not found:', dumpDir);
    await mongoose.disconnect();
    process.exit(1);
  }

  const files = fs.readdirSync(dumpDir).filter(f => f.endsWith('.metadata.json'));
  if (!files.length) {
    console.log('No .metadata.json files found in dump folder');
    await mongoose.disconnect();
    return;
  }

  for (const f of files) {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(dumpDir, f), 'utf8'));
      const ns = meta.indexes && meta.indexes.length ? meta.indexes[0].ns : null;
      // ns is like 'api-factory.entities' — extract collection name
      const collName = ns ? ns.split('.').slice(1).join('.') : f.replace('.metadata.json', '');
      const indexes = meta.indexes || [];
      for (const idx of indexes) {
        if (idx.name === '_id_') continue;
        const key = idx.key || {};
        const options = Object.assign({}, idx);
        delete options.key;
        delete options.ns;
        try {
          console.log(`Creating index ${options.name} on ${collName}`);
          await mongoose.connection.db.collection(collName).createIndex(key, options);
          console.log('  OK');
        } catch (err) {
          console.error('  Failed:', err && err.message ? err.message : err);
        }
      }
    } catch (e) {
      console.error('Failed to process metadata file', f, e && e.message);
    }
  }

  await mongoose.disconnect();
}

main().catch(e => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
