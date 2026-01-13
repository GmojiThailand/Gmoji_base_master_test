#!/usr/bin/env node
/**
 * Create Application record if it doesn't exist
 */
'use strict';
require('dotenv').config();

const mongoose = require('mongoose');
const co = require('co');
const SDK = require('../vendor/sdk');
const sdkConfig = require('../config/sdk')();

SDK.configure(sdkConfig);

const Application = SDK.Application;
const User = SDK.User;

co(function* () {
  try {
    console.log('=== Creating Application Record ===\n');
    
    // Check if application exists
    let application;
    try {
      application = yield Application.find({id: '587640c995ed3c0c59b14600'});
      console.log('✅ Application already exists:', application.id);
      console.log('   Name:', application.name);
      process.exit(0);
    } catch (err) {
      if (err.status !== 404 && err.message !== 'Application not found') {
        throw err;
      }
      console.log('⚠️  Application not found, creating new one...\n');
    }

    // Create application using mongoose directly
    // SDK uses collection name 'applications' (plural, lowercase)
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const ApplicationsCollection = db.collection('applications'); // SDK uses plural
    
    const appId = require('mongoose').Types.ObjectId('587640c995ed3c0c59b14600');
    
    // Check if exists in 'applications' collection
    let existingApp = yield ApplicationsCollection.findOne({_id: appId});
    
    if (!existingApp) {
      // Check if exists in 'application' collection (singular) and copy it
      const ApplicationCollection = db.collection('application');
      const appInSingular = yield ApplicationCollection.findOne({_id: appId});
      
      if (appInSingular) {
        console.log('Found application in "application" collection, copying to "applications"...');
        // Copy to applications collection
        const appData = {
          _id: appId,
          name: appInSingular.name || 'base',
          secret: appInSingular.secret || require('crypto').randomBytes(32).toString('hex'),
          admins: appInSingular.admins || [],
          options: appInSingular.options || {}
        };
        yield ApplicationsCollection.insertOne(appData);
        console.log('✅ Application copied to "applications" collection');
      } else {
        // Create new
        const appData = {
          _id: appId,
          name: 'base',
          secret: require('crypto').randomBytes(32).toString('hex'),
          admins: [],
          options: {}
        };
        yield ApplicationsCollection.insertOne(appData);
        console.log('✅ Application created in "applications" collection');
      }
    } else {
      console.log('✅ Application already exists in "applications" collection');
    }
    
    // Now fetch it using SDK
    application = yield Application.find({id: '587640c995ed3c0c59b14600'});
    console.log('✅ Application accessible via SDK!');
    console.log('   ID:', application.id);
    console.log('   Name:', application.name);
    
    console.log('');
    console.log('💡 Note: You may need to add admin users to the application later');
    console.log('   Use: npm run promote-user-role -- <username> <role>');
    
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
});
