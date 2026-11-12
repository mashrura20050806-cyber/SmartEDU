const { z } = require('zod');
const permissionService = require('../services/permission.service');
const AppError = require('../utils/AppError');
const { ROLES } = require('../config/roles');
const { MODULES } = require('../config/modules');

const permissionSchema = z.object({
  canView: z.boolean(),
  canWrite: z.boolean(),
  canModify: z.boolean(),
}).strict();

async function list(_req, res, next) {
  try {
    const permissions = await permissionService.listPermissions();
    res.json({ data: { permissions }, error: null });
  } catch (error) {
    next(error);
  }
}

async function mine(req, res, next) {
  try {
    const permissions = await permissionService.getRolePermissions(req.user.role);
    res.json({ data: { permissions }, error: null });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    if (!ROLES.includes(req.params.role) || !MODULES.includes(req.params.module)) {
      throw new AppError('Choose a valid role and feature.', 400);
    }

    const parsed = permissionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0].message, 400);
    }

    const permission = await permissionService.updatePermission(
      req.params.role,
      req.params.module,
      parsed.data,
    );
    res.json({ data: { permission }, error: null });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, mine, update };