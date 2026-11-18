const BaseDashboard = require('./BaseDashboard.js');

/**
 * Student is view-only on every module in the feature-access matrix.
 * The three widgets here match the client-side copy "Find notices,
 * learning materials and your latest academic updates."
 */
class StudentDashboard extends BaseDashboard {
  getHeadline() {
    return {
      title: 'Your school at a glance',
      subtitle: 'Find notices, learning materials and your latest academic updates.',
    };
  }

  getWidgets() {
    return [
      {
        id: 'notices',
        title: 'Notices',
        module: 'NOTICE',
        action: 'view',
        description: 'Notices approved for your class and section.',
        priority: 1,
      },
      {
        id: 'files',
        title: 'Files & class tasks',
        module: 'FILES',
        action: 'view',
        description: 'Learning materials and tasks shared with your class.',
        priority: 2,
      },
      {
        id: 'marks',
        title: 'Marks & performance',
        module: 'MARKS',
        action: 'view',
        description: 'Your own exam marks and term results.',
        priority: 3,
      },
    ];
  }
}

module.exports = StudentDashboard;
