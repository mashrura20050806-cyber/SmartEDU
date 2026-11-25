const { ROLES } = require('../../config/roles.js');
const AdminDashboard = require('./dashboards/AdminDashboard.js');
const AssistantDashboard = require('./dashboards/AssistantDashboard.js');
const BaseDashboard = require('./dashboards/BaseDashboard.js');
const ClassTeacherDashboard = require('./dashboards/ClassTeacherDashboard.js');
const PrincipalDashboard = require('./dashboards/PrincipalDashboard.js');
const StudentDashboard = require('./dashboards/StudentDashboard.js');
const TeacherDashboard = require('./dashboards/TeacherDashboard.js');

const DASHBOARDS_BY_ROLE = Object.freeze({
  ADMIN: AdminDashboard,
  PRINCIPAL: PrincipalDashboard,
  TEACHER: TeacherDashboard,
  CLASS_TEACHER: ClassTeacherDashboard,
  ASSISTANT: AssistantDashboard,
  STUDENT: StudentDashboard,
});

/**
 * Factory Method: resolves an account role to the dashboard class that
 * knows what that role's dashboard widget grid looks like. This mirrors
 * CodeFactory.js's role -> creator pattern on purpose, so the two
 * factories read the same way: a frozen role -> class map, a static
 * create() that throws on an unsupported role instead of returning
 * something half-built, and no data access of its own.
 *
 * dashboard.service.js (still a placeholder) is the intended caller:
 * it would use DashboardFactory.describe(role) to learn which
 * modules/widgets to fetch data for, instead of re-deriving the
 * role-to-feature rules itself.
 */
class DashboardFactory {
  static create(role) {
    const DashboardClass = DASHBOARDS_BY_ROLE[role];
    if (!DashboardClass) throw new Error(`No dashboard is registered for role: ${role}`);
    return new DashboardClass(role);
  }

  /** Convenience: create(role) and immediately describe() it. */
  static describe(role) {
    return DashboardFactory.create(role).describe();
  }

  /** Every role this factory can build a dashboard for. */
  static supportedRoles() {
    return Object.keys(DASHBOARDS_BY_ROLE);
  }
}

// Every account role (config/roles.js) is expected to have a dashboard
// registered here. Catching a drift between the two early - e.g. a new
// role added to ROLES without a matching dashboard class - is cheaper
// than finding out when a real user of that role hits a broken page.
const unregisteredRoles = ROLES.filter((role) => !DASHBOARDS_BY_ROLE[role]);
if (unregisteredRoles.length > 0) {
  throw new Error(`DashboardFactory is missing a dashboard for role(s): ${unregisteredRoles.join(', ')}`);
}

module.exports = DashboardFactory;
module.exports.BaseDashboard = BaseDashboard;
