// Unit tests for AppError, fileStorage, permission.service and class.service.
// The database is replaced by a fake so no PostgreSQL is needed.
const test = require('node:test');
const assert = require('node:assert/strict');

// fake DatabaseConnection (must be installed before the services are loaded)
const dbPath = require.resolve('../../src/core/singletons/DatabaseConnection');
let fakeClient = {};
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true,
  exports: { getInstance: () => ({ getClient: () => fakeClient }) },
};

const AppError = require('../../src/utils/AppError');
const fileStorage = require('../../src/utils/fileStorage');
const permissionService = require('../../src/services/permission.service');
const classService = require('../../src/services/class.service');
const { MODULES } = require('../../src/config/modules');
const { ROLES } = require('../../src/config/roles');

// ---------- AppError ----------
test('AppError: keeps the message and the given status code', () => {
  const error = new AppError('Not found', 404);
  assert.equal(error.message, 'Not found');
  assert.equal(error.statusCode, 404);
  assert.equal(error.name, 'AppError');
});
test('AppError: defaults to status 500 and is an Error', () => {
  const error = new AppError('Boom');
  assert.equal(error.statusCode, 500);
  assert.ok(error instanceof Error);
});

// ---------- fileStorage: storage-key validation (path traversal protection) ----------
const validKey = '123e4567-e89b-42d3-a456-426614174000.pdf';
for (const badKey of ['../secret.pdf', 'file.exe', '123e4567.pdf', `${validKey}.js`, '']) {
  test(`fileStorage.remove: rejects invalid key "${badKey}"`, async () => {
    await assert.rejects(() => fileStorage.remove(badKey), /Invalid file storage key/);
  });
}
test('fileStorage.open: rejects an invalid key', () => {
  assert.throws(() => fileStorage.open('../../etc/passwd'), /Invalid file storage key/);
});
test('fileStorage.save: rejects an invalid key', async () => {
  await assert.rejects(() => fileStorage.save('bad.txt', Buffer.from('x')), /Invalid file storage key/);
});

// ---------- permission.service ----------
test('listPermissions: returns one row for every role and module, defaulting to no access', async () => {
  fakeClient = { permission: { findMany: async () => [] } };
  const rows = await permissionService.listPermissions();
  assert.equal(rows.length, ROLES.length * MODULES.length);
  assert.deepEqual(rows[0], { role: ROLES[0], module: MODULES[0], canView: false, canWrite: false, canModify: false });
});
test('listPermissions: a saved permission replaces the default', async () => {
  const saved = { role: 'TEACHER', module: 'MARKS', canView: true, canWrite: true, canModify: false };
  fakeClient = { permission: { findMany: async () => [saved] } };
  const rows = await permissionService.listPermissions();
  assert.deepEqual(rows.find((r) => r.role === 'TEACHER' && r.module === 'MARKS'), saved);
});
test('getRolePermissions: groups actions by module', async () => {
  fakeClient = { permission: { findMany: async () => [{ module: 'NOTICE', canView: true, canWrite: false, canModify: false }] } };
  assert.deepEqual(await permissionService.getRolePermissions('STUDENT'), {
    NOTICE: { canView: true, canWrite: false, canModify: false },
  });
});
test('updatePermission: rejects an unknown role', async () => {
  fakeClient = { permission: { upsert: async () => ({}) } };
  await assert.rejects(() => permissionService.updatePermission('JANITOR', 'MARKS', {}), /valid role and feature/);
});
test('updatePermission: rejects an unknown module', async () => {
  fakeClient = { permission: { upsert: async () => ({}) } };
  await assert.rejects(() => permissionService.updatePermission('TEACHER', 'SPACESHIP', {}), /valid role and feature/);
});
test('updatePermission: saves valid changes with an upsert', async () => {
  let call;
  fakeClient = { permission: { upsert: async (args) => { call = args; return args; } } };
  await permissionService.updatePermission('TEACHER', 'MARKS', { canView: true });
  assert.deepEqual(call.where, { role_module: { role: 'TEACHER', module: 'MARKS' } });
  assert.deepEqual(call.update, { canView: true });
});

// ---------- class.service ----------
test('listClasses: a student only sees classes they belong to', async () => {
  let args;
  fakeClient = { schoolClass: { findMany: async (a) => { args = a; return []; } } };
  await classService.listClasses({ id: 'u1', role: 'STUDENT' });
  assert.deepEqual(args.where, { sections: { some: { students: { some: { id: 'u1' } } } } });
});
test('listClasses: a teacher sees assigned classes or classes where they are class teacher', async () => {
  let args;
  fakeClient = { schoolClass: { findMany: async (a) => { args = a; return []; } } };
  await classService.listClasses({ id: 't1', role: 'TEACHER' });
  assert.equal(args.where.OR.length, 2);
});
test('listClasses: an admin sees all classes (no filter)', async () => {
  let args;
  fakeClient = { schoolClass: { findMany: async (a) => { args = a; return []; } } };
  await classService.listClasses({ id: 'a1', role: 'ADMIN' });
  assert.deepEqual(args.where, {});
});
test('createClass: returns the created class', async () => {
  fakeClient = { schoolClass: { create: async ({ data }) => ({ id: 'c1', ...data }) } };
  const result = await classService.createClass({ name: 'Class 1', academicYear: '2026' });
  assert.equal(result.id, 'c1');
});
test('createClass: a duplicate (P2002) becomes a 409 AppError', async () => {
  fakeClient = { schoolClass: { create: async () => { throw Object.assign(new Error('dup'), { code: 'P2002' }); } } };
  await assert.rejects(() => classService.createClass({}), (e) => e instanceof AppError && e.statusCode === 409);
});
test('createClass: an unknown error is passed through unchanged', async () => {
  fakeClient = { schoolClass: { create: async () => { throw new Error('disk on fire'); } } };
  await assert.rejects(() => classService.createClass({}), /disk on fire/);
});
test('updateClass: a missing class (P2025) becomes a 404 AppError', async () => {
  fakeClient = { schoolClass: { update: async () => { throw Object.assign(new Error('x'), { code: 'P2025' }); } } };
  await assert.rejects(() => classService.updateClass('id', {}), (e) => e.statusCode === 404);
});
test('updateClass: a duplicate (P2002) becomes a 409 AppError', async () => {
  fakeClient = { schoolClass: { update: async () => { throw Object.assign(new Error('x'), { code: 'P2002' }); } } };
  await assert.rejects(() => classService.updateClass('id', {}), (e) => e.statusCode === 409);
});
