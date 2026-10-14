/* SmartEdu - mock backend (Sprint 1)
 *
 * This file stands in for the real backend and database until the schema owner
 * finishes the tables. Every function returns a Promise, the same way a fetch()
 * call to the real API would. Later, replace the body of each function with a
 * fetch() call and leave the page scripts unchanged.
 *
 * Rules that the real backend must also enforce (never trust the browser):
 *   - only an Admin can create users
 *   - passwords are hashed on the server and never stored in plain text
 *   - only the Principal can approve or reject notices
 *   - Admin and Teacher notices start as "pending"; Principal notices are "approved"
 */
(function () {
  "use strict";

  const DB_KEY = "smartedu_mock_db_v1";

  const ROLES = [
    { value: "admin", label: "Admin" },
    { value: "principal", label: "Principal" },
    { value: "teacher", label: "Teacher" },
    { value: "student", label: "Student" }
  ];

  const validators = {
    isEmail: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    isStrongPassword: (v) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v)
  };

  function roleLabel(value) {
    const found = ROLES.filter((r) => r.value === value)[0];
    return found ? found.label : value;
  }

  function seed() {
    return {
      users: [
        { id: 1, name: "Amina Admin", email: "admin@smartedu.test", role: "admin" },
        { id: 2, name: "Prof. Rahman", email: "principal@smartedu.test", role: "principal" },
        { id: 3, name: "Karim Hossain", email: "karim@smartedu.test", role: "teacher" },
        { id: 4, name: "Nasrin Akter", email: "nasrin@smartedu.test", role: "teacher" },
        { id: 5, name: "Rafi Ahmed", email: "rafi@smartedu.test", role: "student" },
        { id: 6, name: "Sara Khan", email: "sara@smartedu.test", role: "student" }
      ],
      classes: [
        { id: 1, name: "Class 6", sections: [{ name: "A", students: 32, classTeacherId: null }, { name: "B", students: 30, classTeacherId: null }] },
        { id: 2, name: "Class 7", sections: [{ name: "A", students: 34, classTeacherId: null }, { name: "B", students: 31, classTeacherId: null }] },
        { id: 3, name: "Class 8", sections: [{ name: "A", students: 35, classTeacherId: 3 }, { name: "B", students: 33, classTeacherId: 4 }] },
        { id: 4, name: "Class 9", sections: [{ name: "A", students: 36, classTeacherId: null }, { name: "B", students: 29, classTeacherId: null }] },
        { id: 5, name: "Class 10", sections: [{ name: "A", students: 38, classTeacherId: null }, { name: "B", students: 37, classTeacherId: null }] }
      ],
      subjects: [
        { id: 1, name: "Mathematics" },
        { id: 2, name: "English" },
        { id: 3, name: "Science" },
        { id: 4, name: "History" }
      ],
      assignments: [
        { teacherId: 3, classId: 3, section: "A", subjectId: 1 },
        { teacherId: 3, classId: 3, section: "B", subjectId: 1 },
        { teacherId: 3, classId: 4, section: "A", subjectId: 1 },
        { teacherId: 4, classId: 3, section: "A", subjectId: 2 },
        { teacherId: 4, classId: 3, section: "B", subjectId: 2 },
        { teacherId: 4, classId: 5, section: "B", subjectId: 3 }
      ],
      notices: [
        { id: 1, title: "Mid-term exam schedule", message: "Mid-term exams begin on the first Sunday of next month. The full timetable is on the school board.", audience: { type: "all" }, authorId: 2, status: "approved", createdAt: "2026-10-08T09:00:00.000Z" },
        { id: 2, title: "Science fair registration", message: "Class 8 Section A students should submit their project titles to Mr. Hossain by Thursday.", audience: { type: "section", classId: 3, section: "A" }, authorId: 3, status: "pending", createdAt: "2026-10-12T10:30:00.000Z" },
        { id: 3, title: "Library hours changed", message: "The library now closes at 4:00 pm on weekdays.", audience: { type: "all" }, authorId: 1, status: "approved", createdAt: "2026-10-10T08:15:00.000Z" }
      ]
    };
  }

  function load() {
    try {
      const raw = window.localStorage.getItem(DB_KEY);
      if (raw) { return JSON.parse(raw); }
    } catch (e) { /* storage unavailable: fall through to seed data */ }
    const fresh = seed();
    save(fresh);
    return fresh;
  }

  function save(db) {
    try { window.localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { /* ignore */ }
  }

  function nextId(list) {
    return list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }

  function fail(message, field) {
    const err = new Error(message);
    if (field) { err.field = field; }
    return err;
  }

  function findUser(db, id) {
    return db.users.filter((u) => u.id === id)[0] || null;
  }

  function audienceLabel(db, audience) {
    if (audience.type === "all") { return "Everyone"; }
    const cls = db.classes.filter((c) => c.id === audience.classId)[0];
    const className = cls ? cls.name : "Unknown class";
    if (audience.type === "class") { return className; }
    return className + ", Section " + audience.section;
  }

  /* ---------- Users (Admin) ---------- */

  async function getUsers(role) {
    const db = load();
    return db.users.filter((u) => !role || u.role === role).map((u) => Object.assign({}, u));
  }

  async function createUser(actor, input) {
    if (!actor || actor.role !== "admin") { throw fail("Only an admin can create user accounts."); }
    const db = load();
    const name = String(input.name || "").trim();
    const email = String(input.email || "").trim().toLowerCase();
    if (!name) { throw fail("Enter the user's full name.", "name"); }
    if (!validators.isEmail(email)) { throw fail("Enter a valid email address.", "email"); }
    if (!ROLES.some((r) => r.value === input.role)) { throw fail("Choose a role.", "role"); }
    if (!validators.isStrongPassword(String(input.password || ""))) {
      throw fail("Use at least 8 characters with a letter and a number.", "password");
    }
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw fail("An account with this email already exists.", "email");
    }
    // The password is checked but deliberately not stored. The real backend hashes it.
    const user = { id: nextId(db.users), name: name, email: email, role: input.role };
    db.users.push(user);
    save(db);
    return Object.assign({}, user);
  }

  /* ---------- Classes, subjects, assignments ---------- */

  async function getClasses() {
    const db = load();
    return db.classes.map((c) => ({
      id: c.id,
      name: c.name,
      sections: c.sections.map((s) => {
        const teacher = s.classTeacherId ? findUser(db, s.classTeacherId) : null;
        return { name: s.name, students: s.students, classTeacherName: teacher ? teacher.name : "Not assigned" };
      })
    }));
  }

  async function getAssignmentsForTeacher(teacherId) {
    const db = load();
    return db.assignments
      .filter((a) => a.teacherId === teacherId)
      .map((a) => {
        const cls = db.classes.filter((c) => c.id === a.classId)[0];
        const subject = db.subjects.filter((s) => s.id === a.subjectId)[0];
        return { className: cls ? cls.name : "Unknown", section: a.section, subjectName: subject ? subject.name : "Unknown" };
      });
  }

  /* ---------- Notices ---------- */

  async function getNotices(actor) {
    if (!actor || ["admin", "principal", "teacher"].indexOf(actor.role) === -1) {
      throw fail("You do not have access to this page.");
    }
    const db = load();
    return db.notices
      .filter((n) => actor.role !== "teacher" || n.status === "approved" || n.authorId === actor.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((n) => {
        const author = findUser(db, n.authorId);
        return {
          id: n.id,
          title: n.title,
          message: n.message,
          status: n.status,
          createdAt: n.createdAt,
          authorName: author ? author.name : "Unknown",
          authorRole: author ? roleLabel(author.role) : "",
          audienceLabel: audienceLabel(db, n.audience)
        };
      });
  }

  async function createNotice(actor, input) {
    if (!actor || ["admin", "principal", "teacher"].indexOf(actor.role) === -1) {
      throw fail("Your role cannot create notices.");
    }
    const db = load();
    const title = String(input.title || "").trim();
    const message = String(input.message || "").trim();
    const audience = input.audience || {};
    if (!title) { throw fail("Enter a title.", "title"); }
    if (title.length > 100) { throw fail("Keep the title under 100 characters.", "title"); }
    if (!message) { throw fail("Enter the notice message.", "message"); }
    if (message.length > 1000) { throw fail("Keep the message under 1000 characters.", "message"); }
    if (["all", "class", "section"].indexOf(audience.type) === -1) { throw fail("Choose who should see this notice.", "audience"); }
    if (audience.type !== "all" && !db.classes.some((c) => c.id === audience.classId)) { throw fail("Choose a class.", "class"); }
    if (audience.type === "section") {
      const cls = db.classes.filter((c) => c.id === audience.classId)[0];
      if (!cls || !cls.sections.some((s) => s.name === audience.section)) { throw fail("Choose a section.", "section"); }
    }
    const notice = {
      id: nextId(db.notices),
      title: title,
      message: message,
      audience: audience.type === "all" ? { type: "all" }
        : audience.type === "class" ? { type: "class", classId: audience.classId }
        : { type: "section", classId: audience.classId, section: audience.section },
      authorId: actor.id,
      status: actor.role === "principal" ? "approved" : "pending",
      createdAt: new Date().toISOString()
    };
    db.notices.push(notice);
    save(db);
    return { id: notice.id, status: notice.status };
  }

  async function setNoticeStatus(actor, noticeId, status) {
    if (!actor || actor.role !== "principal") { throw fail("Only the principal can approve or reject notices."); }
    if (["approved", "rejected"].indexOf(status) === -1) { throw fail("Unknown status."); }
    const db = load();
    const notice = db.notices.filter((n) => n.id === noticeId)[0];
    if (!notice) { throw fail("This notice no longer exists."); }
    if (notice.status !== "pending") { throw fail("This notice has already been reviewed."); }
    notice.status = status;
    save(db);
    return { id: notice.id, status: notice.status };
  }

  window.SmartEduAPI = {
    ROLES: ROLES,
    roleLabel: roleLabel,
    validators: validators,
    getUsers: getUsers,
    createUser: createUser,
    getClasses: getClasses,
    getAssignmentsForTeacher: getAssignmentsForTeacher,
    getNotices: getNotices,
    createNotice: createNotice,
    setNoticeStatus: setNoticeStatus
  };
})();
