const DatabaseConnection = require('../core/singletons/DatabaseConnection');
const AppError = require('../utils/AppError');
const { MODULES } = require('../config/modules');
const { ROLES } = require('../config/roles');

const db = () => DatabaseConnection.getInstance().getClient();

async function listPermissions() {
  const records = await db().permission.findMany({
    orderBy: [{ role: 'asc' }, { module: 'asc' }],
  });
  const saved = new Map(records.map((record) => [`${record.role}:${record.module}`, record]));

  return ROLES.flatMap((role) => MODULES.map((module) => (
    saved.get(`${role}:${module}`)
    || { role, module, canView: false, canWrite: false, canModify: false }
  )));
}

async function getRolePermissions(role) {
  const rows = await db().permission.findMany({
    where: { role },
    select: { module: true, canView: true, canWrite: true, canModify: true },
  });
  return Object.fromEntries(rows.map(({ module, ...actions }) => [module, actions]));
}

async function updatePermission(role, module, changes) {
  if (!ROLES.includes(role) || !MODULES.includes(module)) {
    throw new AppError('Choose a valid role and feature.', 400);
  }

  return db().permission.upsert({
    where: { role_module: { role, module } },
    create: { role, module, ...changes },
    update: changes,
  });
}

module.exports = { listPermissions, getRolePermissions, updatePermission };