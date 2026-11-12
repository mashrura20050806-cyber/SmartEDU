const { z } = require('zod');

const createFileSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional().nullable(),
  kind: z.enum(['MATERIAL', 'TASK']),
  classId: z.string().uuid().optional().nullable(),
  sectionId: z.string().uuid().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
}).strict().refine(
  (input) => !input.sectionId || Boolean(input.classId),
  'A section-specific file must include its class.',
).refine(
  (input) => input.kind !== 'TASK' || Boolean(input.dueAt),
  'Tasks require a due date.',
);

const updateFileSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
}).strict().refine((input) => Object.keys(input).length > 0, {
  message: 'Provide at least one field to update.',
});

module.exports = { createFileSchema, updateFileSchema };