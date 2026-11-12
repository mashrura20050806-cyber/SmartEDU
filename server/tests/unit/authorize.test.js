const test = require('node:test');
const assert = require('node:assert/strict');
const DatabaseConnection = require('../../src/core/singletons/DatabaseConnection');
const authorize = require('../../src/middleware/authorize');

async function callMiddleware(middleware, req) {
  let error;
  await middleware(req, {}, (nextError) => {
    error = nextError;
  });
  return error;
}

test('allows a role when its permission grants the requested action', async () => {
  const previous = DatabaseConnection.instance;
  let query;
  DatabaseConnection.instance = {
    getClient: () => ({
      permission: {
        findUnique: async (args) => {
          query = args;
          return { canView: true };
        },
      },
    }),
  };

  try {
    const error = await callMiddleware(authorize('NOTICE', 'view'), {
      user: { role: 'TEACHER' },
    });
    assert.equal(error, undefined);
    assert.deepEqual(query.where.role_module, { role: 'TEACHER', module: 'NOTICE' });
    assert.deepEqual(query.select, { canView: true });
  } finally {
    DatabaseConnection.instance = previous;
  }
});

test('rejects a role when its permission does not grant the requested action', async () => {
  const previous = DatabaseConnection.instance;
  DatabaseConnection.instance = {
    getClient: () => ({
      permission: { findUnique: async () => ({ canModify: false }) },
    }),
  };

  try {
    const error = await callMiddleware(authorize('MARKS', 'modify'), {
      user: { role: 'STUDENT' },
    });
    assert.equal(error.statusCode, 403);
  } finally {
    DatabaseConnection.instance = previous;
  }
});

test('requires an authenticated user and rejects unknown permission names', async () => {
  const authenticationError = await callMiddleware(authorize('FILES', 'view'), {});
  assert.equal(authenticationError.statusCode, 401);
  assert.throws(() => authorize('UNKNOWN', 'view'), /Unknown permission/);
});
