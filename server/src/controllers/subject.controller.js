const { z } = require('zod');
const { createSubjectSchema, updateSubjectSchema } = require('../validators/subject.schema');
const subjectService = require('../services/subject.service');
const AppError = require('../utils/AppError');

async function list(req, res, next) {
  try {
    const subjects = await subjectService.listSubjects(req.user);
    res.json({ data: { subjects }, error: null });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const parsed = createSubjectSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const subject = await subjectService.createSubject(parsed.data);
    res.status(201).json({ data: { subject }, error: null });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) throw new AppError('Invalid subject ID.', 400);
    const parsed = updateSubjectSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const subject = await subjectService.updateSubject(id.data, parsed.data);
    res.json({ data: { subject }, error: null });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, update };