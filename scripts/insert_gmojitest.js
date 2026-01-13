#!/usr/bin/env node
// Insert GmojiTest user via Node. Usage:
//  set MONGODB_URL=mongodb://user:pass@host:port/db?authSource=admin
//  node scripts/insert_gmojitest.js

const { MongoClient, ObjectId } = require('mongodb');

async function run() {
  const uri = process.env.MONGODB_URL || process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL || 'mongodb://localhost:27017/api-factory';
  console.log('Using MongoDB URI (masked):', uri.replace(/(:\/\/[^:]+:)([^@]+)(@)/, (m, a, b, c) => `${a}***${c}`));

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const dbName = (() => {
      try {
        const u = new URL(uri);
        return u.pathname && u.pathname.replace(/^\//, '') || 'api-factory';
      } catch (e) {
        return 'api-factory';
      }
    })();

    const db = client.db(dbName);

    // App-specific users collection used in repo migrations
    const collName = 'user_587640c995ed3c0c59b14600';
    const users = db.collection(collName);

    const username = 'GmojiTest';
    const passwordHash = 'b9b57aae83585e17ede4570dcede353c';
    const roleId = '58b40f669154c320f9831bfa';

    // Check existing
    const exists = await users.findOne({ username });
    if (exists) {
      console.log('User already exists:', exists._id.toString());
      process.exit(0);
    }

    const doc = {
      username,
      password: passwordHash,
      role: ObjectId(roleId),
      type: 'oauth',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const res = await users.insertOne(doc);
    console.log('Inserted user id:', res.insertedId.toString());
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exitCode = 2;
  } finally {
    try { await client.close(); } catch (e) {}
  }
}

run();
