#!/usr/bin/env node
/**
 * Helper script to generate or display a recommended MONGODB_URL value
 * Usage: node scripts/generate-mongodb-url.js
 */

'use strict';
require('dotenv').config();

const util = require('util');

function maskPassword(uri) {
  return uri.replace(/(:\/\/[^:]+:)([^@]+)(@)/, (m, a, b, c) => `${a}***${c}`);
}

function assembleFromParts({ user, pass, host, port, name, authSource }) {
  if (!host || !port) return null;
  const userpart = user && pass ? `${user}:${pass}@` : '';
  const db = name || 'api-factory';
  const qs = authSource ? `?authSource=${authSource}` : '';
  return `mongodb://${userpart}${host}:${port}/${db}${qs}`;
}

function main() {
  const env = process.env;
  // prefer explicit environment variables
  const explicitCandidates = ['MONGODB_URL', 'MONGO_URL', 'MONGO_PUBLIC_URL', 'MONGO_URI'];
  for (const key of explicitCandidates) {
    if (env[key]) {
      console.log('Using existing env variable:', key);
      console.log('  Value (masked):', maskPassword(env[key]));
      console.log('');
      console.log('Copy this value and set as Shared Variable `MONGODB_URL` in Railway (recommended)');
      return;
    }
  }

  // try to assemble from individual parts
  const parts = {
    user: env.MONGOUSER || env.MONGO_INITDB_ROOT_USERNAME || env.MONGO_USER || env.MONGO_USERNAME,
    pass: env.MONGOPASSWORD || env.MONGO_INITDB_ROOT_PASSWORD || env.MONGO_PASSWORD,
    host: env.MONGOHOST || env.MONGO_HOST || env.MONGO_HOSTNAME,
    port: env.MONGOPORT || env.MONGO_PORT || 27017,
    name: env.MONGO_DB || env.DB_NAME || 'api-factory',
    authSource: env.MONGO_AUTH_SOURCE || env.MONGO_AUTHSOURCE || 'admin',
  };

  const assembled = assembleFromParts(parts);
  if (assembled) {
    console.log('Constructed MONGODB_URL from available env variables:');
    console.log('  Value (masked):', maskPassword(assembled));
    console.log('');
    console.log('To use locally (Windows CMD):');
    console.log(`  set MONGODB_URL=${assembled}`);
    console.log('To use locally (PowerShell):');
    console.log(`  $env:MONGODB_URL = '${assembled}'`);
    console.log('');
    console.log('Copy the value above and set it as a Shared Variable named `MONGODB_URL` in Railway');
    return;
  }

  console.log('Could not find sufficient environment variables to construct the connection string.');
  console.log('Set your `MONGODB_URL` explicitly (use MONGO_PUBLIC_URL or MONGO_URL from Railway)');
}

main();
