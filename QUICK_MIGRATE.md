# 🚀 Migrate ไปยัง Atlas - วิธีง่ายๆ

## วิธีที่ 1: ใช้ Script Migrate (แนะนำ - ไม่ต้องติดตั้ง tools)

### ขั้นตอน:

1. **ตั้งค่า connection string ของฐานข้อมูลเดิมใน `.env`**
   
   เพิ่มบรรทัดนี้ในไฟล์ `.env`:
   ```
   MONGODB_SOURCE_URL=mongodb://localhost:27017/api-factory
   ```
   
   หรือถ้ามี username/password:
   ```
   MONGODB_SOURCE_URL=mongodb://username:password@host:port/api-factory?authSource=admin
   ```

2. **ตรวจสอบว่า `.env` มี MONGODB_URL ตั้งค่าเป็น Atlas แล้ว**
   ```powershell
   Get-Content .env
   ```
   
   ควรเห็น:
   ```
   MONGODB_URL=mongodb+srv://SupportGmoji:Gmojisupport3459@gmoji-base-cluster.hsl5bp6.mongodb.net/api-factory?...
   ```

3. **รัน migrate**
   ```powershell
   npm run migrate-to-atlas
   ```

4. **ตรวจสอบผลลัพธ์**
   ```powershell
   npm run check-db
   ```

---

## ตัวอย่างการใช้งาน

### ถ้าฐานข้อมูลเดิมอยู่ที่ localhost:
```powershell
# เพิ่มใน .env
MONGODB_SOURCE_URL=mongodb://localhost:27017/api-factory

# รัน migrate
npm run migrate-to-atlas
```

### ถ้าฐานข้อมูลเดิมอยู่ที่ remote server:
```powershell
# เพิ่มใน .env
MONGODB_SOURCE_URL=mongodb://username:password@host:port/api-factory?authSource=admin

# รัน migrate
npm run migrate-to-atlas
```

### หรือใช้ --source option:
```powershell
npm run migrate-to-atlas -- --source "mongodb://username:password@host:port/api-factory"
```

---

## ⚠️ หมายเหตุสำคัญ

1. **Network Access:** ตรวจสอบว่า IP address ของคุณถูกอนุญาตใน MongoDB Atlas
   - ไปที่ Atlas → Network Access → Add IP Address
   - หรือใช้ "Allow Access from Anywhere" (0.0.0.0/0) ชั่วคราว

2. **ข้อมูลที่มีอยู่:** Script จะไม่ลบข้อมูลเดิมใน Atlas แต่จะเพิ่มข้อมูลใหม่เข้าไป
   - ถ้ามี document ที่มี _id ซ้ำ จะข้าม (ไม่ error)

3. **ขนาดข้อมูล:** ถ้าข้อมูลมีขนาดใหญ่มาก อาจใช้เวลานาน

---

## ✅ พร้อมใช้แล้ว!

แค่เพิ่ม `MONGODB_SOURCE_URL` ใน `.env` แล้วรัน `npm run migrate-to-atlas` ได้เลย!
