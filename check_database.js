/**
 * Script to check database connection and data
 * Run: node check_database.js
 */

'use strict';

// Load environment variables from .env for local testing (Railway vars)
require('dotenv').config();

const SDK = require('./vendor/sdk');
const sdkConfig = require('./config/sdk')();

// Configure SDK
SDK.configure(sdkConfig);

const User = SDK.User;
const Table = SDK.Table;
const Config = SDK.Config;

const co = require('co');

co(function* () {
  console.log('=== Database Connection Check ===\n');
  
  try {
    // Show effective MongoDB connection info
    const urlFromEnv = process.env.MONGODB_URL || process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL || process.env.MONGO_URI;
    if (urlFromEnv) {
      console.log('MongoDB configuration from environment variable (MONGODB_URL / MONGO_URL / MONGO_PUBLIC_URL):');
      console.log('  Connection string (masked):', urlFromEnv.replace(/(:\/\/[^:]+:)([^@]+)(@)/, (m, a, b, c) => `${a}***${c}`));
      try {
        const parts = urlFromEnv.replace('mongodb://', '').split('@');
        const hostPart = parts.length > 1 ? parts[1] : parts[0];
        const [hostAndPort, database] = hostPart.split('/');
        const [host, port] = hostAndPort.split(':');
        console.log('  Host:', host || 'unknown');
        console.log('  Port:', port || '27017');
        console.log('  Database:', database || 'unknown');
      } catch (e) {
        // fallback if parsing errors
      }
    } else {
      // Check MongoDB connection from repo config
      const ConfigModel = require('./vendor/sdk/models/Config')();
      const mongoDBConfig = ConfigModel.db.mongodb;
      console.log('MongoDB Configuration:');
      console.log('  Host:', mongoDBConfig.host || 'localhost');
      console.log('  Port:', mongoDBConfig.port || 27017);
      console.log('  Database:', mongoDBConfig.name || 'api-factory');
      console.log('  Username:', mongoDBConfig.username || '(not set)');
      console.log('  AuthSource:', mongoDBConfig.authSource || '(not set)');
      console.log('');
      // If MONGODB_URL not provided but we have parts, suggest a full connection string
      if ((process.env.MONGOUSER || process.env.MONGO_INITDB_ROOT_USERNAME) && (process.env.MONGOPASSWORD || process.env.MONGO_INITDB_ROOT_PASSWORD) && (process.env.MONGOHOST || process.env.MONGO_HOST)) {
        const u = process.env.MONGOUSER || process.env.MONGO_INITDB_ROOT_USERNAME;
        const p = process.env.MONGOPASSWORD || process.env.MONGO_INITDB_ROOT_PASSWORD;
        const h = process.env.MONGOHOST || process.env.MONGO_HOST;
        const po = process.env.MONGOPORT || process.env.MONGO_PORT || 27017;
        const db = mongoDBConfig.name || 'api-factory';
        const as = mongoDBConfig.authSource || 'admin';
        const suggested = `mongodb://${u}:${p}@${h}:${po}/${db}?authSource=${as}`;
        console.log('Suggested connection string to set as `MONGODB_URL` (masked):', suggested.replace(/(:\/\/[^:]+:)([^@]+)(@)/, (m, a, b, c) => `${a}***${c}`));
        console.log('Set it for local testing (CMD):');
        console.log(`  set MONGODB_URL=${suggested}`);
        console.log('Set in PowerShell:');
        console.log(`  $env:MONGODB_URL = '${suggested}'`);
      }
    }
    console.log('');
    
    // Check application
    const application = yield SDK.Application.find({id: '587640c995ed3c0c59b14600'});
    if (!application) {
      console.error('❌ Application not found!');
      return;
    }
    console.log('✅ Application found:', application.id);
    console.log('');
    
    // Check users table
    console.log('=== Checking Users ===');
    try {
      const testUser = yield User.find({}, {}, application.id);
      if (testUser) {
        console.log('✅ Users table accessible');
        console.log('  Sample user:', {
          id: testUser.id,
          username: testUser.username,
          role: testUser.role ? testUser.role.toString() : 'no role'
        });
      } else {
        console.log('⚠️  Users table accessible but empty');
      }
    } catch (err) {
      console.error('❌ Error accessing users:', err.message);
    }
    console.log('');
    
    // Check for subcontragent users
    console.log('=== Checking Subcontragent Users ===');
    try {
      const RolesDictionary = require('./models/dictionaries/Role');
      const subcontragentRole = RolesDictionary.SUB_CONTRAGENT;
      console.log('  Subcontragent Role ID:', subcontragentRole);
      
      const subcontragentUsers = yield User.findAll(
        {role: subcontragentRole},
        {limit: 10},
        application.id
      );
      
      if (subcontragentUsers && subcontragentUsers.length > 0) {
        console.log(`✅ Found ${subcontragentUsers.length} subcontragent user(s):`);
        subcontragentUsers.forEach((user, index) => {
          console.log(`  ${index + 1}. Username: ${user.username}, ID: ${user.id}`);
        });
      } else {
        console.log('⚠️  No subcontragent users found');
      }
    } catch (err) {
      console.error('❌ Error checking subcontragent users:', err.message);
    }
    console.log('');
    
    // Check subcontragents table
    console.log('=== Checking Subcontragents Table ===');
    try {
      const subcontragentsTable = yield Table.fetch('subcontragents', application.id);
      const subcontragents = yield subcontragentsTable.findAll({}, {limit: 5});
      
      if (subcontragents && subcontragents.length > 0) {
        console.log(`✅ Subcontragents table accessible, found ${subcontragents.length} record(s)`);
        subcontragents.forEach((sc, index) => {
          console.log(`  ${index + 1}. ID: ${sc.id}, user_id: ${sc.user_id}`);
        });
      } else {
        console.log('⚠️  Subcontragents table accessible but empty');
      }
    } catch (err) {
      console.error('❌ Error accessing subcontragents table:', err.message);
    }
    console.log('');
    
    // Check specific username
    console.log('=== Checking Username: "examplename" ===');
    try {
      const user = yield User.find({username: 'examplename'}, {}, application.id);
      if (user) {
        console.log('✅ User found:');
        console.log('  ID:', user.id);
        console.log('  Username:', user.username);
        console.log('  Role:', user.role ? user.role.toString() : 'no role');
        
        if (user.role) {
          const roleStr = user.role.toString ? user.role.toString() : String(user.role);
          const RolesDictionary = require('./models/dictionaries/Role');
          if (roleStr === RolesDictionary.SUB_CONTRAGENT) {
            console.log('  ✅ Role is SUB_CONTRAGENT');
            
            // Check subcontragent record
            const subcontragentsTable = yield Table.fetch('subcontragents', application.id);
            const subcontragent = yield subcontragentsTable.find({user_id: user.id});
            if (subcontragent && subcontragent.data) {
              console.log('  ✅ Subcontragent record found:', subcontragent.data.id);
            } else {
              console.log('  ⚠️  No subcontragent record found for this user');
            }
          } else {
            console.log('  ⚠️  Role is NOT SUB_CONTRAGENT');
          }
        }
      } else {
        console.log('❌ User "examplename" not found');
      }
    } catch (err) {
      console.error('❌ Error checking username:', err.message);
    }
    console.log('');
    
    // Check trying_login_history
    console.log('=== Checking Login History ===');
    try {
      const tryingLoginHistory = yield Table.fetch('trying_login_history', application.id);
      const history = yield tryingLoginHistory.findAll({}, {limit: 5});
      if (history && history.length > 0) {
        console.log(`⚠️  Found ${history.length} login attempt record(s)`);
        history.forEach((h, index) => {
          console.log(`  ${index + 1}. IP: ${h.ip}, Counter: ${h.try_counter}, Last try: ${new Date(h.last_try_time).toLocaleString()}`);
        });
      } else {
        console.log('✅ No failed login attempts recorded');
      }
    } catch (err) {
      console.error('❌ Error checking login history:', err.message);
    }
    console.log('');
    
    console.log('=== Check Complete ===');
    
  } catch (error) {
    console.error('❌ Fatal Error:', error);
    console.error(error.stack);
  }
  
  process.exit(0);
}).catch((err) => {
  console.error('❌ Unhandled Error:', err);
  process.exit(1);
});

// Global handlers to make output friendlier on connection issues
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err && err.message ? err.message : err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err && err.message ? err.message : err);
  process.exit(1);
});

