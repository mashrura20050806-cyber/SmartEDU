// Used by the Admin and Principal dashboards (they can write and modify).
// The Teacher dashboard does not use this file because a teacher can only view.


// WRITE: add a new notice
function addNotice() {
  var title = document.getElementById("newTitle").value;

  if (title == "") {
    alert("Please write a title");
    return;
  }

  var list = document.getElementById("noticeList");

  // put the new notice at the top of the list
  list.innerHTML = "<div class='notice'><p>" + title + "</p>" +
                   "<button onclick='editNotice(this)'>Edit</button></div>" +
                   list.innerHTML;

  document.getElementById("newTitle").value = "";   // clear the box
}


// MODIFY: edit a notice
function editNotice(button) {
  // "button" is the Edit button that was clicked.
  // The notice text is the <p> just before it.
  var text = button.previousElementSibling;

  var newText = prompt("Edit the notice:", text.innerHTML);

  // do nothing if the user pressed Cancel or left it empty
  if (newText != null && newText != "") {
    text.innerHTML = newText;
  }
}