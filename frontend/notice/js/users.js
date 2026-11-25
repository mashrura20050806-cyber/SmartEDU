(function () {
  "use strict";
  const UI = window.SmartEduUI;
  const API = window.SmartEduAPI;
  const Auth = window.SmartEduAuth;

  const session = Auth.requireRole(["admin"]);
  if (!session) { return; }
  Auth.renderHeader(session);

  const form = document.getElementById("user-form");
  const alertBox = document.getElementById("user-alert");
  const fields = {
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    role: document.getElementById("role"),
    password: document.getElementById("password"),
    confirm: document.getElementById("confirm")
  };
  const filter = document.getElementById("role-filter");
  const tableBody = document.getElementById("user-rows");
  const emptyMessage = document.getElementById("user-empty");

  API.ROLES.forEach((r) => {
    fields.role.appendChild(UI.el("option", { value: r.value, text: r.label }));
    filter.appendChild(UI.el("option", { value: r.value, text: r.label }));
  });

  function validate() {
    const errors = {};
    const name = fields.name.value.trim();
    const email = fields.email.value.trim();
    const password = fields.password.value;
    if (!name) { errors.name = "Enter the user's full name."; }
    if (!email) { errors.email = "Enter an email address."; }
    else if (!API.validators.isEmail(email)) { errors.email = "Enter a valid email address, like name@school.edu."; }
    if (!fields.role.value) { errors.role = "Choose a role."; }
    if (!password) { errors.password = "Enter a password."; }
    else if (!API.validators.isStrongPassword(password)) { errors.password = "Use at least 8 characters with a letter and a number."; }
    if (!fields.confirm.value) { errors.confirm = "Re-enter the password."; }
    else if (fields.confirm.value !== password) { errors.confirm = "The passwords do not match."; }
    return errors;
  }

  function showErrors(errors) {
    Object.keys(fields).forEach((key) => UI.setFieldError(fields[key], errors[key] || ""));
    const first = Object.keys(fields).filter((key) => errors[key])[0];
    if (first) { fields[first].focus(); }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    UI.hideAlert(alertBox);
    const errors = validate();
    showErrors(errors);
    if (Object.keys(errors).length) { return; }

    API.createUser(session, {
      name: fields.name.value,
      email: fields.email.value,
      role: fields.role.value,
      password: fields.password.value
    }).then((user) => {
      UI.showAlert(alertBox, "ok", "Account created for " + user.name + " (" + API.roleLabel(user.role) + ").");
      form.reset();
      renderUsers();
    }).catch((err) => {
      if (err.field && fields[err.field]) {
        const one = {};
        one[err.field] = err.message;
        showErrors(one);
      } else {
        UI.showAlert(alertBox, "error", err.message);
      }
    });
  });

  function renderUsers() {
    API.getUsers(filter.value || undefined).then((users) => {
      UI.clear(tableBody);
      emptyMessage.hidden = users.length > 0;
      users.forEach((u) => {
        tableBody.appendChild(UI.el("tr", {}, [
          UI.el("td", { text: u.name }),
          UI.el("td", { text: u.email }),
          UI.el("td", { text: API.roleLabel(u.role) })
        ]));
      });
    });
  }

  filter.addEventListener("change", renderUsers);
  renderUsers();
})();
