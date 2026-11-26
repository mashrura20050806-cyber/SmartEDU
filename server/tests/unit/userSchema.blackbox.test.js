// Black-box tests for src/validators/user.schema.js
// Lecture 6 Techniques: Robustness BVA (Min-, Min, Min+, Nominal, Max-, Max, Max+) & ECP
const test = require('node:test');
const assert = require('node:assert/strict');
const { createUserSchema, updateUserSchema } = require('../../src/validators/user.schema');

const baseUser = {
  name: 'Tariq Hasan',
  email: 'Tariq@SmartEdu.com',
  institutionalId: 'TCH-202',
  role: 'TEACHER',
  status: 'ACTIVE',
  phone: '01712345678',
  password: 'Password123',
};

// --- 1. Robustness BVA on name length [2..100] (7 boundary points: 6n+1) ---
const nameBoundaries = [
  ['name length 1   (Min-)', 1, false],
  ['name length 2   (Min)', 2, true],
  ['name length 3   (Min+)', 3, true],
  ['name length 50  (Nominal)', 50, true],
  ['name length 99  (Max-)', 99, true],
  ['name length 100 (Max)', 100, true],
  ['name length 101 (Max+)', 101, false],
];

for (const [label, len, expected] of nameBoundaries) {
  test(`createUserSchema Robustness BVA: ${label}`, () => {
    const res = createUserSchema.safeParse({ ...baseUser, name: 'A'.repeat(len) });
    assert.equal(res.success, expected);
  });
}

// --- 2. Robustness BVA on password length [8..128] ---
const passBoundaries = [
  ['password length 7   (Min-)', 7, false],
  ['password length 8   (Min)', 8, true],
  ['password length 128 (Max)', 128, true],
  ['password length 129 (Max+)', 129, false],
];

for (const [label, len, expected] of passBoundaries) {
  test(`createUserSchema Robustness BVA: ${label}`, () => {
    const res = createUserSchema.safeParse({ ...baseUser, password: 'x'.repeat(len) });
    assert.equal(res.success, expected);
  });
}

// --- 3. Equivalence Class Partitioning (ECP) on email, role, status ---
test('createUserSchema ECP: normalizes valid uppercase email to lowercase', () => {
  const res = createUserSchema.safeParse(baseUser);
  assert.equal(res.success, true);
  assert.equal(res.data.email, 'tariq@smartedu.com');
});

test('createUserSchema ECP: rejects invalid role outside ROLES partition', () => {
  assert.equal(createUserSchema.safeParse({ ...baseUser, role: 'GUEST' }).success, false);
});

test('createUserSchema ECP: rejects invalid status outside enum partition', () => {
  assert.equal(createUserSchema.safeParse({ ...baseUser, status: 'SUSPENDED' }).success, false);
});

// --- 4. updateUserSchema (minimum 2 test cases) ---
test('updateUserSchema: accepts valid partial update (single field)', () => {
  assert.equal(updateUserSchema.safeParse({ status: 'INACTIVE' }).success, true);
});

test('updateUserSchema: rejects empty update object (0 fields)', () => {
  assert.equal(updateUserSchema.safeParse({}).success, false);
});

test('updateUserSchema: rejects unknown extra field (strict mode)', () => {
  assert.equal(updateUserSchema.safeParse({ name: 'New', extraField: 1 }).success, false);
});
