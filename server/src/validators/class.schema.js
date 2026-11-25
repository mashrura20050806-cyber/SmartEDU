const { z } = require('zod');

const fields = {
  name: z.string().trim().min(1).max(80),
  grade: z.number().int().min(1).max(12).nullable().optional(),
  academicYear: z.string().trim().min(4).max(20),
};

const createClassSchema = z.object(fields).strict();
const updateClassSchema = z.object({
  name: fields.name.optional(),
  grade: fields.grade,
  academicYear: fields.academicYear.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Provide at least one field to update.',
});

module.exports = { createClassSchema, updateClassSchema };