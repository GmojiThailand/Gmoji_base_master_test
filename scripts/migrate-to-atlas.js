#!/usr/bin/env node
/**
 * Migrate data from source MongoDB to MongoDB Atlas
 * Uses Node.js/mongoose - no need for mongodump/mongorestore
 * 
 * Usage: node scripts/migrate-to-atlas.js [--source <source-uri>]
 */
'use strict';
require('dotenv').config();

const mongoose = require('mongoose');
const co = require('co');

// Parse command line arguments
let sourceUri = null;
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--source' && i + 1 < process.argv.length) {
    sourceUri = process.argv[i + 1];
    i++;
  } else if (process.argv[i] === '--help' || process.argv[i] === '-h') {
    console.log('Usage: node scripts/migrate-to-atlas.js [--source <source-uri>]');
    console.log('');
    console.log('Options:');
    console.log('  --source <uri>  Source MongoDB connection string');
    console.log('                 (default: MONGODB_SOURCE_URL or mongodb://localhost:27017/api-factory)');
    console.log('  --help, -h      Show this help message');
    process.exit(0);
  }
}

// Get source URI
if (!sourceUri) {
  sourceUri = process.env.MONGODB_SOURCE_URL;
  
  if (!sourceUri) {
    console.log('ℹ️  No source database specified.');
    console.log('');
    console.log('Please set MONGODB_SOURCE_URL in .env file or use --source option:');
    console.log('');
    console.log('  Example 1: Add to .env file:');
    console.log('    MONGODB_SOURCE_URL=mongodb://localhost:27017/api-factory');
    console.log('');
    console.log('  Example 2: Use --source option:');
    console.log('    npm run migrate-to-atlas -- --source "mongodb://localhost:27017/api-factory"');
    console.log('');
    console.log('  Example 3: With username/password:');
    console.log('    MONGODB_SOURCE_URL=mongodb://user:pass@host:port/api-factory?authSource=admin');
    console.log('');
    process.exit(1);
  }
}

// Get target URI (Atlas)
const targetUri = process.env.MONGODB_URL || process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL || process.env.MONGO_URI;
if (!targetUri) {
  console.error('❌ Error: MONGODB_URL is not set in .env file');
  console.error('Please set MONGODB_URL to your Atlas connection string');
  process.exit(1);
}

const maskUri = (uri) => uri.replace(/(:\/\/[^:]+:)([^@]+)(@)/, (m, a, b, c) => `${a}***${c}`);

console.log('=== MongoDB Migration Tool ===\n');
console.log('Source:', maskUri(sourceUri));
console.log('Target:', maskUri(targetUri));
console.log('');

let sourceConn = null;
let targetConn = null;

co(function* () {
  try {
    // Connect to source database
    console.log('📡 Connecting to source database...');
    sourceConn = mongoose.createConnection(sourceUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    yield new Promise((resolve, reject) => {
      sourceConn.once('connected', resolve);
      sourceConn.once('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
    console.log('✅ Connected to source database\n');

    // Connect to target database (Atlas)
    console.log('📡 Connecting to target database (Atlas)...');
    targetConn = mongoose.createConnection(targetUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    yield new Promise((resolve, reject) => {
      targetConn.once('connected', resolve);
      targetConn.once('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
    console.log('✅ Connected to target database (Atlas)\n');

    // Get source database
    const sourceDb = sourceConn.db;
    const targetDb = targetConn.db;

    // List all collections in source database
    console.log('📋 Listing collections...');
    const collections = yield sourceDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections:\n`);
    
    const collectionNames = collections.map(c => c.name).filter(name => !name.startsWith('system.'));
    console.log(collectionNames.map(n => `  - ${n}`).join('\n'));
    console.log('');

    // Ask for confirmation (in production, you might want to skip this)
    console.log('⚠️  This will copy all data from source to target.');
    console.log('⚠️  Existing data in target collections will be preserved (no drop).\n');

    // Migrate each collection
    let totalDocs = 0;
    for (const collectionName of collectionNames) {
      try {
        console.log(`📦 Migrating collection: ${collectionName}...`);
        
        const sourceCollection = sourceDb.collection(collectionName);
        const targetCollection = targetDb.collection(collectionName);

        // Count documents
        const count = yield sourceCollection.countDocuments();
        console.log(`   Found ${count} documents`);

        if (count === 0) {
          console.log(`   ⏭️  Skipping empty collection\n`);
          continue;
        }

        // Read all documents in batches
        const batchSize = 1000;
        let migrated = 0;
        let skip = 0;

        while (skip < count) {
          const batch = yield sourceCollection.find({}).skip(skip).limit(batchSize).toArray();
          
          if (batch.length === 0) break;

          // Insert batch into target
          if (batch.length > 0) {
            try {
              yield targetCollection.insertMany(batch, { ordered: false });
            } catch (err) {
              // If duplicate key error, try inserting one by one
              if (err.code === 11000) {
                console.log(`   ⚠️  Some documents already exist, inserting individually...`);
                for (const doc of batch) {
                  try {
                    yield targetCollection.insertOne(doc);
                    migrated++;
                  } catch (e) {
                    if (e.code !== 11000) {
                      console.error(`   ❌ Error inserting document:`, e.message);
                    }
                    // Skip duplicates
                  }
                }
                skip += batch.length;
                continue;
              }
              throw err;
            }
          }

          migrated += batch.length;
          skip += batch.length;
          
          process.stdout.write(`   Progress: ${migrated}/${count} documents\r`);
        }

        console.log(`   ✅ Migrated ${migrated} documents\n`);
        totalDocs += migrated;

      } catch (err) {
        console.error(`   ❌ Error migrating ${collectionName}:`, err.message);
        console.error(`   Continuing with next collection...\n`);
      }
    }

    console.log('=== Migration Summary ===');
    console.log(`✅ Total documents migrated: ${totalDocs}`);
    console.log(`✅ Collections processed: ${collectionNames.length}\n`);

    // Close connections
    yield sourceConn.close();
    yield targetConn.close();
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    if (err.stack) console.error(err.stack);
    
    if (sourceConn) {
      try { yield sourceConn.close(); } catch (e) {}
    }
    if (targetConn) {
      try { yield targetConn.close(); } catch (e) {}
    }
    
    process.exit(1);
  }
});
