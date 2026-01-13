#!/usr/bin/env node
/**
 * Create admin user with admin role
 * Usage: node scripts/create-admin-user.js [username] [password] [role]
 * 
 * Roles:
 *   ADMIN_SUPER: 58808abccf1f550f22a8c02a (Super Admin)
 *   ADMIN_FIRST: 589732e094431f63462f88b0 (First Admin)
 *   ADMIN_SECOND: 5a6c6259687aff073c580af3 (Second Admin)
 */
'use strict';
require('dotenv').config();

const co = require('co');
const SDK = require('../vendor/sdk');
const sdkConfig = require('../config/sdk')();
const RolesDictionary = require('../models/dictionaries/Role');

SDK.configure(sdkConfig);

const username = process.argv[2] || 'admin@gmoji.com';
const password = process.argv[3] || 'Admin123456';
const roleId = process.argv[4] || RolesDictionary.ADMIN_FIRST; // Default to ADMIN_FIRST
const applicationId = '587640c995ed3c0c59b14600';

co(function* () {
  console.log('=== Creating Admin User ===\n');
  
  const Application = SDK.Application;
  const application = yield Application.find({id: applicationId});
  if (!application) {
    console.error('❌ Application not found');
    process.exit(1);
  }

  console.log('Application:', application.id);
  console.log('Username:', username);
  console.log('Role ID:', roleId);
  console.log('');

  const User = SDK.User;
  
  // Check if user already exists
  const existing = yield User.find({username}, {}, application.id).catch(() => null);
  if (existing) {
    console.log('⚠️  User already exists:', existing.id, existing.username);
    console.log('   Current role:', existing.role ? existing.role.toString() : 'null');
    
    // Update role if needed
    if (!existing.role || existing.role.toString() !== roleId) {
      console.log('   Updating role to:', roleId);
      yield existing.update({ role: require('mongoose').Types.ObjectId(roleId) });
      console.log('   ✅ Role updated');
    }
    process.exit(0);
  }

  // Create user with admin role
  console.log('Creating admin user...');
  let userObj = new User({ 
    username,
    role: require('mongoose').Types.ObjectId(roleId),
    type: 'oauth'
  }, application.id);
  
  // Use setter so password is hashed
  userObj.password = password;
  
  try {
    const saved = yield userObj.save();
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('User details:');
    console.log('  ID:', saved.id);
    console.log('  Username:', saved.username);
    console.log('  Role:', saved.role ? saved.role.toString() : 'null');
    console.log('  Type:', saved.type || 'oauth');
    console.log('');
    console.log('💡 You can now login with:');
    console.log('   Username:', username);
    console.log('   Password:', password);
    console.log('');
  } catch (e) {
    console.error('❌ Error creating user:', e && e.message ? e.message : e);
    if (e && e.stack) console.error(e.stack);
    process.exit(1);
  }
  
  process.exit(0);
}).catch((e) => {
  console.error('❌ Fatal error:', e && e.message ? e.message : e);
  if (e && e.stack) console.error(e.stack);
  process.exit(1);
});
