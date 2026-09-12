import { playerState } from './musicPlayer.js';

const GITHUB_URL = 'https://github.com/uxce';

const NAV_ITEMS = [
  { id: 'home',     label: 'HOME',     jp: 'ホーム' },
  { id: 'about',    label: 'ABOUT',    jp: 'について' },
  { id: 'projects', label: 'PROJECTS', jp: '私の作品' },
  { id: 'resume',   label: 'RESUME',   jp: '履歴書' },
];

export function createSidebar({ musicPlayer, onNav }) {
  const root = document.getElementById('sidebar');
  if (!root) return { update: () => {}, setActiveTab: () => {} };

  const navEl = document.getElementById('sbNav');
  const titleEl = document.getElementById('sbTrackTitle');
  const artistEl = document.getElementById('sbTrackArtist');
  const progressEl = document.getElementById('sbProgressFill');
  const btnPlay = document.getElementById('sbPlay');
  const btnPrev = document.getElementById('sbPrev');
  const btnNext = document.getElementById('sbNext');
  const githubLink = document.querySelector('.hud-link');

  let activeTab = 'home';
  const navRows = NAV_ITEMS.map((item) => {
    const row = document.createElement('a');
    row.href = '#';
    row.className = 'sb-nav-item';
    row.dataset.tab = item.id;
    row.innerHTML = `<span class="sb-nav-text">${item.label}<span class="sb-jp">${item.jp}</span></span>`;
    row.addEventListener('click', (e) => {
      e.preventDefault();

      if (item.id === 'resume') { onNav(item.id); return; }
      setActiveTab(item.id);
      onNav(item.id);
    });
    navEl.appendChild(row);
    return row;
  });

  function setActiveTab(id) {
    activeTab = id;
    navRows.forEach((row) => row.classList.toggle('active', row.dataset.tab === id));
  }
  setActiveTab('home');

  if (githubLink) githubLink.href = GITHUB_URL;

  if (btnPlay) btnPlay.addEventListener('click', () => musicPlayer.togglePlay());
  if (btnPrev) btnPrev.addEventListener('click', () => musicPlayer.prevTrack());
  if (btnNext) btnNext.addEventListener('click', () => musicPlayer.nextTrack());

  function update() {
    if (titleEl) titleEl.textContent = playerState.title;
    if (artistEl) artistEl.textContent = playerState.artist;
    if (progressEl) progressEl.style.width = (playerState.progress * 100) + '%';
    if (btnPlay) btnPlay.textContent = playerState.playing ? '⏸' : '▶';
  }

  return { update, setActiveTab };
}