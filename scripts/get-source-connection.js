#!/usr/bin/env node
/**
 * Get source MongoDB connection string from project config
 */
'use strict';

const Config = require('../vendor/sdk/models/Config')();
const sdkConfig = require('../config/sdk')();

// Get MongoDB config
const mongoConfig = sdkConfig.db.mongodb || Config.db.mongodb || {};

const host = mongoConfig.host || 'localhost';
const port = mongoConfig.port || 27017;
const dbName = mongoConfig.name || 'api-factory';
const username = mongoConfig.username;
const password = mongoConfig.password;
const authSource = mongoConfig.authSource || 'admin';

let connectionString = 'mongodb://';

if (username && password) {
  connectionString += `${username}:${password}@`;
}

connectionString += `${host}:${port}/${dbName}`;

if (username && password && authSource) {
  connectionString += `?authSource=${authSource}`;
}

console.log(connectionString);
