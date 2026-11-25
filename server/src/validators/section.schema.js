const { z } = require('zod');

const createSectionSchema = z.object({
  name: z.string().trim().min(1).max(50),
  classId: z.string().uuid(),
}).strict();

const updateSectionSchema = z.object({
  name: z.string().trim().min(1).max(50),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Provide at least one field to update.',
});

const classTeacherSchema = z.object({
  teacherId: z.string().uuid().nullable(),
}).strict();

const studentRosterSchema = z.object({
  studentIds: z.array(z.string().uuid()).max(500).refine(
    (ids) => new Set(ids).size === ids.length,
    'A student can only be listed once.',
  ),
}).strict();

const termMarksSchema = z.object({
  subjectId: z.string().uuid(),
  academicYear: z.string().trim().min(4).max(20),
  marks: z.array(z.object({
    studentId: z.string().uuid(),
    mt1Mark: z.number().finite().min(0).nullable(),
    hyMark: z.number().finite().min(0).nullable(),
    mt2Mark: z.number().finite().min(0).nullable(),
  }).strict()).max(500).refine(
    (marks) => new Set(marks.map(({ studentId }) => studentId)).size === marks.length,
    'A student can only be listed once.',
  ),
}).strict();

module.exports = {
  createSectionSchema, updateSectionSchema, classTeacherSchema,
  studentRosterSchema, termMarksSchema,
};
