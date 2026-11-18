const BaseDashboard = require('./BaseDashboard.js');

/**
 * Assistant is the narrowest staff role in the feature-access matrix:
 * write access on Notices and Files only - no Marks & Performance, no
 * Subject Management, no Teacher Assignment at all, and only view on
 * Classes & Sections (left off this dashboard since there's nothing the
 * assistant can act on there). Matches the client-side copy "Manage
 * notices and help share learning resources with your school."
 */
class AssistantDashboard extends BaseDashboard {
  getHeadline() {
    return {
      title: 'Your school workspace',
      subtitle: 'Manage notices and help share learning resources with your school.',
    };
  }

  getWidgets() {
    return [
      {
        id: 'notices',
        title: 'Notices',
        module: 'NOTICE',
        action: 'write',
        description: 'Share school-wide notices on behalf of the administration.',
        priority: 1,
      },
      {
        id: 'files',
        title: 'Files & class tasks',
        module: 'FILES',
        action: 'modify',
        description: 'Upload and organize learning materials for classes and sections.',
        priority: 2,
      },
    ];
  }
}

module.exports = AssistantDashboard;
