require('dotenv').config();
const { createHmac } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const CodeFactory = require('../src/core/factories/CodeFactory');

const prisma = new PrismaClient();
const roles = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'ASSISTANT', 'STUDENT'];
const modules = {
  DASHBOARD: { ADMIN: 'VWM', PRINCIPAL: 'V', TEACHER: 'V', CLASS_TEACHER: 'V', ASSISTANT: 'V', STUDENT: 'V' },
  NOTICE: { ADMIN: 'VWM', PRINCIPAL: 'VWM', TEACHER: 'VW', CLASS_TEACHER: 'VW', ASSISTANT: 'VW', STUDENT: 'V' },
  MARKS: { ADMIN: 'VWM', PRINCIPAL: 'V', TEACHER: 'VW', CLASS_TEACHER: 'VWM', ASSISTANT: '', STUDENT: 'V' },
  FILES: { ADMIN: 'VWM', PRINCIPAL: 'V', TEACHER: 'VWM', CLASS_TEACHER: 'VWM', ASSISTANT: 'VWM', STUDENT: 'V' },
  USERS: { ADMIN: 'VWM', PRINCIPAL: 'V', TEACHER: 'V', CLASS_TEACHER: 'V', ASSISTANT: 'V', STUDENT: 'V' },
  CLASSES: { ADMIN: 'VWM', PRINCIPAL: 'V', TEACHER: 'V', CLASS_TEACHER: 'V', ASSISTANT: '', STUDENT: 'V' },
  SUBJECTS: { ADMIN: 'VWM', PRINCIPAL: 'V', TEACHER: 'V', CLASS_TEACHER: 'V', ASSISTANT: '', STUDENT: '' },
  ASSIGNMENTS: { ADMIN: 'VWM', PRINCIPAL: 'V', TEACHER: 'V', CLASS_TEACHER: 'V', ASSISTANT: '', STUDENT: '' },
  AUTH: { ADMIN: 'VWM', PRINCIPAL: 'VW', TEACHER: 'VW', CLASS_TEACHER: 'VW', ASSISTANT: 'VW', STUDENT: 'VW' },
  RBAC: { ADMIN: 'VWM', PRINCIPAL: 'V', TEACHER: 'V', CLASS_TEACHER: 'V', ASSISTANT: 'V', STUDENT: 'V' },
};

async function main() {
  for (const [module, permissions] of Object.entries(modules)) {
    for (const role of roles) {
      const actions = permissions[role];
      await prisma.permission.upsert({
        where: { role_module: { role, module } },
        create: {
          role,
          module,
          canView: actions.includes('V'),
          canWrite: actions.includes('W'),
          canModify: actions.includes('M'),
        },
        update: {
          canView: actions.includes('V'),
          canWrite: actions.includes('W'),
          canModify: actions.includes('M'),
        },
      });
    }
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.toLowerCase();
    const institutionalId = process.env.ADMIN_INSTITUTIONAL_ID || 'ADMIN-001';
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    const existingAdmin = await prisma.user.findUnique({ where: { email } });
    const issueLoginCode = !existingAdmin?.loginCodeHash;
    const loginCode = issueLoginCode ? CodeFactory.create('ADMIN').generate() : null;
    const loginCodeHash = loginCode ? await bcrypt.hash(loginCode, 12) : undefined;
    const loginCodeDigest = loginCode
      ? createHmac('sha256', process.env.JWT_SECRET).update(loginCode).digest('hex')
      : undefined;
    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        institutionalId,
        name: process.env.ADMIN_NAME || 'School Administrator',
        passwordHash,
        loginCodeHash,
        loginCodeDigest,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      update: {
        status: 'ACTIVE',
        role: 'ADMIN',
        ...(loginCodeHash ? { loginCodeHash, loginCodeDigest } : {}),
      },
    });
    console.log(`Seeded administrator account: ${email}`);
    if (loginCode) console.log(`Administrator generated code (record it securely; shown once): ${loginCode}`);
  } else {
    console.warn('Admin account not seeded. Set ADMIN_EMAIL and ADMIN_PASSWORD to create it securely.');
  }
  console.log(`Seeded ${roles.length * Object.keys(modules).length} role permissions.`);
}

main()
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());