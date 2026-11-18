const BaseDashboard = require('./BaseDashboard.js');

/**
 * Teacher has write access on Notices, Marks and Files, but only view on
 * Classes/Subjects/Assignments (and those views are scoped to the
 * teacher's own assignments by notice.service.js-style filtering, not by
 * this factory). This dashboard keeps to the four areas a teacher
 * actually works in day to day, matching the client-side dashboardFactory
 * copy ("Review your assigned classes, learning materials and academic
 * updates").
 */
class TeacherDashboard extends BaseDashboard {
  getHeadline() {
    return {
      title: 'Your teaching space',
      subtitle: 'Review your assigned classes, learning materials and academic updates.',
    };
  }

  getWidgets() {
    return [
      {
        id: 'notices',
        title: 'Notices',
        module: 'NOTICE',
        action: 'write',
        description: 'Post updates to your assigned classes and sections.',
        priority: 1,
      },
      {
        id: 'marks',
        title: 'Marks & performance',
        module: 'MARKS',
        action: 'write',
        description: 'Enter exam marks for the classes and subjects you teach.',
        priority: 2,
      },
      {
        id: 'files',
        title: 'Files & class tasks',
        module: 'FILES',
        action: 'modify',
        description: 'Share learning materials and manage tasks for your classes.',
        priority: 3,
      },
      {
        id: 'classes',
        title: 'Your classes',
        module: 'CLASSES',
        action: 'view',
        description: 'See the classes and sections you are assigned to teach.',
        priority: 4,
      },
    ];
  }
}

module.exports = TeacherDashboard;
