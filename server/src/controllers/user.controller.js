const { z } = require('zod');
const { createUserSchema, updateUserSchema } = require('../validators/user.schema');
const userService = require('../services/user.service');
const AppError = require('../utils/AppError');

async function list(_req, res, next) {
  try {
    const users = await userService.listUsers();
    res.json({ data: { users }, error: null });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const data = await userService.createUser(parsed.data);
    res.status(201).json({ data, error: null });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const idResult = z.string().uuid().safeParse(req.params.id);
    if (!idResult.success) throw new AppError('Invalid user ID.', 400);
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);
    const data = await userService.updateUser(idResult.data, parsed.data, req.user.id);
    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, create, update };