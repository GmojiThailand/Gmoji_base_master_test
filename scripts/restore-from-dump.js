#!/usr/bin/env node
/**
 * Restore database from dump files in migrations/release_dump_18_07_2018_17_50
 * Uses Node.js/mongodb driver - no need for mongorestore
 */
'use strict';
require('dotenv').config();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const co = require('co');
// Use BSON from mongodb driver (comes with mongoose)
const { BSON } = require('mongodb');

// Get target URI (Atlas)
const targetUri = process.env.MONGODB_URL || process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL || process.env.MONGO_URI;
if (!targetUri) {
  console.error('❌ Error: MONGODB_URL is not set in .env file');
  console.error('Please set MONGODB_URL to your Atlas connection string');
  process.exit(1);
}

const maskUri = (uri) => uri.replace(/(:\/\/[^:]+:)([^@]+)(@)/, (m, a, b, c) => `${a}***${c}`);

console.log('=== Restore Database from Dump ===\n');
console.log('Target:', maskUri(targetUri));
console.log('');

// Path to dump directory
const dumpDir = path.resolve(__dirname, '..', 'migrations', 'release_dump_18_07_2018_17_50', 'api-factory');

if (!fs.existsSync(dumpDir)) {
  console.error('❌ Dump directory not found:', dumpDir);
  process.exit(1);
}

console.log('Dump directory:', dumpDir);
console.log('');

// List available dump files
const files = fs.readdirSync(dumpDir);
const bsonFiles = files.filter(f => f.endsWith('.bson') && !f.includes('metadata'));

if (bsonFiles.length === 0) {
  console.error('❌ No .bson files found in dump directory');
  process.exit(1);
}

console.log(`Found ${bsonFiles.length} collection(s) to restore:\n`);
bsonFiles.forEach(f => console.log(`  - ${f}`));
console.log('');

co(function* () {
  try {
    // Connect to target database (Atlas)
    console.log('📡 Connecting to MongoDB Atlas...');
    yield mongoose.connect(targetUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = mongoose.connection.db;

    // Restore each collection
    let totalDocs = 0;
    for (const bsonFile of bsonFiles) {
      try {
        const collectionName = bsonFile.replace('.bson', '');
        console.log(`📦 Restoring collection: ${collectionName}...`);

        // Read BSON file
        const bsonPath = path.join(dumpDir, bsonFile);
        const bsonData = fs.readFileSync(bsonPath);

        // Parse BSON documents
        const documents = [];
        let offset = 0;
        let docCount = 0;

        while (offset < bsonData.length) {
          try {
            const docSize = bsonData.readInt32LE(offset);
            if (docSize < 5 || offset + docSize > bsonData.length) break;

            const docBuffer = bsonData.slice(offset, offset + docSize);
            const doc = BSON.deserialize(docBuffer);
            documents.push(doc);
            docCount++;
            offset += docSize;
          } catch (err) {
            console.error(`   ⚠️  Error parsing document at offset ${offset}:`, err.message);
            break;
          }
        }

        console.log(`   Found ${docCount} documents`);

        if (documents.length === 0) {
          console.log(`   ⏭️  Skipping empty collection\n`);
          continue;
        }

        // Insert documents in batches
        const collection = db.collection(collectionName);
        const batchSize = 1000;
        let inserted = 0;

        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          try {
            yield collection.insertMany(batch, { ordered: false });
            inserted += batch.length;
            process.stdout.write(`   Progress: ${inserted}/${documents.length} documents\r`);
          } catch (err) {
            // If duplicate key error, try inserting one by one
            if (err.code === 11000) {
              console.log(`   ⚠️  Some documents already exist, inserting individually...`);
              for (const doc of batch) {
                try {
                  yield collection.insertOne(doc);
                  inserted++;
                } catch (e) {
                  if (e.code !== 11000) {
                    console.error(`   ❌ Error inserting document:`, e.message);
                  }
                  // Skip duplicates
                }
              }
            } else {
              throw err;
            }
          }
        }

        console.log(`   ✅ Restored ${inserted} documents\n`);
        totalDocs += inserted;

      } catch (err) {
        console.error(`   ❌ Error restoring ${bsonFile}:`, err.message);
        console.error(`   Continuing with next collection...\n`);
      }
    }

    // Restore indexes from metadata files
    console.log('📋 Restoring indexes...\n');
    const metadataFiles = files.filter(f => f.endsWith('.metadata.json'));
    
    for (const metaFile of metadataFiles) {
      try {
        const metaPath = path.join(dumpDir, metaFile);
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        
        if (!meta.indexes || !meta.indexes.length) continue;

        const ns = meta.indexes[0].ns;
        const collectionName = ns ? ns.split('.').slice(1).join('.') : metaFile.replace('.metadata.json', '');
        const collection = db.collection(collectionName);

        for (const idx of meta.indexes) {
          if (idx.name === '_id_') continue; // Skip default _id index
          
          try {
            const key = idx.key || {};
            const options = Object.assign({}, idx);
            delete options.key;
            delete options.ns;
            
            console.log(`   Creating index ${options.name || 'unnamed'} on ${collectionName}...`);
            yield collection.createIndex(key, options);
            console.log(`   ✅ Index created\n`);
          } catch (err) {
            if (err.code === 85) {
              console.log(`   ⚠️  Index already exists, skipping\n`);
            } else {
              console.error(`   ❌ Failed: ${err.message}\n`);
            }
          }
        }
      } catch (err) {
        console.error(`   ❌ Error processing ${metaFile}:`, err.message);
      }
    }

    console.log('=== Restore Summary ===');
    console.log(`✅ Total documents restored: ${totalDocs}`);
    console.log(`✅ Collections processed: ${bsonFiles.length}\n`);

    yield mongoose.disconnect();
    console.log('✅ Restore completed successfully!');
    console.log('\n💡 Next step: Run "npm run check-db" to verify the data');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Restore failed:', err.message);
    if (err.stack) console.error(err.stack);
    
    try {
      yield mongoose.disconnect();
    } catch (e) {}
    
    process.exit(1);
  }
}).catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
