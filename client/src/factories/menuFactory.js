const modulesByLabel = {
  Notices: 'NOTICE',
  'Marks & performance': 'MARKS',
  People: 'USERS',
  'Classes & sections': 'CLASSES',
  Subjects: 'SUBJECTS',
  'Teacher assignments': 'ASSIGNMENTS',
  'Files & tasks': 'FILES',
  Permissions: 'RBAC',
};

export default function menuFactory(_role, permissions = {}) {
  return Object.entries(modulesByLabel)
    .filter(([label, module]) => (
      label === 'Permissions'
        ? _role === 'ADMIN'
        : permissions[module]?.canView === true
    ))
    .map(([label]) => label);
}