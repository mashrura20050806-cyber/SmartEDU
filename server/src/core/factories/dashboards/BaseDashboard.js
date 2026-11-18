const { MODULES, ACTION_FIELDS } = require('../../../config/modules.js');

const VALID_ACTIONS = Object.keys(ACTION_FIELDS);

/**
 * Common shape every role-specific dashboard (see the sibling files in this
 * folder) is built on. A "dashboard" here is a structured description of
 * which widgets a role is entitled to see and in what order - not the
 * widgets' data. Fetching the actual notices/marks/files for those widgets
 * is dashboard.service.js's job; it can call DashboardFactory.describe(role)
 * to know what to fetch, instead of re-encoding the same role-to-feature
 * rules a second time.
 */
class BaseDashboard {
  constructor(role) {
    if (new.target === BaseDashboard) {
      throw new Error('BaseDashboard is abstract - create a dashboard through DashboardFactory.create(role).');
    }
    this.role = role;
  }

  /**
   * Short label shown above the widget grid. Override per role; the
   * default below is only a fallback for a subclass that forgets to.
   */
  getHeadline() {
    return {
      title: 'Your dashboard',
      subtitle: 'An overview of what matters to you today.',
    };
  }

  /**
   * The widgets this role's dashboard is built from, in display order.
   * Each entry must be shaped as:
   *   { id, title, module, action, description, priority }
   * where `module` is one of config/modules.js MODULES and `action` is one
   * of 'view' | 'write' | 'modify' (config/modules.js ACTION_FIELDS).
   * Subclasses are required to implement this - see AdminDashboard.js,
   * PrincipalDashboard.js, TeacherDashboard.js, ClassTeacherDashboard.js,
   * AssistantDashboard.js, and StudentDashboard.js.
   */
  getWidgets() {
    throw new Error(`${this.constructor.name} must implement getWidgets().`);
  }

  /**
   * Validates every declared widget against the real module/action lists
   * (so a typo in a subclass - a module name that doesn't exist, an action
   * that isn't 'view'/'write'/'modify' - drops that widget instead of
   * silently shipping a broken one), sorts by priority, and returns the
   * finished description for this role's dashboard.
   */
  describe() {
    const widgets = this.getWidgets()
      .filter((widget) => MODULES.includes(widget.module) && VALID_ACTIONS.includes(widget.action))
      .sort((a, b) => a.priority - b.priority);

    return {
      role: this.role,
      headline: this.getHeadline(),
      widgets,
    };
  }
}

module.exports = BaseDashboard;
