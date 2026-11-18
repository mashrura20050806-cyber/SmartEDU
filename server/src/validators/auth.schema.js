const { z } = require('zod');
const CodeFactory = require('../core/factories/CodeFactory');

const roles = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'CLASS_TEACHER', 'ASSISTANT', 'STUDENT'];
const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string().min(8).max(128);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  institutionalId: z.string().trim().min(1).max(50),
  phone: z.string().trim().min(7).max(30),
  guardianPhone: z.string().trim().min(7).max(30).optional(),
  rollNumber: z.string().trim().min(1).max(30).optional(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  password,
  confirmPassword: z.string().min(8).max(128),
  role: z.enum(roles),
  codeReservationId: z.string().uuid(),
  generatedCode: z.string().trim().toUpperCase().regex(/^[A-Z]{3}-[2-9A-HJ-NP-Z]{6}$/),
}).refine((input) => input.password === input.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match.',
}).refine((input) => CodeFactory.hasRolePrefix(input.role, input.generatedCode), {
  path: ['generatedCode'],
  message: 'The generated code does not match the selected role.',
}).refine((input) => input.role !== 'STUDENT' || (
  Boolean(input.guardianPhone?.trim())
  && Boolean(input.rollNumber?.trim())
  && Boolean(input.classId)
  && Boolean(input.sectionId)
), {
  path: ['sectionId'],
  message: 'Students must provide a roll number, guardian phone, class, and section.',
});

const generateCodeSchema = z.object({ role: z.enum(roles) });
const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
  role: z.enum(roles),
  generatedCode: z.string().trim().toUpperCase().regex(/^[A-Z]{3}-[2-9A-HJ-NP-Z]{6}$/),
  phone: z.string().trim().min(7).max(30).optional().or(z.literal('')),
});
const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password,
});

module.exports = { roles, generateCodeSchema, registerSchema, loginSchema, passwordSchema };