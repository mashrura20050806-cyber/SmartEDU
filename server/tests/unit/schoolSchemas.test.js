const test = require('node:test');
const assert = require('node:assert/strict');
const { createClassSchema, updateClassSchema } = require('../../src/validators/class.schema');
const {
  createSectionSchema, studentRosterSchema, termMarksSchema,
} = require('../../src/validators/section.schema');
const { createSubjectSchema } = require('../../src/validators/subject.schema');
const { createAssignmentSchema } = require('../../src/validators/assignment.schema');

const classId = '35326fba-0790-4a79-93d6-8ce121315095';
const sectionId = 'e0411e7c-cb03-4817-9974-80d83d2225f7';
const subjectId = '512f871f-9815-41e3-8356-16ee765875ef';
const teacherId = '2498b46e-7b9e-4129-a688-a98e44ab5871';
const studentId = '8fa223ac-0db2-4b17-a72c-b98873a66f3f';

test('validates class, section, and subject data', () => {
  assert.equal(createClassSchema.safeParse({
    name: 'Grade 8',
    grade: 8,
    academicYear: '2026-2027',
  }).success, true);
  assert.equal(createClassSchema.safeParse({
    name: 'Grade 13',
    grade: 13,
    academicYear: '2026-2027',
  }).success, false);
  assert.equal(updateClassSchema.safeParse({}).success, false);
  assert.equal(createSectionSchema.safeParse({ name: 'A', classId }).success, true);
  assert.equal(createSubjectSchema.safeParse({ name: 'Science', classId }).success, true);
  assert.equal(createSubjectSchema.safeParse({
    name: 'Science', classId, mt1MaxMarks: 50, hyMaxMarks: 100, mt2MaxMarks: 75,
  }).success, true);
  assert.equal(createSubjectSchema.safeParse({ name: 'Science', classId, mt1MaxMarks: 0 }).success, false);
});

test('validates teacher assignments and rejects duplicate student roster IDs', () => {
  assert.equal(createAssignmentSchema.safeParse({
    teacherId,
    classId,
    sectionId,
    subjectId,
  }).success, true);
  assert.equal(createAssignmentSchema.safeParse({
    teacherId: 'invalid',
    classId,
  }).success, false);
  assert.equal(studentRosterSchema.safeParse({ studentIds: [studentId] }).success, true);
  assert.equal(studentRosterSchema.safeParse({ studentIds: [studentId, studentId] }).success, false);
  const termMarks = {
    subjectId,
    academicYear: '2026-2027',
    marks: [{ studentId, mt1Mark: 10, hyMark: null, mt2Mark: 20 }],
  };
  assert.equal(termMarksSchema.safeParse(termMarks).success, true);
  assert.equal(termMarksSchema.safeParse({ ...termMarks, marks: [...termMarks.marks, ...termMarks.marks] }).success, false);
});
