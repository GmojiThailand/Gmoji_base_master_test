#!/usr/bin/env node
/**
 * Simple wrapper for mongodump that dumps data from source database.
 * Usage: node scripts/dump-db.js [--uri <source-uri>] [--output <output-dir>]
 * 
 * If --uri is not provided, it will use MONGODB_SOURCE_URL or fallback to MONGODB_URL
 */
'use strict';
require('dotenv').config();

const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
let sourceUri = null;
let outputDir = null;

for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--uri' && i + 1 < process.argv.length) {
    sourceUri = process.argv[i + 1];
    i++;
  } else if (process.argv[i] === '--output' && i + 1 < process.argv.length) {
    outputDir = process.argv[i + 1];
    i++;
  } else if (process.argv[i] === '--help' || process.argv[i] === '-h') {
    console.log('Usage: node scripts/dump-db.js [--uri <source-uri>] [--output <output-dir>]');
    console.log('');
    console.log('Options:');
    console.log('  --uri <uri>     Source MongoDB connection string (default: MONGODB_SOURCE_URL or MONGODB_URL)');
    console.log('  --output <dir>  Output directory for dump (default: ./dump/api-factory)');
    console.log('  --help, -h       Show this help message');
    process.exit(0);
  }
}

// Get source URI from env or argument
if (!sourceUri) {
  sourceUri = process.env.MONGODB_SOURCE_URL || process.env.MONGODB_URL || process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL || process.env.MONGO_URI;
}

if (!sourceUri) {
  console.error('Error: No source MongoDB URI provided.');
  console.error('Set MONGODB_SOURCE_URL environment variable or use --uri option.');
  console.error('Example: node scripts/dump-db.js --uri "mongodb://localhost:27017/api-factory"');
  process.exit(1);
}

// Set default output directory
if (!outputDir) {
  outputDir = path.resolve(__dirname, '..', 'dump', 'api-factory');
}

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('Created output directory:', outputDir);
}

console.log('Source URI (masked):', sourceUri.replace(/(:\/\/[^:]+:)([^@]+)(@)/, (m, a, b, c) => `${a}***${c}`));
console.log('Output directory:', outputDir);
console.log('');

// Build mongodump command
const args = [
  '--uri', sourceUri,
  '--db', 'api-factory',
  '--out', path.dirname(outputDir)
];

console.log('Running: mongodump', args.join(' '));
const runner = child_process.spawn('mongodump', args, { stdio: 'inherit' });

runner.on('close', (code) => {
  if (code === 0) {
    console.log('');
    console.log('✅ Dump completed successfully!');
    console.log('Dump location:', outputDir);
    console.log('');
    console.log('To restore to Atlas, run:');
    console.log('  npm run restore-db --', outputDir);
    process.exit(0);
  } else {
    console.error('');
    console.error('❌ mongodump exited with code', code);
    console.error('Make sure MongoDB Database Tools are installed.');
    console.error('Download from: https://www.mongodb.com/try/download/database-tools');
    process.exit(code);
  }
});

runner.on('error', (err) => {
  console.error('Failed to start mongodump:', err.message);
  console.error('Make sure MongoDB Database Tools are installed.');
  console.error('Download from: https://www.mongodb.com/try/download/database-tools');
  process.exit(1);
});
