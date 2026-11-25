process.env.DATABASE_URL ||= 'postgresql://smartedu:test@localhost:5432/smartedu';
process.env.JWT_SECRET ||= 'unit-test-secret-long-enough-for-authentication';
process.env.CLIENT_URL ||= 'http://localhost:5173';

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const CodeFactory = require('../../src/core/factories/CodeFactory');
const UserRepository = require('../../src/repositories/user.repository');
const AuthService = require('../../src/services/auth.service');

function createService(user) {
  const updates = [];
  UserRepository.prototype.findByEmail = async () => user;
  UserRepository.prototype.recordFailedLogin = async (id, maxAttempts, lockoutMs) => {
    if (user.lockedUntil && user.lockedUntil > new Date()) return;
    user.failedLogins += 1;
    if (user.failedLogins >= maxAttempts) {
      user.failedLogins = 0;
      user.lockedUntil = new Date(Date.now() + lockoutMs);
    }
    updates.push({ id, failedLogins: user.failedLogins, lockedUntil: user.lockedUntil });
  };
  UserRepository.prototype.updateLoginState = async (_id, failedLogins, lockedUntil) => {
    Object.assign(user, { failedLogins, lockedUntil });
  };
  return { service: new AuthService(), updates };
}

async function createActiveStudent() {
  const generatedCode = CodeFactory.create('STUDENT').generate();
  return {
    user: {
      id: 'test-user-id',
      name: 'Test Student',
      email: 'student@example.edu',
      institutionalId: 'STU-001',
      phone: '5551234567',
      role: 'STUDENT',
      status: 'ACTIVE',
      passwordHash: await bcrypt.hash('correct-password', 4),
      loginCodeHash: await bcrypt.hash(generatedCode, 4),
      failedLogins: 0,
      lockedUntil: null,
    },
    generatedCode,
  };
}

test('login returns a safe user when all credentials match', async () => {
  const { user, generatedCode } = await createActiveStudent();
  const { service } = createService(user);

  const result = await service.login({
    email: user.email,
    password: 'correct-password',
    role: 'STUDENT',
    generatedCode,
    phone: user.phone,
  });

  assert.deepEqual(result.user, {
    id: user.id,
    name: user.name,
    email: user.email,
    institutionalId: user.institutionalId,
    role: user.role,
    status: user.status,
  });
  assert.equal('passwordHash' in result.user, false);
  assert.equal('loginCodeHash' in result.user, false);
});

test('wrong password, role, and code use the same generic login error', async () => {
  const { user, generatedCode } = await createActiveStudent();
  const { service } = createService(user);
  const base = { email: user.email, password: 'correct-password', role: 'STUDENT', generatedCode };

  for (const invalid of [
    { ...base, password: 'wrong-password' },
    { ...base, role: 'TEACHER' },
    { ...base, generatedCode: 'ADM-7K3Q9X' },
    { ...base, phone: '5559999999' },
  ]) {
    await assert.rejects(service.login(invalid), { message: 'Invalid credentials', statusCode: 401 });
  }
});

test('valid credentials for a pending account require administrator approval', async () => {
  const { user } = await createActiveStudent();
  user.role = 'PRINCIPAL';
  user.status = 'PENDING';
  const generatedCode = CodeFactory.create('PRINCIPAL').generate();
  user.loginCodeHash = await bcrypt.hash(generatedCode, 4);
  const { service, updates } = createService(user);

  await assert.rejects(
    service.login({
      email: user.email,
      password: 'correct-password',
      role: 'PRINCIPAL',
      generatedCode,
    }),
    {
      message: 'Your account is waiting for administrator approval. Contact your school administrator.',
      statusCode: 403,
    },
  );
  assert.equal(updates.length, 0);
});

test('five failed logins lock an account for fifteen minutes', async () => {
  const { user, generatedCode } = await createActiveStudent();
  const { service, updates } = createService(user);
  const credentials = {
    email: user.email,
    password: 'wrong-password',
    role: 'STUDENT',
    generatedCode,
  };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(service.login(credentials), { message: 'Invalid credentials', statusCode: 401 });
  }

  assert.equal(updates.length, 5);
  assert.equal(user.failedLogins, 0);
  assert.ok(user.lockedUntil instanceof Date);
  assert.ok(user.lockedUntil.getTime() - Date.now() > 14 * 60 * 1000);
  await assert.rejects(service.login(credentials), { message: 'Invalid credentials', statusCode: 401 });
  assert.equal(updates.length, 5);
});
