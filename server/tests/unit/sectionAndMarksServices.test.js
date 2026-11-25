// Unit & black-box tests for src/services/section.service.js and src/services/marks.service.js
// Database replaced by a fake. Techniques: Decision Table (role visibility), Boundary Value Analysis (score vs exam maximum), Error Guessing.
const test = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../../src/core/singletons/DatabaseConnection');
let fakeClient = {};
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true,
  exports: { getInstance: () => ({ getClient: () => fakeClient }) },
};

const sectionService = require('../../src/services/section.service');
const marksService = require('../../src/services/marks.service');

const dbError = (code) => Object.assign(new Error('Database error'), { code });
const hasStatus = (code) => (err) => err.statusCode === code;
const admin = { id: 'adm1', role: 'ADMIN' };

// ======================== section.service ========================
test('listSections (Decision Table R1 - ADMIN): returns all sections with no filter', async () => {
  let queryArgs;
  fakeClient = { section: { findMany: async (args) => { queryArgs = args; return [{ id: 'sec1' }]; } } };
  const result = await sectionService.listSections({ id: 'adm1', role: 'ADMIN' });
  assert.equal(result.length, 1);
  assert.deepEqual(queryArgs.where, {});
});

test('listSections (Decision Table R2 - STUDENT): filters sections to the student own enrollment', async () => {
  let queryArgs;
  fakeClient = { section: { findMany: async (args) => { queryArgs = args; return []; } } };
  await sectionService.listSections({ id: 'stu1', role: 'STUDENT' });
  assert.deepEqual(queryArgs.where, { students: { some: { id: 'stu1' } } });
});

test('listSections (Decision Table R3 - TEACHER): matches assigned sections, assigned classes or class-teacher role', async () => {
  let queryArgs;
  fakeClient = { section: { findMany: async (args) => { queryArgs = args; return []; } } };
  await sectionService.listSections({ id: 't1', role: 'TEACHER' });
  assert.equal(queryArgs.where.OR.length, 3);
});

test('listSections: a classId filter is added to the query', async () => {
  let queryArgs;
  fakeClient = { section: { findMany: async (args) => { queryArgs = args; return []; } } };
  await sectionService.listSections(admin, 'cls1');
  assert.deepEqual(queryArgs.where, { classId: 'cls1' });
});

test('createSection: creates and returns a section for valid input', async () => {
  fakeClient = { section: { create: async ({ data }) => ({ id: 'sec1', ...data }) } };
  const created = await sectionService.createSection({ name: 'Section A', classId: 'cls1' });
  assert.equal(created.id, 'sec1');
});

test('createSection: a duplicate section name in the same class (P2002) gives 409', async () => {
  fakeClient = { section: { create: async () => { throw dbError('P2002'); } } };
  await assert.rejects(() => sectionService.createSection({ name: 'Section A', classId: 'cls1' }), hasStatus(409));
});

test('createSection: a missing class (P2003) gives 400', async () => {
  fakeClient = { section: { create: async () => { throw dbError('P2003'); } } };
  await assert.rejects(() => sectionService.createSection({ name: 'A', classId: 'x' }), hasStatus(400));
});

test('updateSection: updates the name and returns the record', async () => {
  fakeClient = { section: { update: async ({ where, data }) => ({ id: where.id, ...data }) } };
  const updated = await sectionService.updateSection('sec1', { name: 'Section B' });
  assert.equal(updated.name, 'Section B');
});

test('updateSection: a non-existent section (P2025) gives 404', async () => {
  fakeClient = { section: { update: async () => { throw dbError('P2025'); } } };
  await assert.rejects(() => sectionService.updateSection('missing', { name: 'B' }), hasStatus(404));
});

test('getSectionRoster: a student and an assistant are not allowed (403)', async () => {
  fakeClient = {};
  await assert.rejects(() => sectionService.getSectionRoster({ id: 's', role: 'STUDENT' }, 'sec1'), hasStatus(403));
  await assert.rejects(() => sectionService.getSectionRoster({ id: 'a', role: 'ASSISTANT' }, 'sec1'), hasStatus(403));
});

test('getSectionRoster: a missing section gives 404', async () => {
  fakeClient = { section: { findUnique: async () => null } };
  await assert.rejects(() => sectionService.getSectionRoster(admin, 'nope'), hasStatus(404));
});

// ======================== marks.service ========================
test('listExams (ADMIN): lists all exams with no class restriction', async () => {
  let queryArgs;
  fakeClient = { exam: { findMany: async (args) => { queryArgs = args; return [{ id: 'ex1' }]; } } };
  const exams = await marksService.listExams({ id: 'adm1', role: 'ADMIN' });
  assert.equal(exams.length, 1);
  assert.deepEqual(queryArgs.where, {});
});

test('listExams (STUDENT): restricts exams to the class the student belongs to', async () => {
  let queryArgs;
  fakeClient = {
    user: { findUnique: async () => ({ section: { classId: 'cls1' } }) },
    exam: { findMany: async (args) => { queryArgs = args; return []; } },
  };
  await marksService.listExams({ id: 'stu1', role: 'STUDENT' });
  assert.deepEqual(queryArgs.where, { classId: 'cls1' });
});

test('listExams (STUDENT without a section): returns an empty list', async () => {
  fakeClient = { user: { findUnique: async () => ({ section: null }) } };
  assert.deepEqual(await marksService.listExams({ id: 'stu1', role: 'STUDENT' }), []);
});

test('createExam: an admin can create an exam for a subject of the selected class', async () => {
  fakeClient = {
    subject: { findUnique: async () => ({ classId: 'cls1' }) },
    exam: { create: async ({ data }) => ({ id: 'ex1', ...data }) },
  };
  const exam = await marksService.createExam(
    { title: 'Midterm', classId: 'cls1', subjectId: 'sub1', maxMarks: 100, examDate: '2026-11-24T09:00:00.000Z' },
    admin,
  );
  assert.equal(exam.id, 'ex1');
  assert.equal(exam.createdById, 'adm1');
  assert.ok(exam.examDate instanceof Date);
});

test('createExam: a subject from another class is rejected (400)', async () => {
  fakeClient = { subject: { findUnique: async () => ({ classId: 'other' }) } };
  await assert.rejects(
    () => marksService.createExam({ title: 'M', classId: 'cls1', subjectId: 'sub1', maxMarks: 100, examDate: '2026-11-24' }, admin),
    hasStatus(400),
  );
});

test('createExam: an unknown subject is rejected (400)', async () => {
  fakeClient = { subject: { findUnique: async () => null } };
  await assert.rejects(
    () => marksService.createExam({ title: 'M', classId: 'cls1', subjectId: 'x', maxMarks: 100, examDate: '2026-11-24' }, admin),
    hasStatus(400),
  );
});

test('createExam: a teacher without an assignment for the class is rejected (403)', async () => {
  fakeClient = {
    subject: { findUnique: async () => ({ classId: 'cls1' }) },
    teacherAssignment: { findMany: async () => [] },
  };
  await assert.rejects(
    () => marksService.createExam({ title: 'M', classId: 'cls1', subjectId: 'sub1', maxMarks: 100, examDate: '2026-11-24' }, { id: 't1', role: 'TEACHER' }),
    hasStatus(403),
  );
});

// createMark: BVA on score against the exam maximum (100)
function markDb() {
  return {
    exam: { findUnique: async () => ({ id: 'ex1', classId: 'cls1', subjectId: 'sub1', maxMarks: 100 }) },
    user: { findUnique: async () => ({ role: 'STUDENT', status: 'ACTIVE', sectionId: 's1', section: { classId: 'cls1' } }) },
    mark: { create: async ({ data }) => ({ id: 'm1', ...data }) },
  };
}
const boundaryScores = [
  ['score 0      (Min)', 0, true],
  ['score 99.99  (Max-)', 99.99, true],
  ['score 100    (Max)', 100, true],
  ['score 100.01 (Max+)', 100.01, false],
];
for (const [label, score, accepted] of boundaryScores) {
  test(`createMark BVA: ${label}`, async () => {
    fakeClient = markDb();
    const action = () => marksService.createMark('ex1', { studentId: 'stu1', score }, admin);
    if (accepted) assert.equal((await action()).score, score);
    else await assert.rejects(action, hasStatus(400));
  });
}

test('createMark: an unknown exam gives 404', async () => {
  fakeClient = { exam: { findUnique: async () => null } };
  await assert.rejects(() => marksService.createMark('nope', { studentId: 's', score: 5 }, admin), hasStatus(404));
});

test('createMark: a student from another class is rejected (400)', async () => {
  fakeClient = markDb();
  fakeClient.user.findUnique = async () => ({ role: 'STUDENT', status: 'ACTIVE', sectionId: 's9', section: { classId: 'other' } });
  await assert.rejects(() => marksService.createMark('ex1', { studentId: 'stu1', score: 5 }, admin), hasStatus(400));
});

test('createMark: a duplicate mark (P2002) gives 409', async () => {
  fakeClient = markDb();
  fakeClient.mark.create = async () => { throw dbError('P2002'); };
  await assert.rejects(() => marksService.createMark('ex1', { studentId: 'stu1', score: 5 }, admin), hasStatus(409));
});

test('createMark: a student account may not record marks (403)', async () => {
  fakeClient = markDb();
  await assert.rejects(() => marksService.createMark('ex1', { studentId: 'stu1', score: 5 }, { id: 's', role: 'STUDENT' }), hasStatus(403));
});
