Railway deployment and MongoDB setup

This file explains how to connect this project to a MongoDB instance on Railway, run a local connectivity check, and restore a dump.

1) Environment variables (Railway)

- Create or promote a Shared Variable named `MONGODB_URL` with the connection string provided by Railway. Recommended values:
  - For services inside the same Railway project (private networking): use `MONGO_URL` (e.g. mongodb://mongo:password@mongodb.railway.internal:27017)
  - For external access (local machine): use `MONGO_PUBLIC_URL` (e.g. mongodb://mongo:password@turntable.proxy.rlwy.net:46691)

This repo's DB adapter now prefers these env vars in order:
`MONGODB_URL`, `MONGO_URL`, `MONGO_PUBLIC_URL`, `MONGO_URI`.

If you have `MONGO_*` fragments (e.g. `MONGOUSER`, `MONGOPASSWORD`, `MONGOHOST`), you can use the helper to generate a recommended `MONGODB_URL`:

```cmd
npm run generate-mongo-url
```

This will print a masked value and show `set`/PowerShell examples you can copy into Railway's Shared Variable named `MONGODB_URL`.
---

## Quick steps (Thai)

1) ใน Railway ให้เข้า Project ที่มี MongoDB add-on หรือเพิ่ม MongoDB add-on ถ้ายังไม่มี
2) ไปที่ Project → Variables (Shared Variables) แล้วทำ 1 ใน 2 วิธีนี้:
  - ถ้าคุณเห็น `MONGO_URL` หรือ `MONGO_PUBLIC_URL` ในตัวแปรของ Service: ให้คลิก ⋮ (three dots) แล้วเลือก **Promote to Shared Variable** จากนั้นคัดลอกค่าและวางลงในตัวแปร `MONGODB_URL` (recommended)
  - ถ้า service รันอยู่ใน Railway เดียวกัน: ตั้ง `MONGODB_URL` เป็น internal URL (เช่น `mongodb://mongo:PASSWORD@mongodb.railway.internal:27017/api-factory?authSource=admin`)
  - ถ้าจะเชื่อมจากภายนอก (local dev / Vercel): ตั้ง `MONGODB_URL` เป็น public proxy (เช่น `mongodb://mongo:PASSWORD@turntable.proxy.rlwy.net:46691/api-factory?authSource=admin`)
3) ในเครื่องท้องถิ่น (Windows CMD):
```cmd
set MONGODB_URL=mongodb://mongo:YOUR_PASSWORD@turntable.proxy.rlwy.net:46691/api-factory?authSource=admin
npm run check-db
```
หรือ PowerShell:
```powershell
$env:MONGODB_URL = 'mongodb://mongo:YOUR_PASSWORD@turntable.proxy.rlwy.net:46691/api-factory?authSource=admin'
npm run check-db
```
4) ถ้าคุณมีแค่ `MONGO_*` (username, password, host, port): รัน
```cmd
npm run generate-mongo-url
```
แล้วคัดลอกค่าสำหรับใช้เป็น `MONGODB_URL` ใน Railway

5) ถ้ามีปัญหาในการเชื่อมต่อ ให้ดู logs ใน Railway หรือคัดลอก error มาให้ผมช่วยวิเคราะห์ต่อได้


2) Start command (Railway)

The project already has `"start": "node app.js"` in `package.json`. Railway will use `npm start` by default. If you need a custom start command in Railway, set it to:

  npm start

3) Local testing (Windows CMD)

Set `MONGODB_URL` in your CMD environment and run the DB check script included in the repo.

Example (Windows CMD):

```cmd
set MONGODB_URL=mongodb://mongo:YOUR_PASSWORD@turntable.proxy.rlwy.net:46691
npm run check-db
```

Example (PowerShell):

```powershell
$env:MONGODB_URL = 'mongodb://mongo:YOUR_PASSWORD@turntable.proxy.rlwy.net:46691'
npm run check-db
```

4) Run the whole app locally (Windows CMD)

```cmd
set MONGODB_URL=mongodb://mongo:YOUR_PASSWORD@turntable.proxy.rlwy.net:46691
npm start
```

You can also use the provided `.env.example` in the repo as a reference for local environment variables (do not commit real credentials).

5) Restoring a MongoDB dump (local machine)

`mongorestore` is part of the MongoDB Database Tools and runs outside Node.js. Example (Windows CMD):

```cmd
set MONGODB_URL=mongodb://mongo:YOUR_PASSWORD@turntable.proxy.rlwy.net:46691
mongorestore --uri="%MONGODB_URL%" --nsInclude=api-factory.* <path-to-dump>
```

On Linux/macOS (or inside Railway's shell), use `$MONGODB_URL`:

```bash
export MONGODB_URL='mongodb://mongo:YOUR_PASSWORD@turntable.proxy.rlwy.net:46691'
mongorestore --uri="$MONGODB_URL" --nsInclude=api-factory.* <path-to-dump>
```

If you'd rather use the accompanying npm helper (requires `mongorestore` in PATH):

```cmd
set MONGODB_URL=mongodb://mongo:YOUR_PASSWORD@turntable.proxy.rlwy.net:46691
npm run restore-db -- <path-to-dump>
```

Optional: use `--drop` to drop existing collections before restoring:

```cmd
npm run restore-db -- --drop <path-to-dump>
```

Installing MongoDB Database Tools (examples):
- Windows (Chocolatey): `choco install mongodb-database-tools`
- Windows (manual): download from https://www.mongodb.com/try/download/database-tools and run installer
- macOS (Homebrew): `brew tap mongodb/brew && brew install mongodb-database-tools`
- Ubuntu/Debian: use apt repository or download from MongoDB's site: https://www.mongodb.com/try/download/database-tools

Ensure `mongorestore` is available in your PATH before running the npm script.

### Manual Restore via GitHub Actions (recommended, no Docker required locally)

1. Add `MONGODB_URL` as a repository secret in GitHub:
  - Go to your repo: Settings → Secrets and variables → Actions → New repository secret
  - Name: `MONGODB_URL`
  - Value: `mongodb://mongo:YOUR_PASSWORD@turntable.proxy.rlwy.net:46691`

2. Trigger the workflow manually:
  - Open repo → Actions → Manual DB Restore → Run workflow
  - Configure inputs:
    - `drop`: `true` or `false` (drop collections before restore)
    - `backup`: `true` or `false` (create pre-restore backup artifact)
  - Click `Run workflow`

3. Watch the workflow logs in Actions. The workflow will:
  - Create a backup artifact if `backup=true` (uploader artifact will be shown in the run)
  - Run `mongorestore` using Docker on GitHub runner
  - Run `npm run check-db` to validate the result

4. If it fails, copy log output and open an issue or paste it here; I can help debug.

6) Troubleshooting & logs

- If the app fails to connect on Railway, open the Railway deployment logs — common errors: authentication failure, network access, wrong database name.
- If the local check errors: paste the error output and I can help debug.
  - If local check shows `ECONNREFUSED` on `localhost:27017`, no local MongoDB instance is running — either install MongoDB locally or use Railway public proxy (`MONGO_PUBLIC_URL`) or the project's `MONGODB_URL`.
  - If local check shows `ECONNREFUSED` on `localhost:27017`, no local MongoDB instance is running — either install MongoDB locally or use Railway public proxy (`MONGO_PUBLIC_URL`) or the project's `MONGODB_URL`.

7) Security

- Keep credentials secret. Do not post production credentials to public places.
- Use Railway's Shared Variables to avoid duplicating secrets between services.

If you'd like, I can:
- Add an `npm` script wrapper to run `mongorestore` with platform detection.
- Provide a short troubleshooting checklist for common connection errors.
- Attempt to run `npm run check-db` from this environment if you give the `MONGODB_URL` value here (only do so if you're comfortable sharing it).

8) Deploying from Vercel and using Railway-hosted MongoDB

- If you deploy your application to Vercel and your MongoDB is hosted in Railway, make sure to use the public proxy connection string in Vercel's Project Settings (Environment Variables) -- set `MONGODB_URL` to Railway's `MONGO_PUBLIC_URL`.
- Vercel Environment Variables: Project → Settings → Environment Variables. Create `MONGODB_URL` and set the value for each scope (Preview, Production, Development) to:
  - `mongodb://mongo:PASSWORD@turntable.proxy.rlwy.net:46691` (use your Railway MONGO_PUBLIC_URL). Ensure the password and username are correct.
- Note: `mongodb.railway.internal` is private to Railway and will NOT be accessible from Vercel. Always use the public proxy.
- Vercel serverless functions often reuse Node processes — our `MongoDB` adapter now (1) reads `MONGODB_URL` env variables, and (2) reuses the mongoose connection when possible. However, serverless environments may still create multiple connections if they scale horizontally.
- If your application uses a long-running Node server, Vercel may not be an optimal host: prefer Railway for stateful services (or deploy the server as a container elsewhere). For serverless-compatible architecture consider enabling serverless routes only. 

9) Security and credential handling

- Store secrets in Vercel environment variables and mark them as protected if needed (for Production only). Do not commit credentials into source code.
- If connecting from Vercel to Railway's public proxy, consider adding an IP allowlist or additional authentication to prevent misuse.

10) SDK driver update

- The project uses a local `vendor/sdk` package for the SDK. To connect to modern MongoDB versions (like Mongo 8), the SDK's `mongoose` driver was updated to v6.9.1. If you run into runtime issues after upgrading, we can review code paths (particularly uses of deprecated API such as `count` vs `countDocuments`) and apply fixes.
