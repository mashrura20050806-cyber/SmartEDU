
(function () {
  "use strict";

  function el(tag, props, children) {
    const node = document.createElement(tag);
    Object.keys(props || {}).forEach((key) => {
      const value = props[key];
      if (key === "class") { node.className = value; }
      else if (key === "text") { node.textContent = value; }
      else if (key.indexOf("on") === 0 && typeof value === "function") { node.addEventListener(key.slice(2), value); }
      else { node.setAttribute(key, value); }
    });
    (children || []).forEach((child) => {
      if (child === null || child === undefined) { return; }
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) { node.removeChild(node.firstChild); }
  }

  function setFieldError(input, message) {
    const holder = document.getElementById(input.id + "-error");
    if (holder) { holder.textContent = message || ""; }
    if (message) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", input.id + "-error");
    } else {
      input.removeAttribute("aria-invalid");
    }
  }

  function showAlert(box, kind, message) {
    box.className = kind === "error" ? "alert alert-error" : "alert";
    box.textContent = message;
    box.hidden = false;
  }

  function hideAlert(box) {
    box.hidden = true;
    box.textContent = "";
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch (e) {
      return iso;
    }
  }

  window.SmartEduUI = { el: el, clear: clear, setFieldError: setFieldError, showAlert: showAlert, hideAlert: hideAlert, formatDate: formatDate };
})();
