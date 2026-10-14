
function addNotice() {
  var title = document.getElementById("newTitle").value;

  if (title == "") {
    alert("Please write a title");
    return;
  }

  var list = document.getElementById("noticeList");

  
  list.innerHTML = "<div class='notice'><p>" + title + "</p>" +
                   "<button onclick='editNotice(this)'>Edit</button></div>" +
                   list.innerHTML;

  document.getElementById("newTitle").value = "";   // clear the box
}


function editNotice(button) {
  var text = button.previousElementSibling;

  var newText = prompt("Edit the notice:", text.innerHTML);

  if (newText != null && newText != "") {
    text.innerHTML = newText;
  }
}
