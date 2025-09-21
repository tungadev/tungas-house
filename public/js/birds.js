document.getElementById("birds-gif").onclick = function () {
  pleaseHelpMe();
};

function pleaseHelpMe() {
  let clickCount = parseInt(localStorage.getItem("birdClicks")) || 0;
  clickCount++;
  localStorage.setItem("birdClicks", clickCount);
  if (clickCount > 2) {
    // show it exactly after 3 clicks
    document.getElementById("delete-link").style.display = "block";
  }
}
