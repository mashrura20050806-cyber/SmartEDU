//23 tests
// Techniques: Equivalence Partitioning (EP) + Boundary Value Analysis (BVA)
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createExamSchema,
  createMarkSchema,
  updateMarkSchema,
} = require('../../src/validators/marks.schema');

const ID = '123e4567-e89b-42d3-a456-426614174000';


const markCases = [
 
  ['score = -1   (Min-, just below boundary)', -1, false],
  ['score = 0    (Min, boundary)', 0, true],
  ['score = 0.01 (Min+, just above boundary)', 0.01, true],
  ['score = 50   (nominal / valid partition)', 50, true],
  ['score = Infinity (not finite)', Infinity, false],
  ['score = NaN  (not a number)', NaN, false],
  ['score = "50" (wrong type: string)', '50', false],
];

for (const [description, score, shouldBeValid] of markCases) {
  test(`createMarkSchema: ${description}`, () => {
    const result = createMarkSchema.safeParse({ studentId: ID, score });
    assert.equal(result.success, shouldBeValid);
  });
}

test('createMarkSchema: rejects a studentId that is not a UUID (invalid partition)', () => {
  assert.equal(createMarkSchema.safeParse({ studentId: 'abc', score: 10 }).success, false);
});

test('createMarkSchema: rejects unknown extra fields (strict)', () => {
  assert.equal(createMarkSchema.safeParse({ studentId: ID, score: 10, hack: true }).success, false);
});


const commentCases = [
  ['comment length 499 (Max-)', 499, true],
  ['comment length 500 (Max)', 500, true],
  ['comment length 501 (Max+)', 501, false],
];
for (const [description, length, shouldBeValid] of commentCases) {
  test(`createMarkSchema: ${description}`, () => {
    const result = createMarkSchema.safeParse({ studentId: ID, score: 5, comment: 'a'.repeat(length) });
    assert.equal(result.success, shouldBeValid);
  });
}

// updateMarkSchema 
test('updateMarkSchema: accepts a score-only update', () => {
  assert.equal(updateMarkSchema.safeParse({ score: 0 }).success, true);
});

test('updateMarkSchema: rejects an empty update', () => {
  const result = updateMarkSchema.safeParse({});
  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /at least one field/i);
});

test('updateMarkSchema: rejects a negative score', () => {
  assert.equal(updateMarkSchema.safeParse({ score: -0.01 }).success, false);
});

// createExamSchema: maxMarks > 0 and <= 100000 
const examBase = { title: 'Midterm', classId: ID, subjectId: ID, examDate: '2026-11-20T09:00:00.000Z' };
const maxMarksCases = [
  ['maxMarks = 0       (Min-, not positive)', 0, false],
  ['maxMarks = 0.01    (Min+, smallest positive)', 0.01, true],
  ['maxMarks = 100     (nominal)', 100, true],
  ['maxMarks = 99999   (Max-)', 99999, true],
  ['maxMarks = 100000  (Max)', 100000, true],
  ['maxMarks = 100001  (Max+)', 100001, false],
];
for (const [description, maxMarks, shouldBeValid] of maxMarksCases) {
  test(`createExamSchema: ${description}`, () => {
    assert.equal(createExamSchema.safeParse({ ...examBase, maxMarks }).success, shouldBeValid);
  });
}

test('createExamSchema: rejects an empty title', () => {
  assert.equal(createExamSchema.safeParse({ ...examBase, title: '   ', maxMarks: 100 }).success, false);
});

test('createExamSchema: rejects a date that is not ISO date-time', () => {
  assert.equal(createExamSchema.safeParse({ ...examBase, examDate: '20/11/2026', maxMarks: 100 }).success, false);
});
