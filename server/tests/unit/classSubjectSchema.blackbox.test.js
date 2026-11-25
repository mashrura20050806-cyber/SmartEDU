// Black-box tests for src/validators/class.schema.js and subject.schema.js
// Techniques: BVA (grade 1..12, name length) + EP (valid / invalid groups)
const test = require('node:test');
const assert = require('node:assert/strict');
const { createClassSchema, updateClassSchema } = require('../../src/validators/class.schema');
const { createSubjectSchema, updateSubjectSchema } = require('../../src/validators/subject.schema');

const ID = '123e4567-e89b-42d3-a456-426614174000';
const classBase = { name: 'Class Five', academicYear: '2026' };

// ---------- grade: integer 1..12 (Robust BVA) ----------
const gradeCases = [
  ['grade = 0   (Min-)', 0, false],
  ['grade = 1   (Min)', 1, true],
  ['grade = 2   (Min+)', 2, true],
  ['grade = 6   (nominal)', 6, true],
  ['grade = 11  (Max-)', 11, true],
  ['grade = 12  (Max)', 12, true],
  ['grade = 13  (Max+)', 13, false],
  ['grade = 5.5 (not an integer)', 5.5, false],
  ['grade = null (allowed: optional)', null, true],
];
for (const [description, grade, shouldBeValid] of gradeCases) {
  test(`createClassSchema: ${description}`, () => {
    assert.equal(createClassSchema.safeParse({ ...classBase, grade }).success, shouldBeValid);
  });
}

// ---------- name: 1..80 characters ----------
const nameCases = [
  ['name length 0  (Min-)', 0, false],
  ['name length 1  (Min)', 1, true],
  ['name length 80 (Max)', 80, true],
  ['name length 81 (Max+)', 81, false],
];
for (const [description, length, shouldBeValid] of nameCases) {
  test(`createClassSchema: ${description}`, () => {
    const result = createClassSchema.safeParse({ ...classBase, name: 'a'.repeat(length) });
    assert.equal(result.success, shouldBeValid);
  });
}

test('createClassSchema: academicYear shorter than 4 characters is rejected', () => {
  assert.equal(createClassSchema.safeParse({ name: 'A', academicYear: '202' }).success, false);
});

test('updateClassSchema: rejects an empty update', () => {
  assert.equal(updateClassSchema.safeParse({}).success, false);
});

test('updateClassSchema: accepts a single-field update', () => {
  assert.equal(updateClassSchema.safeParse({ name: 'New name' }).success, true);
});

// ---------- subject: max marks positive, <= 100000 ----------
const subjectBase = { name: 'Mathematics', classId: ID };
const subjectCases = [
  ['mt1MaxMarks = 0       (Min-)', { mt1MaxMarks: 0 }, false],
  ['mt1MaxMarks = 1       (valid)', { mt1MaxMarks: 1 }, true],
  ['hyMaxMarks = 100000   (Max)', { hyMaxMarks: 100000 }, true],
  ['hyMaxMarks = 100001   (Max+)', { hyMaxMarks: 100001 }, false],
  ['no max marks supplied (optional)', {}, true],
];
for (const [description, extra, shouldBeValid] of subjectCases) {
  test(`createSubjectSchema: ${description}`, () => {
    assert.equal(createSubjectSchema.safeParse({ ...subjectBase, ...extra }).success, shouldBeValid);
  });
}

test('createSubjectSchema: rejects a classId that is not a UUID', () => {
  assert.equal(createSubjectSchema.safeParse({ name: 'Math', classId: '123' }).success, false);
});

test('updateSubjectSchema: rejects an empty update', () => {
  assert.equal(updateSubjectSchema.safeParse({}).success, false);
});
