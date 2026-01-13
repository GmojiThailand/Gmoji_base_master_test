#!/usr/bin/env node
/**
 * Check what collections exist in database
 */
'use strict';
require('dotenv').config();

const mongoose = require('mongoose');
const co = require('co');

const targetUri = process.env.MONGODB_URL || process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL || process.env.MONGO_URI;

co(function* () {
  yield mongoose.connect(targetUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = mongoose.connection.db;
  const collections = yield db.listCollections().toArray();
  
  console.log('=== Collections in Database ===\n');
  collections.forEach(c => {
    console.log(`  - ${c.name}`);
  });
  
  console.log('\n=== Checking Application collection ===');
  const appCollections = collections.filter(c => c.name.toLowerCase().includes('application'));
  if (appCollections.length > 0) {
    console.log('Found Application-related collections:');
    appCollections.forEach(c => {
      console.log(`  - ${c.name}`);
    });
    
    // Check what's in the collection
    for (const coll of appCollections) {
      const count = yield db.collection(coll.name).countDocuments();
      console.log(`\n  ${coll.name}: ${count} documents`);
      if (count > 0) {
        const docs = yield db.collection(coll.name).find({}).limit(3).toArray();
        docs.forEach(doc => {
          console.log(`    - _id: ${doc._id}, name: ${doc.name || '(no name)'}`);
        });
      }
    }
  } else {
    console.log('No Application collection found');
  }
  
  yield mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
