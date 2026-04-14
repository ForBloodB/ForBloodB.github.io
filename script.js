const bootDelayMs = 950;
const clockNode = document.querySelector("[data-clock]");

function updateClock() {
  if (!clockNode) {
    return;
  }

  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  clockNode.textContent = timeFormatter.format(now);
}

window.addEventListener("load", () => {
  updateClock();
  window.setInterval(updateClock, 30000);

  window.setTimeout(() => {
    document.body.classList.remove("is-booting");
  }, bootDelayMs);
});
