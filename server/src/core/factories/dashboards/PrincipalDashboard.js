const BaseDashboard = require('./BaseDashboard.js');

/**
 * Principal has view/write/modify on Notices, view/modify on Classes,
 * Subjects and Teacher Assignments, and view-only on Marks, Files and
 * People per the feature-access matrix. The Permissions widget is left
 * out here even though RBAC view is listed for Principal: the actual
 * /app/permissions route is restricted to ADMIN only (see RoleRoute
 * usage in AppRoutes.jsx), so showing it on this dashboard would link
 * somewhere the principal can't actually get into.
 */
class PrincipalDashboard extends BaseDashboard {
  getHeadline() {
    return {
      title: 'School overview',
      subtitle: 'Review school-wide updates, learning resources and academic progress.',
    };
  }

  getWidgets() {
    return [
      {
        id: 'notices',
        title: 'Notices',
        module: 'NOTICE',
        action: 'modify',
        description: 'Publish and manage notices sent out across the school.',
        priority: 1,
      },
      {
        id: 'classes',
        title: 'Classes & sections',
        module: 'CLASSES',
        action: 'modify',
        description: 'Review classes and sections, and adjust them when needed.',
        priority: 2,
      },
      {
        id: 'subjects',
        title: 'Subjects',
        module: 'SUBJECTS',
        action: 'modify',
        description: 'Review subject offerings and their class assignments.',
        priority: 3,
      },
      {
        id: 'assignments',
        title: 'Teacher assignments',
        module: 'ASSIGNMENTS',
        action: 'modify',
        description: 'Review and adjust which teachers are assigned where.',
        priority: 4,
      },
      {
        id: 'marks',
        title: 'Marks & performance',
        module: 'MARKS',
        action: 'view',
        description: 'See exam marks and term results across the school.',
        priority: 5,
      },
      {
        id: 'files',
        title: 'Files & class tasks',
        module: 'FILES',
        action: 'view',
        description: 'Browse the learning materials and tasks shared school-wide.',
        priority: 6,
      },
      {
        id: 'users',
        title: 'People',
        module: 'USERS',
        action: 'view',
        description: 'See the staff and student accounts on record.',
        priority: 7,
      },
    ];
  }
}

module.exports = PrincipalDashboard;
