const test = require('node:test');
const assert = require('node:assert/strict');
const CodeFactory = require('../../src/core/factories/CodeFactory');

const rolePrefixes = {
  ADMIN: 'ADM',
  PRINCIPAL: 'PRI',
  TEACHER: 'TCH',
  CLASS_TEACHER: 'CLT',
  ASSISTANT: 'AST',
  STUDENT: 'STU',
};

for (const [role, prefix] of Object.entries(rolePrefixes)) {
  test(`generates a role-prefixed code for ${role}`, () => {
    const code = CodeFactory.create(role).generate();
    assert.match(code, new RegExp(`^${prefix}-[2-9A-HJ-NP-Z]{6}$`));
    assert.equal(CodeFactory.hasRolePrefix(role, code), true);
  });
}

test('does not accept codes with another role prefix', () => {
  assert.equal(CodeFactory.hasRolePrefix('STUDENT', 'ADM-7K3Q9X'), false);
});

test('rejects unsupported roles', () => {
  assert.throws(() => CodeFactory.create('UNKNOWN'), /Unsupported account role/);
});
