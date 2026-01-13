#!/usr/bin/env node
/**
 * Simple wrapper for mongorestore that takes a directory/path and uses MONGODB_URL.
 * Usage: node scripts/restore-db.js <path-to-dump>
 */
'use strict';
require('dotenv').config();

const child_process = require('child_process');
const path = require('path');

const uri = process.env.MONGODB_URL || process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL || process.env.MONGO_URI;
if (!uri) {
  console.error('MONGODB_URL is not set. Export MONGODB_URL or MONGO_URL to proceed.');
  process.exit(1);
}

if (process.argv.length < 3) {
  console.error('Usage: node scripts/restore-db.js <path-to-dump>');
  process.exit(1);
}

// Parse optional --drop flag
let dropFlag = false;
let argsIndex = 2;
if (process.argv.length > 2 && (process.argv[2] === '--drop' || process.argv[2] === '-d')) {
  dropFlag = true;
  argsIndex = 3;
}
if (process.argv.length <= argsIndex) {
  console.error('Usage: node scripts/restore-db.js [--drop] <path-to-dump>');
  process.exit(1);
}
const dumpPath = path.resolve(process.argv[argsIndex]);

console.log('Using MONGODB_URL (masked):', uri.replace(/(:\/\/[^:]+:)([^@]+)(@)/, (m, a, b, c) => `${a}***${c}`));
console.log('Dump path:', dumpPath);

const args = ['--uri', uri, '--nsInclude', 'api-factory.*'];
if (dropFlag) args.push('--drop');
args.push(dumpPath);
const cmd = 'mongorestore';

console.log('Running:', cmd, args.join(' '));
const runner = child_process.spawn(cmd, args, { stdio: 'inherit' });

runner.on('close', (code) => {
  if (code === 0) {
    console.log('Restore completed');
    process.exit(0);
  }
  console.error('mongorestore exited with code', code);
  process.exit(code);
});
