const release = new Date("2026-08-28T00:00:00-04:00").getTime();
const ids = ["days", "hours", "minutes", "seconds"];

function updateCountdown() {
  const distance = Math.max(0, release - Date.now());
  const values = [
    Math.floor(distance / 86400000),
    Math.floor((distance % 86400000) / 3600000),
    Math.floor((distance % 3600000) / 60000),
    Math.floor((distance % 60000) / 1000)
  ];
  ids.forEach((id, index) => {
    const node = document.getElementById(id);
    if (node) node.textContent = String(values[index]).padStart(2, "0");
  });
}

updateCountdown();
setInterval(updateCountdown, 1000);
