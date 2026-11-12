const DatabaseConnection = require('../core/singletons/DatabaseConnection');
const AppError = require('../utils/AppError');
const { MODULES, ACTION_FIELDS } = require('../config/modules');

function authorize(module, action) {
  if (!MODULES.includes(module) || !Object.hasOwn(ACTION_FIELDS, action)) {
    throw new Error(`Unknown permission ${module}.${action}.`);
  }

  return async function checkPermission(req, _res, next) {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);

      const permission = await DatabaseConnection.getInstance().getClient().permission.findUnique({
        where: { role_module: { role: req.user.role, module } },
        select: { [ACTION_FIELDS[action]]: true },
      });

      if (!permission?.[ACTION_FIELDS[action]]) {
        throw new AppError('You do not have permission to perform this action.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = authorize;