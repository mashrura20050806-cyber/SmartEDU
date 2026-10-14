
const NoticeAPI = {
  async getAll() {
    return JSON.parse(localStorage.getItem("smartedu_notices") || "[]");
  },
  async add(notice) {
    const list = await this.getAll();
    list.unshift({ id: Date.now(), ...notice });
    localStorage.setItem("smartedu_notices", JSON.stringify(list));
  }
};


const PERMISSIONS = {
  "Class Teacher": { write: true },   
  "Assistant":     { write: true },   
  "Student":       { write: false }   
};

const $ = id => document.getElementById(id);
const roleEl = $("role"), audienceEl = $("audience");

function canWrite() { return PERMISSIONS[roleEl.value].write; }

function audienceLabel(n) {
  if (n.audience === "school") return "Entire School";
  if (n.audience === "class") return "Class " + n.targetClass;
  if (n.audience === "section") return "Class " + n.targetClass + " - " + n.targetSection;
  return "Student " + n.targetStudent;
}

function visibleToStudent(n) {
  const c = $("stClass").value.trim().toLowerCase();
  const s = $("stSection").value.trim().toLowerCase();
  const id = $("stId").value.trim().toLowerCase();
  if (n.audience === "school") return true;
  if (n.audience === "class") return (n.targetClass || "").toLowerCase() === c;
  if (n.audience === "section")
    return (n.targetClass || "").toLowerCase() === c &&
           (n.targetSection || "").toLowerCase() === s;
  return (n.targetStudent || "").toLowerCase() === id;
}

function updateAudienceFields() {
  const a = audienceEl.value;
  $("tClass").style.display = (a === "class" || a === "section") ? "block" : "none";
  $("tSection").style.display = a === "section" ? "block" : "none";
  $("tStudent").style.display = a === "student" ? "block" : "none";
}

function resetForm() {
  ["title", "details", "tClass", "tSection", "tStudent"].forEach(id => $(id).value = "");
  audienceEl.value = "school";
  $("error").textContent = "";
  updateAudienceFields();
}

function updateRoleUI() {
  $("studentProfile").style.display = roleEl.value === "Student" ? "block" : "none";
  $("formBox").style.display = canWrite() ? "block" : "none";
  resetForm();
  render();
}

async function render() {
  let notices = await NoticeAPI.getAll();
  if (roleEl.value === "Student") notices = notices.filter(visibleToStudent);

  const listEl = $("noticeList");
  listEl.innerHTML = "";

  if (notices.length === 0) {
    listEl.innerHTML = '<tr><td colspan="5">No notices yet.</td></tr>';
    return;
  }

  notices.forEach(n => {
    const tr = document.createElement("tr");
    [n.title, n.details, audienceLabel(n), n.date, n.postedBy].forEach(text => {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });
    listEl.appendChild(tr);
  });
}

async function submitNotice() {
  if (!canWrite()) return;

  const title = $("title").value.trim();
  const details = $("details").value.trim();
  const audience = audienceEl.value;
  const targetClass = $("tClass").value.trim();
  const targetSection = $("tSection").value.trim();
  const targetStudent = $("tStudent").value.trim();

  if (!title || !details) {
    $("error").textContent = "Please fill in both title and details.";
    return;
  }
  if ((audience === "class" || audience === "section") && !targetClass) {
    $("error").textContent = "Please enter the class.";
    return;
  }
  if (audience === "section" && !targetSection) {
    $("error").textContent = "Please enter the section.";
    return;
  }
  if (audience === "student" && !targetStudent) {
    $("error").textContent = "Please enter the student ID.";
    return;
  }

  await NoticeAPI.add({
    title, details, audience, targetClass, targetSection, targetStudent,
    date: new Date().toLocaleDateString("en-GB"),
    postedBy: roleEl.value
  });

  resetForm();
  render();
}

roleEl.addEventListener("change", updateRoleUI);
audienceEl.addEventListener("change", updateAudienceFields);
$("addBtn").addEventListener("click", submitNotice);
["stClass", "stSection", "stId"].forEach(id => $(id).addEventListener("input", render));

updateRoleUI();
