const { z } = require('zod');

const fields = {
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().max(30).nullable().optional(),
  classId: z.string().uuid(),
  mt1MaxMarks: z.number().finite().positive().max(100000).optional(),
  hyMaxMarks: z.number().finite().positive().max(100000).optional(),
  mt2MaxMarks: z.number().finite().positive().max(100000).optional(),
};

const createSubjectSchema = z.object(fields).strict();
const updateSubjectSchema = z.object({
  name: fields.name.optional(),
  code: fields.code,
  classId: fields.classId.optional(),
  mt1MaxMarks: fields.mt1MaxMarks,
  hyMaxMarks: fields.hyMaxMarks,
  mt2MaxMarks: fields.mt2MaxMarks,
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Provide at least one field to update.',
});

module.exports = { createSubjectSchema, updateSubjectSchema };