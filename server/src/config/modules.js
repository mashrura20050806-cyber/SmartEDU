const MODULES = Object.freeze([
  'DASHBOARD',
  'NOTICE',
  'MARKS',
  'FILES',
  'USERS',
  'CLASSES',
  'SUBJECTS',
  'ASSIGNMENTS',
  'AUTH',
  'RBAC',
]);

const ACTION_FIELDS = Object.freeze({
  view: 'canView',
  write: 'canWrite',
  modify: 'canModify',
});

module.exports = { MODULES, ACTION_FIELDS };