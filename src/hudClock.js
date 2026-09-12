export function createHudClock() {
  function update() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const fullStr = `${timeStr} ${dateStr}`;
    const introDate = document.getElementById('introDate');
    const hudDate = document.getElementById('hudDate');
    if (introDate) introDate.textContent = fullStr;
    if (hudDate) hudDate.textContent = fullStr;
  }
  update();
  setInterval(update, 60000);
}