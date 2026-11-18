const BaseDashboard = require('./BaseDashboard.js');

/**
 * Admin has view/write/modify on every module in the feature-access
 * matrix except Dashboard and Auth themselves, so the admin dashboard
 * surfaces every manageable area of the school, with full action rights.
 */
class AdminDashboard extends BaseDashboard {
  getHeadline() {
    return {
      title: 'School administration',
      subtitle: 'Manage accounts, academic records and school-wide learning updates.',
    };
  }

  getWidgets() {
    return [
      {
        id: 'notices',
        title: 'Notices',
        module: 'NOTICE',
        action: 'modify',
        description: 'Create, edit and publish notices for every class and section.',
        priority: 1,
      },
      {
        id: 'marks',
        title: 'Marks & performance',
        module: 'MARKS',
        action: 'modify',
        description: 'Review and adjust exam marks and term results school-wide.',
        priority: 2,
      },
      {
        id: 'files',
        title: 'Files & class tasks',
        module: 'FILES',
        action: 'modify',
        description: 'Manage every learning file and class task across the school.',
        priority: 3,
      },
      {
        id: 'users',
        title: 'People',
        module: 'USERS',
        action: 'modify',
        description: 'Manage student, teacher, principal and assistant accounts.',
        priority: 4,
      },
      {
        id: 'classes',
        title: 'Classes & sections',
        module: 'CLASSES',
        action: 'modify',
        description: 'Create and manage classes, sections and student rosters.',
        priority: 5,
      },
      {
        id: 'subjects',
        title: 'Subjects',
        module: 'SUBJECTS',
        action: 'modify',
        description: 'Manage subjects and how they attach to classes and teachers.',
        priority: 6,
      },
      {
        id: 'assignments',
        title: 'Teacher assignments',
        module: 'ASSIGNMENTS',
        action: 'modify',
        description: 'Assign and reassign teachers to classes, sections and subjects.',
        priority: 7,
      },
      {
        id: 'permissions',
        title: 'Permissions',
        module: 'RBAC',
        action: 'modify',
        description: 'Control what each role can view, write or modify system-wide.',
        priority: 8,
      },
    ];
  }
}

module.exports = AdminDashboard;
