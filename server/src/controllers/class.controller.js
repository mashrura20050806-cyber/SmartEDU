const { z } = require('zod');
const { createClassSchema, updateClassSchema } = require('../validators/class.schema');
const classService = require('../services/class.service');
const AppError = require('../utils/AppError');

async function list(req, res, next) {
  try {
    const classes = await classService.listClasses(req.user);
    res.json({ data: { classes }, error: null });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const parsed = createClassSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const schoolClass = await classService.createClass(parsed.data);
    res.status(201).json({ data: { schoolClass }, error: null });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) throw new AppError('Invalid class ID.', 400);
    const parsed = updateClassSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const schoolClass = await classService.updateClass(id.data, parsed.data);
    res.json({ data: { schoolClass }, error: null });
  } catch (error) {
    next(error);
  }
}

async function standardSetup(req, res, next) {
  try {
    const parsed = z.object({
      academicYear: z.string().trim().min(4).max(20),
    }).strict().safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const classes = await classService.setupStandardClasses(parsed.data.academicYear);
    res.status(201).json({ data: { classes }, error: null });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, update, standardSetup };