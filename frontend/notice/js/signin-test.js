(function () {
  "use strict";
  const UI = window.SmartEduUI;
  const API = window.SmartEduAPI;
  const Auth = window.SmartEduAuth;

  if (new URLSearchParams(window.location.search).get("denied")) {
    document.getElementById("denied").hidden = false;
  }

  const select = document.getElementById("user-select");
  let people = [];

  Promise.all([API.getUsers("admin"), API.getUsers("principal"), API.getUsers("teacher")]).then((lists) => {
    people = lists.reduce((all, list) => all.concat(list), []);
    people.forEach((u) => {
      select.appendChild(UI.el("option", { value: String(u.id), text: u.name + " - " + API.roleLabel(u.role) }));
    });
  });

  document.getElementById("signin-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const chosen = people.filter((u) => String(u.id) === select.value)[0];
    if (!chosen) { return; }
    Auth.signIn(chosen);
    window.location.href = Auth.firstPageFor(chosen.role);
  });
})();
