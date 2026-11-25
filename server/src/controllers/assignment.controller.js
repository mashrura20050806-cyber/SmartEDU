const { z } = require('zod');
const { createAssignmentSchema, updateAssignmentSchema } = require('../validators/assignment.schema');
const assignmentService = require('../services/assignment.service');
const AppError = require('../utils/AppError');

async function list(req, res, next) {
  try {
    const assignments = await assignmentService.listAssignments(req.user);
    res.json({ data: { assignments }, error: null });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const parsed = createAssignmentSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const assignment = await assignmentService.createAssignment(parsed.data);
    res.status(201).json({ data: { assignment }, error: null });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = z.string().uuid().safeParse(req.params.id);
    if (!id.success) throw new AppError('Invalid assignment ID.', 400);
    const parsed = updateAssignmentSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const assignment = await assignmentService.updateAssignment(id.data, parsed.data);
    res.json({ data: { assignment }, error: null });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, update };