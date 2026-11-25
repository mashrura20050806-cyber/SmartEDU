const { z } = require('zod');

const fields = {
  teacherId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid().nullable().optional(),
  subjectId: z.string().uuid().nullable().optional(),
};

const createAssignmentSchema = z.object(fields).strict();
const updateAssignmentSchema = z.object({
  teacherId: fields.teacherId.optional(),
  classId: fields.classId.optional(),
  sectionId: fields.sectionId,
  subjectId: fields.subjectId,
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Provide at least one field to update.',
});

module.exports = { createAssignmentSchema, updateAssignmentSchema };