/* SmartEdu - session and role guard (Sprint 1 testing version)
 *
 * Dashboards and the real login belong to other team members. This file keeps a
 * simple session in sessionStorage so each page can be tested by role.
 * When the real login exists, replace getSession() with the real session and keep
 * requireRole() and renderHeader() as they are.
 */
(function () {
  "use strict";

  const SESSION_KEY = "smartedu_session";
  const ENTRY_PAGE = "signin-test.html";

  const NAV = {
    admin: [["Users", "users.html"], ["Notices", "notices.html"]],
    principal: [["Classes and sections", "classes.html"], ["Notices", "notices.html"]],
    teacher: [["My classes and subjects", "teacher-classes.html"], ["Notices", "notices.html"]]
  };

  function getSession() {
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function signIn(user) {
    const session = { id: user.id, name: user.name, role: user.role };
    try { window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) { /* ignore */ }
    return session;
  }

  function signOut() {
    try { window.sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
    window.location.href = ENTRY_PAGE;
  }

  function firstPageFor(role) {
    return NAV[role] ? NAV[role][0][1] : ENTRY_PAGE;
  }

  /* Sends the visitor away if they are not signed in with an allowed role. */
  function requireRole(allowedRoles) {
    const session = getSession();
    if (!session || allowedRoles.indexOf(session.role) === -1) {
      window.location.replace(ENTRY_PAGE + "?denied=1");
      return null;
    }
    return session;
  }

  function renderHeader(session) {
    const UI = window.SmartEduUI;
    const host = document.getElementById("site-header");
    UI.clear(host);

    const nav = UI.el("nav", { "aria-label": "Main" });
    (NAV[session.role] || []).forEach((item) => {
      const link = UI.el("a", { href: item[1], text: item[0] });
      if (window.location.pathname.slice(-item[1].length) === item[1]) { link.setAttribute("aria-current", "page"); }
      nav.appendChild(link);
    });

    const who = UI.el("div", { class: "who" }, [
      UI.el("span", { text: session.name + " (" + window.SmartEduAPI.roleLabel(session.role) + ")" }),
      UI.el("button", { type: "button", text: "Sign out", onclick: signOut })
    ]);

    host.appendChild(UI.el("div", { class: "header-inner" }, [
      UI.el("a", { class: "brand", href: ENTRY_PAGE, text: "SmartEdu" }),
      nav,
      who
    ]));
  }

  window.SmartEduAuth = {
    getSession: getSession,
    signIn: signIn,
    signOut: signOut,
    firstPageFor: firstPageFor,
    requireRole: requireRole,
    renderHeader: renderHeader
  };
})();
