const test = require('node:test');
const assert = require('node:assert/strict');
const { generateCodeSchema, loginSchema, registerSchema } = require('../../src/validators/auth.schema');

const codeReservationId = '6e36b7ee-723e-4b01-bac6-b289355251ef';

test('accepts each supported role for code generation', () => {
  for (const role of ['ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'ASSISTANT', 'STUDENT']) {
    assert.equal(generateCodeSchema.safeParse({ role }).success, true);
  }
  assert.equal(generateCodeSchema.safeParse({ role: 'SUPER_ADMIN' }).success, false);
});

test('requires matching passwords and a valid code reservation at sign-up', () => {
  const registration = {
    name: 'Example User',
    institutionalId: 'SCHOOL-123',
    phone: '5551234567',
    email: 'USER@SCHOOL.EDU',
    password: 'strong-password-123',
    confirmPassword: 'strong-password-123',
    role: 'STUDENT',
    guardianPhone: '5557654321',
    rollNumber: '4',
    classId: '6e36b7ee-723e-4b01-bac6-b289355251ef',
    sectionId: 'c862b0a2-f259-41e1-b20f-a6427a00e949',
    codeReservationId,
    generatedCode: 'STU-7K3Q9X',
  };

  const result = registerSchema.safeParse(registration);
  assert.equal(result.success, true);
  assert.equal(result.data.email, 'user@school.edu');
  assert.equal(registerSchema.safeParse({ ...registration, confirmPassword: 'different-password' }).success, false);
  assert.equal(registerSchema.safeParse({ ...registration, role: 'ADMIN', generatedCode: 'STU-7K3Q9X' }).success, false);
  assert.equal(registerSchema.safeParse({ ...registration, sectionId: undefined }).success, false);
});

test('login requires email, password, role, and a generated code', () => {
  const credentials = {
    email: 'user@school.edu',
    password: 'strong-password-123',
    role: 'STUDENT',
    generatedCode: 'STU-7K3Q9X',
  };

  assert.equal(loginSchema.safeParse(credentials).success, true);
  assert.equal(loginSchema.safeParse({ ...credentials, generatedCode: 'not-a-code' }).success, false);
  assert.equal(loginSchema.safeParse({ ...credentials, role: 'SUPER_ADMIN' }).success, false);
  assert.equal(loginSchema.safeParse({ ...credentials, phone: '5551234567' }).success, true);
});
