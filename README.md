# SmartEDU

SmartEDU is a school academic management and communication app. The first working slice includes the React sign-in and student registration experience, a responsive authenticated dashboard shell, and an Express authentication API backed by PostgreSQL.

## Requirements

- Node.js 20 or newer
- PostgreSQL 16 (or Docker Desktop to run the included Compose service)

## Local setup

1. Install dependencies from the project root:

   ```powershell
   npm install
   ```

2. Start PostgreSQL with Docker Desktop if you have it:

   ```powershell
   docker compose up -d postgres
   ```

   Or use a local PostgreSQL server and create a database named `smartedu`.

3. Copy `server/.env.example` to `server/.env`. Set `DATABASE_URL` to the database credentials and replace `JWT_SECRET` with a unique random value of at least 32 characters.

4. Stop any running SmartEDU server, then create the schema and seed permissions from the `server` directory. To create the first administrator account, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env` before seeding. The seed command prints the administrator's generated code once; save it securely. Do not use a default or shared password.

   ```powershell
   Set-Location server
   npx prisma db push --schema prisma/schema.prisma
   npm run seed
   ```

5. Start both the API and Vite development server:

   ```powershell
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173). The Vite server proxies `/api` requests to the API on port 4000.

The server rejects startup when required configuration is missing. Sign-up reserves a server-generated, role-prefixed code for 15 minutes and stores only password hashes and a keyed digest. Each code reservation can be used once. Student sign-up requires a mobile number, guardian phone, roll number, and an existing class/section; student accounts can sign in immediately. Privileged-role accounts stay pending administrator approval. Login checks email, password, selected role, and generated code together; the optional mobile number is checked only when supplied. Five failed attempts lock an account for 15 minutes. Administrators can manage accounts and roles from **People**, and manage role/module permissions from **Permissions**.

## Current scope

Authentication includes registration, login/logout, session restoration, password changes, bcrypt password hashing, HTTP-only JWT cookies, account lockout, and basic request rate limiting. Administrators can set up Classes 1-10 with SEC-A and SEC-B for an academic year, manage subjects and their MT1/HY/MT2 maximum scores, assign section class teachers and teaching assignments, and view student rosters. Principals and assigned teachers can view the sections they are authorized for; students can view their fixed-term results. Authorized teachers can record MT1/HY/MT2 marks, with class teachers allowed to modify recorded marks. Authorized users can publish audience-scoped notices and create other exams. Users can also upload, browse and download PDF/image study materials and class tasks; uploads are limited to 10 MB and stored locally under `server/uploads/`. The dashboard shows notices, tasks, marks or exams, and class information according to the signed-in role and permissions.

Administrators can open **Permissions** from the workspace navigation to manage the role/module view, write, and modify matrix. Permission changes are checked by the API; the permissions editor itself is restricted to the `ADMIN` role.

After pulling changes that add or alter Prisma models, stop the running development server, switch to `server`, run `npx prisma db push --schema prisma/schema.prisma`, then run `npm run seed` to apply the default role permissions. Restart the development server afterward. Administrators can use **Classes → Set up Classes 1-10** to create the standard classes and sections for an academic year; rerunning setup for the same year is safe. Locally uploaded files remain on that server and are not stored in PostgreSQL.