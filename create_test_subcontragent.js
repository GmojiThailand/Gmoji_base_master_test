/**
 * Script to create a test subcontragent user
 * Run: node create_test_subcontragent.js
 */

'use strict';

const SDK = require('./vendor/sdk');
const sdkConfig = require('./config/sdk')();

// Configure SDK
SDK.configure(sdkConfig);

const User = SDK.User;
const Table = SDK.Table;
const RolesDictionary = require('./models/dictionaries/Role');
const StatusesDictionary = require('./models/dictionaries/Status');
const CreateNewSca = require('./models/utils/CreateNewSca');

const co = require('co');

co(function* () {
  console.log('=== Create Test Subcontragent ===\n');
  
  try {
    // Get application
    const application = yield SDK.Application.find({id: '587640c995ed3c0c59b14600'});
    if (!application) {
      console.error('❌ Application not found!');
      return;
    }
    console.log('✅ Application found:', application.id);
    console.log('');
    
    // Check if user already exists
    console.log('=== Checking if user exists ===');
    const existingUser = yield User.find({username: 'examplename'}, {}, application.id);
    if (existingUser) {
      console.log('⚠️  User "examplename" already exists!');
      console.log('  ID:', existingUser.id);
      console.log('  Role:', existingUser.role ? existingUser.role.toString() : 'no role');
      
      // Check if it's a subcontragent
      if (existingUser.role) {
        const roleStr = existingUser.role.toString ? existingUser.role.toString() : String(existingUser.role);
        if (roleStr === RolesDictionary.SUB_CONTRAGENT) {
          console.log('  ✅ User is already a subcontragent');
          
          // Check subcontragent record
          const subcontragentsTable = yield Table.fetch('subcontragents', application.id);
          const subcontragent = yield subcontragentsTable.find({user_id: existingUser.id});
          if (subcontragent && subcontragent.data) {
            console.log('  ✅ Subcontragent record exists:', subcontragent.data.id);
            console.log('\n✅ User is ready to use!');
            console.log('  Username: examplename');
            console.log('  Password: examplename (default)');
            return;
          }
        }
      }
    } else {
      console.log('✅ User does not exist, will create new one');
    }
    console.log('');
    
    // Check for existing contragents
    console.log('=== Checking for Contragents ===');
    const contragentsTable = yield Table.fetch('contragents', application.id);
    const contragents = yield contragentsTable.findAll({}, {limit: 5});
    
    let contragentId = null;
    
    if (contragents && contragents.length > 0) {
      console.log(`✅ Found ${contragents.length} contragent(s)`);
      // Use the first contragent
      contragentId = contragents[0].user_id;
      console.log('  Using contragent ID:', contragentId);
    } else {
      console.log('⚠️  No contragents found');
      console.log('  Creating a test contragent first...');
      
      // Create a test contragent
      const contragentRole = RolesDictionary.CONTRAGENT;
      const testContragentUser = new User(
        {
          username: 'test_contragent_' + Date.now(),
          role: contragentRole,
          type: 'oauth',
        },
        application.id
      );
      testContragentUser.password = testContragentUser.username;
      yield testContragentUser.save();
      
      console.log('  ✅ Created test contragent user:', testContragentUser.username);
      
      // Create contragent record
      const newContragent = {
        user_id: testContragentUser.id,
        email: testContragentUser.username,
        name: 'Test Contragent',
        status: StatusesDictionary.ACTIVE,
        commission_common: 0, // Required field
      };
      const createdContragent = yield contragentsTable.create(newContragent);
      contragentId = testContragentUser.id;
      
      console.log('  ✅ Created contragent record:', createdContragent.id);
    }
    console.log('');
    
    // Create subcontragent
    console.log('=== Creating Subcontragent ===');
    try {
      const newSubcontragent = yield CreateNewSca.exec(
        application,
        {
          contragentId: contragentId,
          username: 'examplename',
        }
      );
      
      console.log('✅ Subcontragent created successfully!');
      console.log('  Subcontragent ID:', newSubcontragent.id);
      console.log('  User ID:', newSubcontragent.user_id);
      console.log('  Contragent ID:', newSubcontragent.contragent_id);
      console.log('');
      console.log('=== Login Credentials ===');
      console.log('  Username: examplename');
      console.log('  Password: examplename (default password is username)');
      console.log('');
      console.log('✅ You can now test the login endpoint!');
      
    } catch (error) {
      console.error('❌ Error creating subcontragent:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal Error:', error);
    console.error(error.stack);
  }
  
  process.exit(0);
}).catch((err) => {
  console.error('❌ Unhandled Error:', err);
  process.exit(1);
});

