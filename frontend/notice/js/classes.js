/* Principal: read-only list of classes and sections. */
(function () {
  "use strict";
  const UI = window.SmartEduUI;
  const API = window.SmartEduAPI;
  const Auth = window.SmartEduAuth;

  const session = Auth.requireRole(["principal"]);
  if (!session) { return; }
  Auth.renderHeader(session);

  const filter = document.getElementById("class-filter");
  const body = document.getElementById("class-rows");
  const empty = document.getElementById("class-empty");
  let classes = [];

  function render() {
    UI.clear(body);
    const shown = classes.filter((c) => !filter.value || String(c.id) === filter.value);
    let count = 0;
    shown.forEach((c) => {
      c.sections.forEach((s) => {
        count += 1;
        body.appendChild(UI.el("tr", {}, [
          UI.el("td", { text: c.name }),
          UI.el("td", { text: s.name }),
          UI.el("td", { text: s.classTeacherName }),
          UI.el("td", { text: String(s.students) })
        ]));
      });
    });
    empty.hidden = count > 0;
  }

  API.getClasses().then((list) => {
    classes = list;
    list.forEach((c) => filter.appendChild(UI.el("option", { value: String(c.id), text: c.name })));
    render();
  });

  filter.addEventListener("change", render);
})();
