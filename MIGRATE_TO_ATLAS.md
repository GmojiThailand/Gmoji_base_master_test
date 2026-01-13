# คู่มือการ Migrate ข้อมูลไปยัง MongoDB Atlas

## ขั้นตอนที่ 1: ติดตั้ง MongoDB Database Tools

### Windows:
1. **วิธีที่ 1: ใช้ Chocolatey (แนะนำ)**
   ```powershell
   choco install mongodb-database-tools
   ```

2. **วิธีที่ 2: ดาวน์โหลดจากเว็บไซต์**
   - ไปที่: https://www.mongodb.com/try/download/database-tools
   - เลือก Windows และดาวน์โหลด
   - ติดตั้งและเพิ่ม PATH

### ตรวจสอบการติดตั้ง:
```powershell
mongodump --version
mongorestore --version
```

---

## ขั้นตอนที่ 2: Dump ข้อมูลจากฐานข้อมูลเดิม

### ถ้าฐานข้อมูลเดิมอยู่ที่ localhost:
```powershell
# ตั้งค่า connection string ของฐานข้อมูลเดิม
$env:MONGODB_SOURCE_URL = "mongodb://localhost:27017/api-factory"

# หรือถ้าใช้ username/password
$env:MONGODB_SOURCE_URL = "mongodb://username:password@localhost:27017/api-factory?authSource=admin"

# Dump ข้อมูล
npm run dump-db
```

### ถ้าฐานข้อมูลเดิมอยู่ที่ remote server:
```powershell
# ตั้งค่า connection string ของฐานข้อมูลเดิม
$env:MONGODB_SOURCE_URL = "mongodb://username:password@host:port/api-factory?authSource=admin"

# Dump ข้อมูล
npm run dump-db
```

### หรือใช้ --uri option:
```powershell
npm run dump-db -- --uri "mongodb://username:password@host:port/api-factory"
```

**ผลลัพธ์:** ข้อมูลจะถูก dump ไปที่ `./dump/api-factory/`

---

## ขั้นตอนที่ 3: Restore ข้อมูลไปยัง MongoDB Atlas

### ตรวจสอบว่าไฟล์ .env มี MONGODB_URL ตั้งค่าเป็น Atlas แล้ว:
```powershell
Get-Content .env
```

ควรเห็น:
```
MONGODB_URL=mongodb+srv://SupportGmoji:Gmojisupport3459@gmoji-base-cluster.hsl5bp6.mongodb.net/api-factory?retryWrites=true&w=majority&appName=gmoji-base-cluster
```

### Restore ข้อมูล:
```powershell
# Restore โดยไม่ drop collections เดิม (ถ้ามี)
npm run restore-db -- ./dump/api-factory

# หรือ Restore โดย drop collections เดิมก่อน (แนะนำถ้าเป็น database ใหม่)
npm run restore-db -- --drop ./dump/api-factory
```

---

## ขั้นตอนที่ 4: ตรวจสอบข้อมูล

```powershell
npm run check-db
```

---

## ตัวอย่างการ Migrate แบบเต็ม

```powershell
# 1. ตั้งค่า connection string ของฐานข้อมูลเดิม
$env:MONGODB_SOURCE_URL = "mongodb://localhost:27017/api-factory"

# 2. Dump ข้อมูล
npm run dump-db

# 3. ตรวจสอบว่า .env มี MONGODB_URL ตั้งค่าเป็น Atlas แล้ว
Get-Content .env

# 4. Restore ไปยัง Atlas (drop collections เดิมก่อน)
npm run restore-db -- --drop ./dump/api-factory

# 5. ตรวจสอบข้อมูล
npm run check-db
```

---

## หมายเหตุสำคัญ

1. **Network Access:** ตรวจสอบว่า IP address ของคุณถูกอนุญาตใน MongoDB Atlas Network Access
   - ไปที่ Atlas → Network Access → Add IP Address
   - หรือใช้ "Allow Access from Anywhere" (0.0.0.0/0) สำหรับการ migrate ชั่วคราว

2. **Database User:** ตรวจสอบว่า user `SupportGmoji` มีสิทธิ์ read/write ใน database `api-factory`

3. **ขนาดข้อมูล:** ถ้าข้อมูลมีขนาดใหญ่มาก อาจใช้เวลานาน ควรรันใน terminal ที่ไม่ปิด

4. **Backup:** แนะนำให้ backup ข้อมูลก่อน restore ถ้ามีข้อมูลสำคัญอยู่แล้วใน Atlas

---

## Troubleshooting

### Error: "mongodump is not recognized"
- ติดตั้ง MongoDB Database Tools (ดูขั้นตอนที่ 1)

### Error: "Authentication failed"
- ตรวจสอบ username/password ใน connection string
- ตรวจสอบว่า user มีสิทธิ์เข้าถึง database

### Error: "Network timeout"
- ตรวจสอบ Network Access ใน Atlas
- ตรวจสอบว่า connection string ถูกต้อง

### Error: "Connection refused"
- ตรวจสอบว่า MongoDB server กำลังรันอยู่
- ตรวจสอบ host และ port ใน connection string
