// Unit tests for subject.service and assignment.service (database replaced by a fake).
// Techniques: Equivalence Partitioning (valid / invalid teacher, class, section) and Error Guessing (DB error codes).
const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../../src/core/singletons/DatabaseConnection');
let fakeClient = {};
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true,
  exports: { getInstance: () => ({ getClient: () => fakeClient }) },
};

const subjectService = require('../../src/services/subject.service');
const assignmentService = require('../../src/services/assignment.service');

const dbError = (code) => Object.assign(new Error('db'), { code });
const status = (code) => (e) => e.statusCode === code;

// ---------- subject.service: listSubjects ----------
test('listSubjects: a student only sees subjects of their own class', async () => {
  let args;
  fakeClient = { subject: { findMany: async (a) => { args = a; return []; } } };
  await subjectService.listSubjects({ id: 's1', role: 'STUDENT' });
  assert.ok(args.where.schoolClass.sections.some.students.some.id === 's1');
});
test('listSubjects: a teacher sees assigned subjects or whole-class assignments', async () => {
  let args;
  fakeClient = { subject: { findMany: async (a) => { args = a; return []; } } };
  await subjectService.listSubjects({ id: 't1', role: 'TEACHER' });
  assert.equal(args.where.OR.length, 2);
});
test('listSubjects: an admin sees every subject (no filter)', async () => {
  let args;
  fakeClient = { subject: { findMany: async (a) => { args = a; return []; } } };
  await subjectService.listSubjects({ id: 'a1', role: 'ADMIN' });
  assert.deepEqual(args.where, {});
});

// ---------- subject.service: createSubject ----------
test('createSubject: an empty code is stored as null', async () => {
  let data;
  fakeClient = { subject: { create: async (a) => { data = a.data; return a; } } };
  await subjectService.createSubject({ name: 'Math', classId: 'c1', code: '' });
  assert.equal(data.code, null);
});
test('createSubject: a duplicate (P2002) becomes 409', async () => {
  fakeClient = { subject: { create: async () => { throw dbError('P2002'); } } };
  await assert.rejects(() => subjectService.createSubject({ name: 'Math' }), status(409));
});
test('createSubject: a missing class (P2003) becomes 400', async () => {
  fakeClient = { subject: { create: async () => { throw dbError('P2003'); } } };
  await assert.rejects(() => subjectService.createSubject({ name: 'Math' }), status(400));
});

// ---------- subject.service: updateSubject ----------
test('updateSubject: a simple name change is saved', async () => {
  fakeClient = { subject: { update: async ({ data }) => ({ id: 's1', ...data }) } };
  const result = await subjectService.updateSubject('s1', { name: 'Physics' });
  assert.equal(result.name, 'Physics');
});
test('updateSubject: moving a subject that does not exist gives 404', async () => {
  fakeClient = { subject: { findUnique: async () => null } };
  await assert.rejects(() => subjectService.updateSubject('x', { classId: 'c2' }), status(404));
});
test('updateSubject: cannot move a subject that has term marks or assignments (409)', async () => {
  fakeClient = {
    subject: { findUnique: async () => ({ classId: 'c1', _count: { assignments: 1, termMarks: 0 } }) },
  };
  await assert.rejects(() => subjectService.updateSubject('s1', { classId: 'c2' }), status(409));
});
test('updateSubject: a maximum lower than recorded marks is rejected (409)', async () => {
  fakeClient = {
    subject: { findUnique: async () => ({ classId: 'c1', _count: { assignments: 0, termMarks: 0 } }) },
    termMark: { count: async () => 3 },
  };
  await assert.rejects(
    () => subjectService.updateSubject('s1', { classId: 'c1', mt1MaxMarks: 10 }),
    status(409),
  );
});
test('updateSubject: a missing subject (P2025) becomes 404', async () => {
  fakeClient = { subject: { update: async () => { throw dbError('P2025'); } } };
  await assert.rejects(() => subjectService.updateSubject('s1', { name: 'X' }), status(404));
});

// ---------- assignment.service ----------
const activeTeacher = { role: 'TEACHER', status: 'ACTIVE' };
function assignmentDb(overrides = {}) {
  return {
    user: { findUnique: async () => activeTeacher },
    schoolClass: { findUnique: async () => ({ id: 'c1' }) },
    section: { findUnique: async () => ({ classId: 'c1' }) },
    subject: { findUnique: async () => ({ classId: 'c1' }) },
    teacherAssignment: {
      findFirst: async () => null,
      create: async ({ data }) => ({ id: 'a1', ...data }),
      findMany: async () => [],
      findUnique: async () => ({ id: 'a1', teacherId: 't1', classId: 'c1', sectionId: null, subjectId: null }),
      update: async ({ data }) => ({ id: 'a1', ...data }),
    },
    ...overrides,
  };
}
const input = { teacherId: 't1', classId: 'c1' };

test('createAssignment: valid input is saved with a scope key', async () => {
  fakeClient = assignmentDb();
  const result = await assignmentService.createAssignment(input);
  assert.equal(result.scopeKey, JSON.stringify(['t1', 'c1', '', '']));
});
test('createAssignment: a student account is rejected as teacher (400)', async () => {
  fakeClient = assignmentDb({ user: { findUnique: async () => ({ role: 'STUDENT', status: 'ACTIVE' }) } });
  await assert.rejects(() => assignmentService.createAssignment(input), status(400));
});
test('createAssignment: an inactive teacher is rejected (400)', async () => {
  fakeClient = assignmentDb({ user: { findUnique: async () => ({ role: 'TEACHER', status: 'INACTIVE' }) } });
  await assert.rejects(() => assignmentService.createAssignment(input), status(400));
});
test('createAssignment: an unknown class is rejected (400)', async () => {
  fakeClient = assignmentDb({ schoolClass: { findUnique: async () => null } });
  await assert.rejects(() => assignmentService.createAssignment(input), /existing class/);
});
test('createAssignment: a section from another class is rejected (400)', async () => {
  fakeClient = assignmentDb({ section: { findUnique: async () => ({ classId: 'other' }) } });
  await assert.rejects(() => assignmentService.createAssignment({ ...input, sectionId: 's1' }), /section in the selected class/);
});
test('createAssignment: a subject from another class is rejected (400)', async () => {
  fakeClient = assignmentDb({ subject: { findUnique: async () => ({ classId: 'other' }) } });
  await assert.rejects(() => assignmentService.createAssignment({ ...input, subjectId: 'x' }), /subject in the selected class/);
});
test('createAssignment: a duplicate assignment gives 409', async () => {
  const db = assignmentDb();
  db.teacherAssignment.findFirst = async () => ({ id: 'old' });
  fakeClient = db;
  await assert.rejects(() => assignmentService.createAssignment(input), status(409));
});
test('listAssignments: a teacher sees only their own assignments', async () => {
  let args;
  const db = assignmentDb();
  db.teacherAssignment.findMany = async (a) => { args = a; return []; };
  fakeClient = db;
  await assignmentService.listAssignments({ id: 't1', role: 'TEACHER' });
  assert.deepEqual(args.where, { teacherId: 't1' });
});
test('listAssignments: an admin sees all assignments', async () => {
  let args;
  const db = assignmentDb();
  db.teacherAssignment.findMany = async (a) => { args = a; return []; };
  fakeClient = db;
  await assignmentService.listAssignments({ id: 'a1', role: 'ADMIN' });
  assert.deepEqual(args.where, {});
});
test('updateAssignment: a missing assignment gives 404', async () => {
  const db = assignmentDb();
  db.teacherAssignment.findUnique = async () => null;
  fakeClient = db;
  await assert.rejects(() => assignmentService.updateAssignment('x', {}), status(404));
});
test('updateAssignment: a valid change is saved', async () => {
  fakeClient = assignmentDb();
  const result = await assignmentService.updateAssignment('a1', { subjectId: 'sub1' });
  assert.equal(result.subjectId, 'sub1');
});
test('updateAssignment: a change that duplicates another assignment gives 409', async () => {
  const db = assignmentDb();
  db.teacherAssignment.findFirst = async () => ({ id: 'other' });
  fakeClient = db;
  await assert.rejects(() => assignmentService.updateAssignment('a1', { subjectId: 'sub1' }), status(409));
});
