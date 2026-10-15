(function () {
  "use strict";
  const UI = window.SmartEduUI;
  const API = window.SmartEduAPI;
  const Auth = window.SmartEduAuth;

  const session = Auth.requireRole(["teacher"]);
  if (!session) { return; }
  Auth.renderHeader(session);

  const body = document.getElementById("assignment-rows");
  const empty = document.getElementById("assignment-empty");
  const table = document.getElementById("assignment-table");
  const summary = document.getElementById("assignment-summary");

  API.getAssignmentsForTeacher(session.id).then((rows) => {
    UI.clear(body);
    const hasRows = rows.length > 0;
    empty.hidden = hasRows;
    table.hidden = !hasRows;
    summary.textContent = hasRows
      ? "You teach " + rows.length + (rows.length === 1 ? " class" : " classes") + "."
      : "";
    rows.forEach((r) => {
      body.appendChild(UI.el("tr", {}, [
        UI.el("td", { text: r.className }),
        UI.el("td", { text: r.section }),
        UI.el("td", { text: r.subjectName })
      ]));
    });
  });
})();
