const test = require('node:test');
const assert = require('node:assert/strict');
const { createUserSchema, updateUserSchema } = require('../../src/validators/user.schema');

test('validates admin-created accounts and normalizes email', () => {
  const result = createUserSchema.safeParse({
    name: 'Example Teacher',
    email: 'TEACHER@SCHOOL.EDU',
    institutionalId: 'TCH-001',
    password: 'strong-password',
    role: 'TEACHER',
    status: 'PENDING',
    phone: null,
  });

  assert.equal(result.success, true);
  assert.equal(result.data.email, 'teacher@school.edu');
});

test('rejects unsupported roles, weak passwords, and empty account updates', () => {
  const account = {
    name: 'Example Student',
    email: 'student@school.edu',
    institutionalId: 'STU-001',
    password: 'strong-password',
    role: 'STUDENT',
    status: 'ACTIVE',
  };
  assert.equal(createUserSchema.safeParse({ ...account, role: 'SUPER_ADMIN' }).success, false);
  assert.equal(createUserSchema.safeParse({ ...account, password: 'short' }).success, false);
  assert.equal(updateUserSchema.safeParse({}).success, false);
  assert.equal(updateUserSchema.safeParse({ status: 'REMOVED' }).success, false);
});
