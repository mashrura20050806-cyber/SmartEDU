// Black-box tests for src/validators/auth.schema.js
// Techniques: EP (valid/invalid groups), BVA (password length 8..128), Decision Table (student rules)
const test = require('node:test');
const assert = require('node:assert/strict');
const { registerSchema, loginSchema, passwordSchema } = require('../../src/validators/auth.schema');

const ID = '123e4567-e89b-42d3-a456-426614174000';
const teacherBase = {
  name: 'Rahim Uddin',
  email: 'Rahim@Example.com',
  institutionalId: 'T-001',
  phone: '01700000000',
  password: 'password1',
  confirmPassword: 'password1',
  role: 'TEACHER',
  codeReservationId: ID,
  generatedCode: 'TCH-7K3Q9X',
};

// ---------- registerSchema: equivalence partitions ----------
test('registerSchema: valid teacher is accepted and email is lower-cased', () => {
  const result = registerSchema.safeParse(teacherBase);
  assert.equal(result.success, true);
  assert.equal(result.data.email, 'rahim@example.com');
});

test('registerSchema: rejects an invalid email (invalid partition)', () => {
  assert.equal(registerSchema.safeParse({ ...teacherBase, email: 'not-an-email' }).success, false);
});

test('registerSchema: rejects mismatching passwords', () => {
  const result = registerSchema.safeParse({ ...teacherBase, confirmPassword: 'different1' });
  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /do not match/i);
});

test('registerSchema: rejects a code whose prefix belongs to another role', () => {
  const result = registerSchema.safeParse({ ...teacherBase, generatedCode: 'ADM-7K3Q9X' });
  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /does not match the selected role/i);
});

test('registerSchema: rejects an unsupported role', () => {
  assert.equal(registerSchema.safeParse({ ...teacherBase, role: 'MANAGER' }).success, false);
});

// ---------- BVA: password length 8..128 ----------
const passwordCases = [
  ['password length 7   (Min-)', 7, false],
  ['password length 8   (Min)', 8, true],
  ['password length 9   (Min+)', 9, true],
  ['password length 127 (Max-)', 127, true],
  ['password length 128 (Max)', 128, true],
  ['password length 129 (Max+)', 129, false],
];
for (const [description, length, shouldBeValid] of passwordCases) {
  test(`registerSchema: ${description}`, () => {
    const password = 'p'.repeat(length);
    const result = registerSchema.safeParse({ ...teacherBase, password, confirmPassword: password });
    assert.equal(result.success, shouldBeValid);
  });
}

// ---------- Decision table: STUDENT needs roll no + guardian phone + class + section ----------
// Rule  rollNumber guardianPhone classId sectionId -> valid?
//  R1      Y           Y            Y       Y         Yes
//  R2      N           Y            Y       Y         No
//  R3      Y           N            Y       Y         No
//  R4      Y           Y            N       Y         No
//  R5      Y           Y            Y       N         No
const studentBase = {
  ...teacherBase,
  role: 'STUDENT',
  generatedCode: 'STU-7K3Q9X',
  rollNumber: '12',
  guardianPhone: '01800000000',
  classId: ID,
  sectionId: ID,
};
const decisionTable = [
  ['R1: all four student fields present', {}, true],
  ['R2: roll number missing', { rollNumber: undefined }, false],
  ['R3: guardian phone missing', { guardianPhone: undefined }, false],
  ['R4: class missing', { classId: undefined }, false],
  ['R5: section missing', { sectionId: undefined }, false],
];
for (const [description, override, shouldBeValid] of decisionTable) {
  test(`registerSchema (student decision table) ${description}`, () => {
    assert.equal(registerSchema.safeParse({ ...studentBase, ...override }).success, shouldBeValid);
  });
}

// ---------- loginSchema ----------
const loginBase = { email: 'a@b.com', password: 'x', role: 'STUDENT', generatedCode: 'stu-7k3q9x' };

test('loginSchema: accepts valid input and upper-cases the code', () => {
  const result = loginSchema.safeParse(loginBase);
  assert.equal(result.success, true);
  assert.equal(result.data.generatedCode, 'STU-7K3Q9X');
});

const badCodes = ['STU-123456', 'STU-7K3Q9', 'STU-7K3Q9XA', 'STU7K3Q9X', ''];
for (const generatedCode of badCodes) {
  test(`loginSchema: rejects malformed code "${generatedCode}"`, () => {
    assert.equal(loginSchema.safeParse({ ...loginBase, generatedCode }).success, false);
  });
}

test('loginSchema: rejects an empty password', () => {
  assert.equal(loginSchema.safeParse({ ...loginBase, password: '' }).success, false);
});

// ---------- passwordSchema (change password) ----------
test('passwordSchema: accepts an 8-character new password', () => {
  assert.equal(passwordSchema.safeParse({ currentPassword: 'old', newPassword: '12345678' }).success, true);
});

test('passwordSchema: rejects a 7-character new password', () => {
  assert.equal(passwordSchema.safeParse({ currentPassword: 'old', newPassword: '1234567' }).success, false);
});
