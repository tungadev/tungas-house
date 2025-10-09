document.addEventListener("DOMContentLoaded", () => {
  const boxOne = document.getElementById("box-one");

  fetch("https://fantastic-manatee-a1d0c8.netlify.app/.netlify/functions/api/onlineStatus")
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      console.log("Response:", data);

      // reset classes
      boxOne.className = "status-box";

      if (data.status === "online") {
        boxOne.textContent = "Tunga is online 🟢";
        boxOne.classList.add("status-online");
      } else {
        boxOne.textContent = "Tunga is offline 🔴";
        boxOne.classList.add("status-offline");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      boxOne.textContent = "Error fetching status ⚠️";
      boxOne.className = "status-box status-error";
    });
});
