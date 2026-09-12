const playlist = [
  { title: 'Hazardous Environments',    artist: 'Valve',    src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/music/Hazardous%20Environments.mp3',    duration: '1:53' },
  { title: 'Cartz',    artist: 'gum.mp3',    src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/music/cartz.mp3',    duration: '2:50' },
  { title: 'just drifting',    artist: 'Cult Member',    src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/music/just%20drifting.mp3',    duration: '2:56' },
  { title: 'Till Dawn', artist: 'Janaway',    src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/music/TillDawn.mp3', duration: '5:22' },
  { title: 'I Could Take U There', artist: 'DazeGxd', src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/music/iCouldTakeUthere.mp3', duration: '3:21' },
  { title: 'Get Lit',  artist: 'ANDRS',  src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/music/getLit.mp3',  duration: '2:23' },
  { title: 'BACKBONE', artist: 'NOTION', src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/music/NOTION%20-%20BACKBONE.mp3', duration: '3:07' },
];

export const playerState = {
  title: 'SELECT A TRACK',
  artist: '— — —',
  progress: 0,
  playing: false,
};

const DEFAULT_VOLUME = 0.4;
const FADE_IN_MS = 2500;

export function initMusicPlayer() {
  const btnPlay = document.getElementById('mpPlay');
  if (!btnPlay) return { togglePlay: () => {}, nextTrack: () => {}, prevTrack: () => {}, startWithFadeIn: () => {} };

  const audio = new Audio();
  audio.volume = DEFAULT_VOLUME;

  let curIdx = 0;
  let looping = false;

  const npDot   = document.getElementById('npDot');
  const tTitle  = document.getElementById('mpTitle');
  const tArtist = document.getElementById('mpArtist');
  const pFill   = document.getElementById('mpProgressFill');
  const pTrack  = document.getElementById('mpProgressTrack');
  const tElap   = document.getElementById('mpElapsed');
  const tDur    = document.getElementById('mpDuration');
  const volSldr = document.getElementById('mpVolume');

  const sbVolSldr = document.getElementById('sbVolume');
  const vizEl   = document.getElementById('mpVisualizer');
  const listEl  = document.getElementById('mpTrackList');
  const btnPrev = document.getElementById('mpPrev');
  const btnNext = document.getElementById('mpNext');
  const btnLoop = document.getElementById('mpLoop');

  const BAR_COUNT = 28;
  const bars = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    const b = document.createElement('div');
    b.className = 'mp-vbar';
    vizEl.appendChild(b);
    bars.push(b);
  }
  let vizPlaying = false;
  function animViz() {
    bars.forEach((b, i) => {
      const base = vizPlaying ? 8 : 3;
      const amp  = vizPlaying ? Math.random() * 26 : 0;
      const h = base + amp * Math.abs(Math.sin(Date.now() / 220 + i * 0.6));
      b.style.height = Math.max(3, h) + 'px';
      b.style.background = vizPlaying
        ? (h > 24 ? '#F5A623' : h > 14 ? '#E8850A' : '#3D2000')
        : '#1A0E00';
    });
    requestAnimationFrame(animViz);
  }
  animViz();

  function fmt(s) {
    if (isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function buildList() {
    listEl.innerHTML = '';
    playlist.forEach((t, i) => {
      const row = document.createElement('div');
      row.className = 'mp-track-item' + (i === curIdx ? ' active' : '');
      row.innerHTML = `
        <span class="mp-track-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="mp-track-name">${t.title} — ${t.artist}</span>
        <span class="mp-track-dur">${t.duration}</span>`;
      row.addEventListener('click', () => loadTrack(i, true));
      listEl.appendChild(row);
    });
  }

  function setPlaying(p) {
    vizPlaying = p;
    btnPlay.textContent = p ? '⏸' : '▶';
    if (npDot) npDot.classList.toggle('paused', !p);
    playerState.playing = p;
  }

  function loadTrack(idx, autoplay) {
    curIdx = ((idx % playlist.length) + playlist.length) % playlist.length;
    const t = playlist[curIdx];
    audio.src = t.src;
    tTitle.textContent = t.title;
    tArtist.textContent = t.artist;
    tDur.textContent = t.duration;
    tElap.textContent = '0:00';
    pFill.style.width = '0%';
    playerState.title = t.title;
    playerState.artist = t.artist;
    playerState.progress = 0;
    buildList();
    if (autoplay) {
      audio.play().catch(() => {});
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  }

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const frac = audio.currentTime / audio.duration;
    pFill.style.width = (frac * 100) + '%';
    tElap.textContent = fmt(audio.currentTime);
    tDur.textContent = fmt(audio.duration);
    playerState.progress = frac;
  });
  audio.addEventListener('ended', () => {
    if (looping) audio.play();
    else loadTrack(curIdx + 1, true);
  });

  function togglePlay() {
    if (audio.paused) {
      if (!audio.src) loadTrack(0, true);
      else { audio.play().catch(() => {}); setPlaying(true); }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function nextTrack() { loadTrack(curIdx + 1, !audio.paused || !audio.src); }
  function prevTrack() { loadTrack(curIdx - 1, !audio.paused || !audio.src); }

  btnPlay.addEventListener('click', togglePlay);
  btnPrev.addEventListener('click', prevTrack);
  btnNext.addEventListener('click', nextTrack);
  btnLoop.addEventListener('click', () => {
    looping = !looping;
    btnLoop.classList.toggle('active', looping);
  });

  function setVolume(v) {
    audio.volume = v;
    volSldr.value = v;
    if (sbVolSldr) sbVolSldr.value = v;
  }
  volSldr.addEventListener('input', () => setVolume(parseFloat(volSldr.value)));
  if (sbVolSldr) sbVolSldr.addEventListener('input', () => setVolume(parseFloat(sbVolSldr.value)));

  pTrack.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const r = pTrack.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  });

  setVolume(DEFAULT_VOLUME);

  function startWithFadeIn() {
    if (!audio.paused) return;
    if (!audio.src) loadTrack(0, false);
    audio.volume = 0;
    audio.play().then(() => setPlaying(true)).catch(() => {});

    const rampStart = performance.now();
    function rampStep() {
      const t = Math.min((performance.now() - rampStart) / FADE_IN_MS, 1);
      const v = DEFAULT_VOLUME * t;
      audio.volume = v;
      volSldr.value = v;
      if (sbVolSldr) sbVolSldr.value = v;
      if (t < 1) requestAnimationFrame(rampStep);
    }
    requestAnimationFrame(rampStep);
  }

  buildList();

  return { togglePlay, nextTrack, prevTrack, startWithFadeIn };
}