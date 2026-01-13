# Vercel Deployment Setup

## Environment Variables Required

คุณต้องตั้งค่า Environment Variables ใน Vercel Dashboard:

1. ไปที่ Vercel Project → Settings → Environment Variables
2. เพิ่มตัวแปรต่อไปนี้:

### MongoDB Connection (จำเป็น)
```
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

หรือใช้ตัวแปรอื่นๆ ที่รองรับ:
- `MONGO_URL`
- `MONGO_PUBLIC_URL`
- `MONGO_URI`

### ตัวอย่างจาก MongoDB Atlas:
1. ไปที่ MongoDB Atlas → Clusters
2. คลิก "Connect"
3. เลือก "Connect your application"
4. Copy connection string
5. แทนที่ `<password>` ด้วย password จริง
6. ตั้งค่าใน Vercel Environment Variables

## การ Deploy

1. Push code ไปยัง GitHub
2. Vercel จะ deploy อัตโนมัติ
3. ตรวจสอบ logs ใน Vercel Dashboard หากมี error

## หมายเหตุ

- Swagger UI (`/api/swagger`) ควรทำงานได้แม้ MongoDB ไม่ได้เชื่อมต่อ
- แต่ API endpoints อื่นๆ ต้องการ MongoDB connection
