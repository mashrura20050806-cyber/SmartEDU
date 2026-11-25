const { z } = require('zod');
const {
  createSectionSchema,
  updateSectionSchema,
  classTeacherSchema,
  studentRosterSchema,
  termMarksSchema,
} = require('../validators/section.schema');
const sectionService = require('../services/section.service');
const AppError = require('../utils/AppError');

async function list(req, res, next) {
  try {
    let classId;
    if (req.query.classId) {
      const parsedId = z.string().uuid().safeParse(req.query.classId);
      if (!parsedId.success) throw new AppError('Invalid class ID.', 400);
      classId = parsedId.data;
    }
    const sections = await sectionService.listSections(req.user, classId);
    res.json({ data: { sections }, error: null });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const parsed = createSectionSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const section = await sectionService.createSection(parsed.data);
    res.status(201).json({ data: { section }, error: null });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) throw new AppError('Invalid section ID.', 400);
    const parsed = updateSectionSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const section = await sectionService.updateSection(id.data, parsed.data);
    res.json({ data: { section }, error: null });
  } catch (error) {
    next(error);
  }
}

async function assignStudents(req, res, next) {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) throw new AppError('Invalid section ID.', 400);
    const parsed = studentRosterSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const section = await sectionService.assignStudents(id.data, parsed.data.studentIds);
    res.json({ data: { section }, error: null });
  } catch (error) {
    next(error);
  }
}

async function assignClassTeacher(req, res, next) {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) throw new AppError('Invalid section ID.', 400);
    const parsed = classTeacherSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const section = await sectionService.assignClassTeacher(id.data, parsed.data.teacherId);
    res.json({ data: { section }, error: null });
  } catch (error) {
    next(error);
  }
}

async function roster(req, res, next) {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) throw new AppError('Invalid section ID.', 400);
    const section = await sectionService.getSectionRoster(req.user, id.data);
    res.json({ data: { section }, error: null });
  } catch (error) {
    next(error);
  }
}

async function saveTermMarks(req, res, next) {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) throw new AppError('Invalid section ID.', 400);
    const parsed = termMarksSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const result = await sectionService.saveTermMarks(req.user, id.data, parsed.data);
    res.json({ data: result, error: null });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, update, assignStudents, assignClassTeacher, roster, saveTermMarks };