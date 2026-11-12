const test = require('node:test');
const assert = require('node:assert/strict');
const errorHandler = require('../../src/middleware/errorHandler');

function invokeHandler(error) {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  errorHandler(error, {}, response, () => {});
  return response;
}

test('explains how to resolve a database initialization failure', () => {
  const response = invokeHandler({
    name: 'PrismaClientInitializationError',
    message: "Can't reach database server at `localhost:5432`.",
  });

  assert.equal(response.statusCode, 503);
  assert.equal(
    response.body.error.message,
    'The database is unavailable or not initialized. Start PostgreSQL and apply the database schema, then try again.',
  );
});

test('explains how to resolve a missing Prisma database table', () => {
  const response = invokeHandler({ code: 'P2021', message: 'Table does not exist.' });

  assert.equal(response.statusCode, 503);
  assert.match(response.body.error.message, /apply the database schema/);
});

test('does not expose details for unrelated server errors', () => {
  const response = invokeHandler(new Error('internal failure details'));

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.error.message, 'An unexpected server error occurred.');
});
