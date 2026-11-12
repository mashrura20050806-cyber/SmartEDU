const dashboards = {
  ADMIN: {
    kicker: 'SCHOOL ADMINISTRATION',
    welcome: 'Your school workspace is ready.',
    detail: 'Manage accounts, academic records and school-wide learning updates.',
  },
  PRINCIPAL: {
    kicker: 'SCHOOL OVERVIEW',
    welcome: 'A clearer view of your school starts here.',
    detail: 'Review school-wide updates, learning resources and academic progress.',
  },
  TEACHER: {
    kicker: 'YOUR TEACHING SPACE',
    welcome: 'Everything for your classroom, connected.',
    detail: 'Review your assigned classes, learning materials and academic updates.',
  },
  CLASS_TEACHER: {
    kicker: 'YOUR CLASSROOM',
    welcome: 'Your class, all in one place.',
    detail: 'Keep up with class updates, student progress and learning materials.',
  },
  ASSISTANT: {
    kicker: 'YOUR SCHOOL WORKSPACE',
    welcome: 'Keep your school community in the loop.',
    detail: 'Manage notices and help share learning resources with your school.',
  },
  STUDENT: {
    kicker: 'YOUR SCHOOL AT A GLANCE',
    welcome: 'Your learning space is ready.',
    detail: 'Find notices, learning materials and your latest academic updates.',
  },
};

export default function dashboardFactory(role) {
  return dashboards[role] || dashboards.STUDENT;
}