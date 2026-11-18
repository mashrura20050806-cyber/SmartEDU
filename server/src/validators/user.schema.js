const { z } = require('zod');
const { ROLES } = require('../config/roles');

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const userFields = {
  name: z.string().trim().min(2).max(100),
  email,
  institutionalId: z.string().trim().min(1).max(50),
  role: z.enum(ROLES),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE']),
  phone: z.string().trim().max(30).nullable().optional(),
};

const createUserSchema = z.object({
  ...userFields,
  password: z.string().min(8).max(128),
});

const updateUserSchema = z.object({
  name: userFields.name.optional(),
  email: userFields.email.optional(),
  institutionalId: userFields.institutionalId.optional(),
  role: userFields.role.optional(),
  status: userFields.status.optional(),
  phone: userFields.phone,
  password: z.string().min(8).max(128).optional(),
}).strict().refine((input) => Object.keys(input).length > 0, {
  message: 'Provide at least one field to update.',
});

module.exports = { createUserSchema, updateUserSchema };