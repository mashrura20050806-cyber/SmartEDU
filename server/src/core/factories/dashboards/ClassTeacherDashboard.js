const BaseDashboard = require('./BaseDashboard.js');

/**
 * Class Teacher has view/write/modify on Marks, Files and Classes &
 * Sections (scoped to their own class, enforced elsewhere - this factory
 * only declares what the widget grid looks like), and view/write on
 * Notices. This is the fullest set of day-to-day controls any teaching
 * role gets, matching the client-side copy "Keep up with class updates,
 * student progress and learning materials."
 */
class ClassTeacherDashboard extends BaseDashboard {
  getHeadline() {
    return {
      title: 'Your classroom',
      subtitle: 'Keep up with class updates, student progress and learning materials.',
    };
  }

  getWidgets() {
    return [
      {
        id: 'notices',
        title: 'Notices',
        module: 'NOTICE',
        action: 'write',
        description: 'Post updates to your class and its sections.',
        priority: 1,
      },
      {
        id: 'marks',
        title: 'Marks & performance',
        module: 'MARKS',
        action: 'modify',
        description: 'Enter and adjust term marks for the students in your class.',
        priority: 2,
      },
      {
        id: 'files',
        title: 'Files & class tasks',
        module: 'FILES',
        action: 'modify',
        description: 'Share and manage learning materials and tasks for your class.',
        priority: 3,
      },
      {
        id: 'classes',
        title: 'Your class & sections',
        module: 'CLASSES',
        action: 'modify',
        description: 'Manage your class roster and section assignments.',
        priority: 4,
      },
    ];
  }
}

module.exports = ClassTeacherDashboard;
