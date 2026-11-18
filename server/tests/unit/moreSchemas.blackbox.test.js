// Black-box tests for file.schema.js, assignment.schema.js and section.schema.js
// Techniques: Equivalence Partitioning, BVA, Decision Table
const test = require('node:test');
const assert = require('node:assert/strict');
const { createFileSchema, updateFileSchema } = require('../../src/validators/file.schema');
const { createAssignmentSchema, updateAssignmentSchema } = require('../../src/validators/assignment.schema');
const {
  createSectionSchema, updateSectionSchema, classTeacherSchema, studentRosterSchema, termMarksSchema,
} = require('../../src/validators/section.schema');

const ID = '123e4567-e89b-42d3-a456-426614174000';
const ID2 = '223e4567-e89b-42d3-a456-426614174000';
const DUE = '2026-12-01T10:00:00.000Z';

// ---------- createFileSchema decision table ----------
// kind      dueAt   sectionId  classId  -> valid?
// MATERIAL  no      no         no          yes
// TASK      yes     no         no          yes
// TASK      no      -          -           no  (tasks need a due date)
// MATERIAL  no      yes        no          no  (section needs its class)
// MATERIAL  no      yes        yes         yes
const fileCases = [
  ['MATERIAL without due date or class', { kind: 'MATERIAL' }, true],
  ['TASK with a due date', { kind: 'TASK', dueAt: DUE }, true],
  ['TASK without a due date', { kind: 'TASK' }, false],
  ['MATERIAL with section but no class', { kind: 'MATERIAL', sectionId: ID }, false],
  ['MATERIAL with section and class', { kind: 'MATERIAL', sectionId: ID, classId: ID2 }, true],
  ['unknown kind', { kind: 'VIDEO' }, false],
];
for (const [description, extra, shouldBeValid] of fileCases) {
  test(`createFileSchema: ${description}`, () => {
    assert.equal(createFileSchema.safeParse({ title: 'Notes', ...extra }).success, shouldBeValid);
  });
}

// BVA: title 1..160, description max 1000
for (const [length, ok] of [[0, false], [1, true], [160, true], [161, false]]) {
  test(`createFileSchema: title length ${length}`, () => {
    assert.equal(createFileSchema.safeParse({ title: 'a'.repeat(length), kind: 'MATERIAL' }).success, ok);
  });
}
for (const [length, ok] of [[1000, true], [1001, false]]) {
  test(`createFileSchema: description length ${length}`, () => {
    const input = { title: 'T', kind: 'MATERIAL', description: 'a'.repeat(length) };
    assert.equal(createFileSchema.safeParse(input).success, ok);
  });
}

test('updateFileSchema: rejects an empty update', () => {
  assert.equal(updateFileSchema.safeParse({}).success, false);
});
test('updateFileSchema: accepts a title-only update', () => {
  assert.equal(updateFileSchema.safeParse({ title: 'New' }).success, true);
});

// ---------- assignment schema ----------
test('createAssignmentSchema: accepts teacher + class, section/subject optional', () => {
  assert.equal(createAssignmentSchema.safeParse({ teacherId: ID, classId: ID2 }).success, true);
});
test('createAssignmentSchema: accepts null section and subject', () => {
  const input = { teacherId: ID, classId: ID2, sectionId: null, subjectId: null };
  assert.equal(createAssignmentSchema.safeParse(input).success, true);
});
test('createAssignmentSchema: rejects missing teacherId', () => {
  assert.equal(createAssignmentSchema.safeParse({ classId: ID2 }).success, false);
});
test('createAssignmentSchema: rejects a non-UUID classId', () => {
  assert.equal(createAssignmentSchema.safeParse({ teacherId: ID, classId: 'class-1' }).success, false);
});
test('updateAssignmentSchema: rejects an empty update', () => {
  assert.equal(updateAssignmentSchema.safeParse({}).success, false);
});

// ---------- section schema ----------
for (const [length, ok] of [[0, false], [1, true], [50, true], [51, false]]) {
  test(`createSectionSchema: name length ${length}`, () => {
    assert.equal(createSectionSchema.safeParse({ name: 'a'.repeat(length), classId: ID }).success, ok);
  });
}
test('updateSectionSchema: rejects a missing name', () => {
  assert.equal(updateSectionSchema.safeParse({}).success, false);
});
test('classTeacherSchema: accepts a teacher id and null (remove class teacher)', () => {
  assert.equal(classTeacherSchema.safeParse({ teacherId: ID }).success, true);
  assert.equal(classTeacherSchema.safeParse({ teacherId: null }).success, true);
});
test('classTeacherSchema: rejects a missing teacherId', () => {
  assert.equal(classTeacherSchema.safeParse({}).success, false);
});

// BVA: roster of 0..500 students
for (const [count, ok] of [[0, true], [1, true], [500, true], [501, false]]) {
  test(`studentRosterSchema: ${count} students`, () => {
    const ids = Array.from({ length: count }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
    assert.equal(studentRosterSchema.safeParse({ studentIds: ids }).success, ok);
  });
}
test('studentRosterSchema: rejects duplicate student ids', () => {
  assert.equal(studentRosterSchema.safeParse({ studentIds: [ID, ID] }).success, false);
});

// ---------- term marks ----------
const termBase = { subjectId: ID, academicYear: '2026' };
const row = (extra = {}) => ({ studentId: ID, mt1Mark: 10, hyMark: null, mt2Mark: 0, ...extra });
test('termMarksSchema: accepts marks with null and zero values', () => {
  assert.equal(termMarksSchema.safeParse({ ...termBase, marks: [row()] }).success, true);
});
test('termMarksSchema: rejects a negative mark (Min-)', () => {
  assert.equal(termMarksSchema.safeParse({ ...termBase, marks: [row({ mt1Mark: -1 })] }).success, false);
});
test('termMarksSchema: rejects the same student twice', () => {
  assert.equal(termMarksSchema.safeParse({ ...termBase, marks: [row(), row()] }).success, false);
});
test('termMarksSchema: rejects an academic year shorter than 4 characters', () => {
  assert.equal(termMarksSchema.safeParse({ subjectId: ID, academicYear: '26', marks: [] }).success, false);
});
