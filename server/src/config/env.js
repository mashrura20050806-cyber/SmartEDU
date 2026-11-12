const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  throw new Error(`Invalid server configuration: ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
}

const env = Object.freeze({
  NODE_ENV: result.data.NODE_ENV,
  PORT: result.data.PORT,
  DATABASE_URL: result.data.DATABASE_URL,
  JWT_SECRET: result.data.JWT_SECRET,
  JWT_EXPIRES_IN: result.data.JWT_EXPIRES_IN,
  CLIENT_URL: result.data.CLIENT_URL,
});

module.exports = { env };