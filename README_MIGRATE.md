# ✅ พร้อมใช้งานแล้ว! - Migrate ไปยัง MongoDB Atlas

## 🎯 สิ่งที่เตรียมไว้ให้แล้ว:

1. ✅ **ไฟล์ `.env`** - ตั้งค่า MongoDB Atlas connection string แล้ว
2. ✅ **Script migrate** - `scripts/migrate-to-atlas.js` (ใช้ Node.js ไม่ต้องติดตั้ง tools)
3. ✅ **NPM script** - `npm run migrate-to-atlas` พร้อมใช้

---

## 🚀 วิธีใช้งาน (3 ขั้นตอน):

### ขั้นตอนที่ 1: เพิ่ม connection string ของฐานข้อมูลเดิม

แก้ไขไฟล์ `.env` เพิ่มบรรทัดนี้:

```env
MONGODB_SOURCE_URL=mongodb://localhost:27017/api-factory
```

**ตัวอย่าง connection string:**
- Localhost: `mongodb://localhost:27017/api-factory`
- Localhost with auth: `mongodb://username:password@localhost:27017/api-factory?authSource=admin`
- Remote server: `mongodb://username:password@host:port/api-factory?authSource=admin`
- Atlas อื่น: `mongodb+srv://user:pass@cluster.mongodb.net/api-factory`

### ขั้นตอนที่ 2: รัน migrate

```powershell
npm run migrate-to-atlas
```

### ขั้นตอนที่ 3: ตรวจสอบผลลัพธ์

```powershell
npm run check-db
```

---

## 📝 ตัวอย่างการใช้งาน:

### ถ้าฐานข้อมูลเดิมอยู่ที่ localhost:

1. เปิดไฟล์ `.env` และเพิ่ม:
   ```
   MONGODB_SOURCE_URL=mongodb://localhost:27017/api-factory
   ```

2. รัน:
   ```powershell
   npm run migrate-to-atlas
   ```

### ถ้าฐานข้อมูลเดิมอยู่ที่ remote server:

1. เปิดไฟล์ `.env` และเพิ่ม:
   ```
   MONGODB_SOURCE_URL=mongodb://username:password@host:port/api-factory?authSource=admin
   ```

2. รัน:
   ```powershell
   npm run migrate-to-atlas
   ```

### หรือใช้ --source option (ไม่ต้องแก้ .env):

```powershell
npm run migrate-to-atlas -- --source "mongodb://username:password@host:port/api-factory"
```

---

## ⚠️ สิ่งที่ต้องตรวจสอบก่อน migrate:

1. **Network Access ใน Atlas:**
   - ไปที่ MongoDB Atlas → Network Access
   - เพิ่ม IP address ของคุณ หรือใช้ "Allow Access from Anywhere" (0.0.0.0/0) ชั่วคราว

2. **Database User:**
   - ตรวจสอบว่า user `SupportGmoji` มีสิทธิ์ read/write ใน database `api-factory`

3. **Connection String ของฐานข้อมูลเดิม:**
   - ตรวจสอบว่าเชื่อมต่อได้
   - ทดสอบด้วย: `npm run check-db` (เปลี่ยน MONGODB_URL เป็นของฐานข้อมูลเดิมก่อน)

---

## 📚 ไฟล์ที่เกี่ยวข้อง:

- `scripts/migrate-to-atlas.js` - Script สำหรับ migrate
- `QUICK_MIGRATE.md` - คู่มือแบบย่อ
- `MIGRATE_TO_ATLAS.md` - คู่มือแบบละเอียด (ใช้ mongodump/mongorestore)

---

## ✅ พร้อมใช้แล้ว!

แค่เพิ่ม `MONGODB_SOURCE_URL` ใน `.env` แล้วรัน `npm run migrate-to-atlas` ได้เลย! 🎉
