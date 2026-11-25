// Extra black-box tests for CodeFactory (adds to the existing CodeFactory.test.js)
// Techniques: EP (valid/invalid roles, string/non-string codes) + Error Guessing
const test = require('node:test');
const assert = require('node:assert/strict');
const CodeFactory = require('../../src/core/factories/CodeFactory');

test('hasRolePrefix: a non-string code returns false', () => {
  assert.equal(CodeFactory.hasRolePrefix('STUDENT', 12345), false);
});

test('hasRolePrefix: null and undefined codes return false', () => {
  assert.equal(CodeFactory.hasRolePrefix('STUDENT', null), false);
  assert.equal(CodeFactory.hasRolePrefix('STUDENT', undefined), false);
});

test('hasRolePrefix: an unknown role returns false', () => {
  assert.equal(CodeFactory.hasRolePrefix('UNKNOWN', 'STU-7K3Q9X'), false);
});

test('hasRolePrefix: prefix without the hyphen is rejected', () => {
  assert.equal(CodeFactory.hasRolePrefix('STUDENT', 'STU7K3Q9X'), false);
});

test('generate: two generated codes for the same role are not identical', () => {
  const generator = CodeFactory.create('TEACHER');
  assert.notEqual(generator.generate(), generator.generate());
});

test('generate: 200 codes never contain look-alike characters 0, 1, I or O', () => {
  const generator = CodeFactory.create('ADMIN');
  for (let i = 0; i < 200; i += 1) {
    assert.doesNotMatch(generator.generate().slice(4), /[01IO]/);
  }
});

test('create: undefined and empty-string roles are rejected', () => {
  assert.throws(() => CodeFactory.create(undefined), /Unsupported account role/);
  assert.throws(() => CodeFactory.create(''), /Unsupported account role/);
});
