# 🔧 แก้ไขปัญหา Migration

## ❌ ปัญหาที่พบ:
```
MongooseServerSelectionError: connect ECONNREFUSED ::1:27017
```

**สาเหตุ:** ไม่มี MongoDB local ทำงานอยู่ที่ `localhost:27017`

---

## ✅ วิธีแก้ไข:

### วิธีที่ 1: ใช้ฐานข้อมูลเดิมที่อื่น (แนะนำ)

ถ้าฐานข้อมูลเดิมอยู่ที่ remote server หรือ Atlas อื่น:

1. **แก้ไขไฟล์ `.env`** เปลี่ยน `MONGODB_SOURCE_URL` เป็น connection string ของฐานข้อมูลจริง:

```env
# แทนที่ connection string นี้
MONGODB_SOURCE_URL=mongodb://localhost:27017/api-factory

# ด้วย connection string ของฐานข้อมูลจริง เช่น:
MONGODB_SOURCE_URL=mongodb://username:password@host:port/api-factory?authSource=admin
# หรือ
MONGODB_SOURCE_URL=mongodb+srv://user:pass@cluster.mongodb.net/api-factory
```

2. **รัน migrate อีกครั้ง:**
```powershell
npm run migrate-to-atlas
```

---

### วิธีที่ 2: ใช้ฐานข้อมูลเดิมที่ localhost

ถ้าต้องการใช้ localhost ต้อง:

1. **ติดตั้งและรัน MongoDB local:**
   - ดาวน์โหลด: https://www.mongodb.com/try/download/community
   - ติดตั้งและรัน MongoDB service

2. **ตรวจสอบว่า MongoDB ทำงานอยู่:**
```powershell
# ตรวจสอบว่า MongoDB service ทำงานอยู่
Get-Service | Where-Object {$_.Name -like "*mongo*"}
```

3. **รัน migrate อีกครั้ง:**
```powershell
npm run migrate-to-atlas
```

---

## 📝 ตัวอย่าง Connection String:

### Localhost (ไม่มี auth):
```
MONGODB_SOURCE_URL=mongodb://localhost:27017/api-factory
```

### Localhost (มี auth):
```
MONGODB_SOURCE_URL=mongodb://username:password@localhost:27017/api-factory?authSource=admin
```

### Remote Server:
```
MONGODB_SOURCE_URL=mongodb://username:password@host:port/api-factory?authSource=admin
```

### MongoDB Atlas:
```
MONGODB_SOURCE_URL=mongodb+srv://username:password@cluster.mongodb.net/api-factory?retryWrites=true&w=majority
```

---

## 🔍 ตรวจสอบ Connection String:

ใช้ script นี้เพื่อตรวจสอบ connection string จาก config:

```powershell
node scripts/get-source-connection.js
```

---

## ⚠️ หมายเหตุ:

- **ถ้าฐานข้อมูลเดิมอยู่ที่ Atlas อื่น:** ใช้ connection string จาก Atlas dashboard
- **ถ้าฐานข้อมูลเดิมอยู่ที่ remote server:** ต้องมี network access และ credentials ที่ถูกต้อง
- **ถ้าฐานข้อมูลเดิมอยู่ที่ localhost:** ต้องรัน MongoDB local ก่อน

---

## ✅ พร้อมใช้เมื่อ:

- มี `MONGODB_SOURCE_URL` ที่ชี้ไปยังฐานข้อมูลเดิมที่เชื่อมต่อได้
- มี `MONGODB_URL` ที่ชี้ไปยัง MongoDB Atlas (ตั้งค่าแล้ว)
- Network access ถูกต้อง (ถ้าใช้ remote server)
