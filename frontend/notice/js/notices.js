(function () {
  "use strict";
  const UI = window.SmartEduUI;
  const API = window.SmartEduAPI;
  const Auth = window.SmartEduAuth;

  const session = Auth.requireRole(["admin", "principal", "teacher"]);
  if (!session) { return; }
  Auth.renderHeader(session);

  const STATUS_TEXT = { pending: "Pending approval", approved: "Approved", rejected: "Rejected" };

  const form = document.getElementById("notice-form");
  const formAlert = document.getElementById("notice-alert");
  const listAlert = document.getElementById("list-alert");
  const title = document.getElementById("title");
  const message = document.getElementById("message");
  const audience = document.getElementById("audience");
  const classSelect = document.getElementById("class");
  const sectionSelect = document.getElementById("section");
  const classField = document.getElementById("class-field");
  const sectionField = document.getElementById("section-field");
  const statusFilter = document.getElementById("status-filter");
  const list = document.getElementById("notice-list");
  const empty = document.getElementById("notice-empty");
  const approvalHint = document.getElementById("approval-hint");

  let classes = [];

  approvalHint.textContent = session.role === "principal"
    ? "Notices you post are published straight away."
    : "Your notice goes to the Principal for approval before students can see it.";

  function fillSections() {
    UI.clear(sectionSelect);
    sectionSelect.appendChild(UI.el("option", { value: "", text: "Choose a section" }));
    const cls = classes.filter((c) => String(c.id) === classSelect.value)[0];
    if (cls) {
      cls.sections.forEach((s) => sectionSelect.appendChild(UI.el("option", { value: s.name, text: "Section " + s.name })));
    }
  }

  function updateAudienceFields() {
    classField.hidden = audience.value === "all";
    sectionField.hidden = audience.value !== "section";
    UI.setFieldError(classSelect, "");
    UI.setFieldError(sectionSelect, "");
  }

  API.getClasses().then((result) => {
    classes = result;
    classSelect.appendChild(UI.el("option", { value: "", text: "Choose a class" }));
    result.forEach((c) => classSelect.appendChild(UI.el("option", { value: String(c.id), text: c.name })));
    fillSections();
  });

  audience.addEventListener("change", updateAudienceFields);
  classSelect.addEventListener("change", fillSections);
  updateAudienceFields();

  function validate() {
    const errors = [];
    if (!title.value.trim()) { errors.push([title, "Enter a title."]); }
    else if (title.value.trim().length > 100) { errors.push([title, "Keep the title under 100 characters."]); }
    if (!message.value.trim()) { errors.push([message, "Enter the notice message."]); }
    else if (message.value.trim().length > 1000) { errors.push([message, "Keep the message under 1000 characters."]); }
    if (audience.value !== "all" && !classSelect.value) { errors.push([classSelect, "Choose a class."]); }
    if (audience.value === "section" && !sectionSelect.value) { errors.push([sectionSelect, "Choose a section."]); }
    return errors;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    UI.hideAlert(formAlert);
    [title, message, classSelect, sectionSelect].forEach((input) => UI.setFieldError(input, ""));

    const errors = validate();
    errors.forEach((pair) => UI.setFieldError(pair[0], pair[1]));
    if (errors.length) { errors[0][0].focus(); return; }

    API.createNotice(session, {
      title: title.value,
      message: message.value,
      audience: {
        type: audience.value,
        classId: classSelect.value ? Number(classSelect.value) : null,
        section: sectionSelect.value
      }
    }).then((result) => {
      UI.showAlert(formAlert, "ok", result.status === "approved"
        ? "Notice published."
        : "Notice sent to the Principal for approval.");
      form.reset();
      updateAudienceFields();
      fillSections();
      renderNotices();
    }).catch((err) => UI.showAlert(formAlert, "error", err.message));
  });

  function review(notice, status) {
    UI.hideAlert(listAlert);
    API.setNoticeStatus(session, notice.id, status).then(() => {
      UI.showAlert(listAlert, "ok", status === "approved"
        ? "Approved \"" + notice.title + "\"."
        : "Rejected \"" + notice.title + "\".");
      renderNotices();
    }).catch((err) => {
      UI.showAlert(listAlert, "error", err.message);
      renderNotices();
    });
  }

  function noticeCard(n) {
    const children = [
      UI.el("h3", {}, [n.title, UI.el("span", { class: "status status-" + n.status, text: STATUS_TEXT[n.status] || n.status })]),
      UI.el("p", { class: "meta", text: "Posted by " + n.authorName + " (" + n.authorRole + ") on " + UI.formatDate(n.createdAt) + ". For: " + n.audienceLabel + "." }),
      UI.el("p", { text: n.message })
    ];
    if (session.role === "principal" && n.status === "pending") {
      children.push(UI.el("div", { class: "notice-actions" }, [
        UI.el("button", { type: "button", text: "Approve", "aria-label": "Approve notice: " + n.title, onclick: () => review(n, "approved") }),
        UI.el("button", { type: "button", text: "Reject", "aria-label": "Reject notice: " + n.title, onclick: () => review(n, "rejected") })
      ]));
    }
    return UI.el("article", { class: "notice" }, children);
  }

  function renderNotices() {
    API.getNotices(session).then((notices) => {
      const shown = notices.filter((n) => !statusFilter.value || n.status === statusFilter.value);
      UI.clear(list);
      empty.hidden = shown.length > 0;
      shown.forEach((n) => list.appendChild(noticeCard(n)));
    }).catch((err) => UI.showAlert(listAlert, "error", err.message));
  }

  statusFilter.addEventListener("change", renderNotices);
  renderNotices();
})();
