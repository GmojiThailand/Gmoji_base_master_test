#!/usr/bin/env node
/**
 * Setup and Check Script - ตรวจสอบและเตรียมทุกอย่างให้พร้อมใช้งาน
 * สำหรับผู้ที่ซื้อโค้ดมาและไม่รู้เรื่อง
 */
'use strict';
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

console.log('═══════════════════════════════════════════════════════');
console.log('  🔍 ตรวจสอบและเตรียมระบบให้พร้อมใช้งาน');
console.log('═══════════════════════════════════════════════════════\n');

// 1. ตรวจสอบไฟล์ .env
console.log('📄 1. ตรวจสอบไฟล์ .env...');
const envPath = path.join(__dirname, '..', '.env');
let envExists = fs.existsSync(envPath);
let envContent = '';

if (envExists) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('   ✅ พบไฟล์ .env');
} else {
  console.log('   ⚠️  ไม่พบไฟล์ .env - จะสร้างให้');
  envContent = '';
}

// ตรวจสอบ MONGODB_URL (Atlas)
const hasMongoDBUrl = /MONGODB_URL\s*=/.test(envContent);
const hasSourceUrl = /MONGODB_SOURCE_URL\s*=/.test(envContent);

console.log('');
console.log('📊 2. ตรวจสอบการตั้งค่า:');
console.log(`   ${hasMongoDBUrl ? '✅' : '❌'} MONGODB_URL (Atlas): ${hasMongoDBUrl ? 'ตั้งค่าแล้ว' : 'ยังไม่ได้ตั้งค่า'}`);
console.log(`   ${hasSourceUrl ? '✅' : '❌'} MONGODB_SOURCE_URL (ฐานข้อมูลเดิม): ${hasSourceUrl ? 'ตั้งค่าแล้ว' : 'ยังไม่ได้ตั้งค่า'}`);

// 3. อ่าน config จากโปรเจกต์
console.log('');
console.log('⚙️  3. ตรวจสอบ Config จากโปรเจกต์...');
try {
  const Config = require('../vendor/sdk/models/Config')();
  const sdkConfig = require('../config/sdk')();
  const mongoConfig = sdkConfig.db.mongodb || Config.db.mongodb || {};
  
  console.log('   📋 Config ที่พบ:');
  console.log(`      Host: ${mongoConfig.host || 'localhost'}`);
  console.log(`      Port: ${mongoConfig.port || 27017}`);
  console.log(`      Database: ${mongoConfig.name || 'api-factory'}`);
  console.log(`      Username: ${mongoConfig.username || '(ไม่ระบุ)'}`);
  console.log(`      Password: ${mongoConfig.password ? '***' : '(ไม่ระบุ)'}`);
  
  // สร้าง connection string จาก config
  const host = mongoConfig.host || 'localhost';
  const port = mongoConfig.port || 27017;
  const dbName = mongoConfig.name || 'api-factory';
  const username = mongoConfig.username;
  const password = mongoConfig.password;
  const authSource = mongoConfig.authSource || 'admin';
  
  let suggestedSourceUrl = 'mongodb://';
  if (username && password) {
    suggestedSourceUrl += `${username}:${password}@`;
  }
  suggestedSourceUrl += `${host}:${port}/${dbName}`;
  if (username && password && authSource) {
    suggestedSourceUrl += `?authSource=${authSource}`;
  }
  
  console.log(`   💡 Connection String ที่แนะนำ: ${suggestedSourceUrl}`);
  
} catch (err) {
  console.log('   ⚠️  ไม่สามารถอ่าน config ได้:', err.message);
}

// 4. ตรวจสอบการเชื่อมต่อ Atlas
console.log('');
console.log('🌐 4. ตรวจสอบการเชื่อมต่อ MongoDB Atlas...');
const atlasUrl = process.env.MONGODB_URL || process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL || process.env.MONGO_URI;

if (atlasUrl) {
  console.log('   📡 กำลังทดสอบการเชื่อมต่อ...');
  mongoose.connect(atlasUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  }).then(() => {
    console.log('   ✅ เชื่อมต่อ Atlas สำเร็จ!');
    mongoose.disconnect();
    checkComplete();
  }).catch((err) => {
    console.log(`   ❌ ไม่สามารถเชื่อมต่อ Atlas ได้: ${err.message}`);
    console.log('   💡 ตรวจสอบ:');
    console.log('      - Network Access ใน Atlas (เพิ่ม IP address)');
    console.log('      - Connection string ถูกต้องหรือไม่');
    console.log('      - Username/Password ถูกต้องหรือไม่');
    checkComplete();
  });
} else {
  console.log('   ⚠️  ไม่พบ MONGODB_URL - ยังไม่ได้ตั้งค่า Atlas');
  checkComplete();
}

function checkComplete() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  📝 สรุปและคำแนะนำ');
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (!hasMongoDBUrl) {
    console.log('❌ ยังไม่ได้ตั้งค่า MONGODB_URL (MongoDB Atlas)');
    console.log('   📝 วิธีแก้: เพิ่มในไฟล์ .env:');
    console.log('      MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/api-factory');
    console.log('');
  }
  
  if (!hasSourceUrl) {
    console.log('❌ ยังไม่ได้ตั้งค่า MONGODB_SOURCE_URL (ฐานข้อมูลเดิม)');
    console.log('   📝 วิธีแก้: เพิ่มในไฟล์ .env:');
    console.log('      MONGODB_SOURCE_URL=mongodb://localhost:27017/api-factory');
    console.log('   หรือถ้าฐานข้อมูลเดิมอยู่ที่อื่น:');
    console.log('      MONGODB_SOURCE_URL=mongodb://username:password@host:port/api-factory');
    console.log('');
  }
  
  if (hasMongoDBUrl && hasSourceUrl) {
    console.log('✅ ทุกอย่างพร้อมแล้ว!');
    console.log('');
    console.log('🚀 ขั้นตอนต่อไป:');
    console.log('   1. ตรวจสอบว่า MONGODB_SOURCE_URL ชี้ไปยังฐานข้อมูลเดิมที่เชื่อมต่อได้');
    console.log('   2. รันคำสั่ง: npm run migrate-to-atlas');
    console.log('   3. ตรวจสอบผลลัพธ์: npm run check-db');
    console.log('');
  } else {
    console.log('⚠️  ยังมีบางอย่างที่ต้องตั้งค่า');
    console.log('   ดูคู่มือใน README_MIGRATE.md หรือ QUICK_MIGRATE.md');
    console.log('');
  }
  
  console.log('📚 ไฟล์คู่มือที่มี:');
  console.log('   - README_MIGRATE.md - คู่มือการ migrate');
  console.log('   - QUICK_MIGRATE.md - คู่มือแบบย่อ');
  console.log('   - FIX_MIGRATE.md - แก้ไขปัญหา');
  console.log('');
  
  process.exit(0);
}
