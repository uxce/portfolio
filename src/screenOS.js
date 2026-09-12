import { interiorCamPos, interiorCamTarget, screenCamPos, screenCamTarget } from './positions.js';
import { HERO_SHOTS } from './heroLoop.js';

const PROJECTS = [
  {
    id: 'pentest',
    monogram: 'PT',
    image: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/projects/inbiome/frontpage_cleaned.png',
    name: 'Penetration Test — inBiome',
    status: 'DISCLOSED',
    date: '2026',
    tags: ['RED TEAM', 'CYBER SEC', 'HUNTING'],
    summary: 'Black-box pentest on a medical diagnostics company — found two endpoints leaking client data.',
    body: [
      'inBiome is a Dutch medical research company building a diagnostic platform called Antoni, which analyzes bacterial infections from patient samples within a few hours. Their platform is made up of a Flutter-based web app, two FastAPI backends, and a WordPress site.',
      'To start mapping the attack surface, I ran the Antoni web app through Burp Suite while browsing it normally, then pulled the compiled Flutter JavaScript bundle it was serving from antoni-research.inbiome.com and stepped through the deobfuscated main.dart.js in Chrome DevTools.',
      { type: 'img', src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/projects/inbiome/burp2_cleaned.png', caption: 'Burp\u2019s proxy history while browsing the app — traffic split across two separate backend hosts, lf-research-api and fa-research-api.' },
      'Digging through the deobfuscated bundle turned up a list of internal API endpoints that weren\u2019t publicly documented. One caught my attention right away: GET /v1/lab_flow_web/organizations. I sent an unauthenticated request to it, and to the equivalent endpoint on the other backend.',
      { type: 'code', lines: [
        'curl -s https://lf-research-api.inbiome.com/v1/lab_flow_web/organizations',
        'curl -s https://fa-research-api.inbiome.com/v1/users/organizations',
      ] },
      { type: 'img', src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/projects/inbiome/burp_cleaned.png', caption: 'The response — a clean 200 OK with a full JSON body, no token required.' },
      'Both endpoints returned full JSON responses with no authentication at all, exposing a list of real client organization names — actual hospitals and research institutions. That\u2019s exactly the kind of client relationship a medical device company would want kept confidential.',
      'As a sanity check, I also tried the login flow itself — first through the browser with a guessable admin/admin combo, then again via Burp Repeater with a random username and password. Both came back 401, which made the contrast clear: the login endpoint was enforcing auth properly, the organizations endpoints just weren\u2019t checking for a token at all.',
      { type: 'img', src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/projects/inbiome/burp4_cleaned.png', caption: 'Trying admin/admin against the live login form — rejected, as expected.' },
      { type: 'img', src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/projects/inbiome/burp3_cleaned.png', caption: 'Same test through Repeater with random credentials — also a clean 401.' },
      'The root cause turned out to be a missing authentication check on two endpoints the API\u2019s own OpenAPI spec had explicitly marked as protected. The docs said a valid bearer token was required for every normal endpoint interaction — the server just never enforced it on these two.',
      { type: 'img', src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/projects/inbiome/burp5_cleaned.png', caption: 'The Labflow API\u2019s own docs, spelling out that a bearer token is required for normal endpoint interactions.' },
      'After I disclosed the finding, inBiome acknowledged it and patched both endpoints within the same reporting cycle. Retesting confirmed they now correctly return 401 for unauthenticated requests.',
    ],
    link: { label: '⬡ VIEW SITE →', url: 'https://inbiome.com/' },
  },
  {
    id: 'blueteam',
    monogram: 'BT',
    image: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/projects/hpcc3/hpcc3group.jpg',
    name: 'Hack@UCF Blue Team — Horse Plinko',
    status: '4TH / 55',
    date: 'OCT 2025',
    tags: ['BLUE TEAM', 'CCDC'],
    summary: 'Defended two Windows Server VMs in a 55-team live-attack competition — placed 4th.',
    body: [
      'A 55-team live-attack competition: defend two Windows Server VMs, FTP and RDP focused, against real red-team pressure for the length of the event.',
      'Work centered on system hardening, account audits, and service monitoring — closing off the obvious footholds early, then watching logs for anything that slipped through.',
      'Ran incident response against live simulated attacks while coordinating with teammates to keep critical services online, finishing 4th out of 55 teams.',
    ],
    link: { label: '⬡ HPCC.ORG →', url: 'https://plinko.horse/' },
  },
  {
    id: 'discord',
    monogram: 'DC',
    image: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/projects/discMessage/discord.png',
    name: 'Discord Message Deleter',
    status: 'SHIPPED',
    date: '2026',
    tags: ['PYTHON', 'DISCORD.PY'],
    summary: 'Desktop app for bulk-deleting Discord messages across servers and DMs.',
    body: [
      'Discord doesn\u2019t give you a built-in way to bulk-delete your own message history — clearing out an old server or a long DM thread means scrolling and deleting one message at a time. After doing that by hand one too many times, I built a small desktop app to handle it instead.',
      'Under the hood it\u2019s built on discord.py, walking a channel\u2019s message history and queuing up anything that matches your filters (author, channel, date range) for deletion. That queue runs asynchronously in the background so the UI never locks up mid-cleanup, even on a channel with years of history to page through.',
      'Discord\u2019s API rate-limits delete calls aggressively, especially in bulk, so the app throttles its own request rate and backs off automatically when it gets close to a limit rather than hammering the API and getting the account temporarily blocked.',
      { type: 'img', src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/projects/discMessage/example1.png', caption: 'Filtering down to a specific channel and date range before running a cleanup.' },
      'Every deletion is verified rather than assumed — the app confirms each message actually came back as removed before checking it off, and a live progress view shows how many messages have been found, queued, and confirmed deleted so a long-running cleanup is something you can watch happen instead of just hoping it worked.',
      { type: 'img', src: 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/projects/discMessage/example2.png', caption: 'Progress tracking during a run — messages found, queued, and confirmed deleted in real time.' },
      'It\u2019s a small tool, but it\u2019s the kind of thing I end up reaching for constantly — cleaning up old servers, clearing out DMs, or just tidying up message history without babysitting Discord\u2019s UI for an hour.',
    ],
    link: { label: '⬡ VIEW ON GITHUB →', url: 'https://github.com/uxce/DiscordMessageHandler' },
  },
];

export function createScreenOS({ cameraRig, heroLoop, kickFilterRepaint, openImage }) {
  const screenOverlay = document.getElementById('screenOverlay');
  const osPanel = document.getElementById('osPanel');
  const osContent = document.getElementById('osContent');
  const osNav = document.getElementById('osNav');
  const osClose = document.getElementById('osClose');

  let bootToken = 0;

  cameraRig.onTransitionStart(() => {
    bootToken++;
  });

  const osProjectsList = document.getElementById('osProjectsList');
  const osProjectGrid = document.getElementById('osProjectGrid');
  const osProjectArticle = document.getElementById('osProjectArticle');
  const osArticleBack = document.getElementById('osArticleBack');
  const osArticleImg = document.getElementById('osArticleImg');
  const osArticleHeroFallback = document.getElementById('osArticleHeroFallback');
  const osArticleTitle = document.getElementById('osArticleTitle');
  const osArticleStatus = document.getElementById('osArticleStatus');
  const osArticleDate = document.getElementById('osArticleDate');
  const osArticleTags = document.getElementById('osArticleTags');
  const osArticleBody = document.getElementById('osArticleBody');
  const osArticleLink = document.getElementById('osArticleLink');

  function buildProjectGrid() {
    if (!osProjectGrid) return;
    osProjectGrid.innerHTML = '';
    PROJECTS.forEach((p, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'os-project-card';
      card.dataset.project = p.id;
      card.innerHTML = `
        <span class="os-project-card-img">
          <span class="os-project-card-fallback">${p.monogram}</span>
          <img src="${p.image}" alt="" loading="lazy" onerror="this.style.display='none'">
        </span>
        <span class="os-project-card-body">
          <span class="os-project-card-top">
            <span class="os-project-card-status">${p.status}</span>
          </span>
          <span class="os-project-card-title">${p.name}</span>
          <span class="os-project-card-summary">${p.summary}</span>
        </span>`;
      card.addEventListener('click', () => openProjectArticle(p.id));
      osProjectGrid.appendChild(card);
    });
  }
  buildProjectGrid();

  function renderBodyBlock(block) {
    if (typeof block === 'string') {
      return `<p>${block}</p>`;
    }
    if (block.type === 'code') {
      return `<pre class="os-article-code"><code>${block.lines.join('\n')}</code></pre>`;
    }
    if (block.type === 'img') {
      return `<figure class="os-article-figure">
        <img src="${block.src}" alt="${block.caption || ''}" loading="lazy" onerror="this.closest('figure').style.display='none'">
        ${block.caption ? `<figcaption>${block.caption}</figcaption>` : ''}
      </figure>`;
    }
    return '';
  }

  function openProjectArticle(id) {
    const p = PROJECTS.find((proj) => proj.id === id);
    if (!p) return;
    osArticleImg.src = p.image;
    osArticleImg.style.display = '';
    osArticleHeroFallback.textContent = p.monogram;
    osArticleTitle.textContent = p.name;
    osArticleStatus.textContent = p.status;
    osArticleDate.textContent = p.date;
    osArticleTags.innerHTML = p.tags.map((t) => `<span class="os-article-tag">${t}</span>`).join('');
    osArticleBody.innerHTML = p.body.map(renderBodyBlock).join('');
    if (p.link) {
      osArticleLink.href = p.link.url;
      osArticleLink.textContent = p.link.label;
      osArticleLink.style.display = '';
    } else {
      osArticleLink.style.display = 'none';
    }
    osProjectsList.classList.add('hidden');
    osProjectArticle.classList.add('active');
    osContent.scrollTop = 0;
    replayEntrance();
  }

  function closeProjectArticle() {
    osProjectArticle.classList.remove('active');
    osProjectsList.classList.remove('hidden');
    osContent.scrollTop = 0;
  }

  if (osArticleBack) osArticleBack.addEventListener('click', closeProjectArticle);

  if (osArticleBody && openImage) {
    osArticleBody.addEventListener('click', (e) => {
      const img = e.target.closest('.os-article-figure img');
      if (!img) return;
      const figcaption = img.closest('.os-article-figure').querySelector('figcaption');
      openImage(img.src, figcaption ? figcaption.textContent : img.alt);
    });
  }

  function replayEntrance() {

    const activePage = osContent.querySelector('.os-page.active');
    if (activePage) {
      activePage.classList.remove('entering');
      void activePage.offsetWidth;
      activePage.classList.add('entering');
    }
    osNav.classList.remove('sweeping');
    void osNav.offsetWidth;
    osNav.classList.add('sweeping');
  }

  function revealScreenPanel() {
    const myToken = bootToken;
    screenOverlay.classList.add('visible');
    osPanel.classList.add('visible');
    requestAnimationFrame(() => {
      if (myToken !== bootToken) return;
      replayEntrance();
    });
  }

  function closeScreen() {
    screenOverlay.classList.remove('visible');
    osPanel.classList.remove('visible', 'entering');
    osNav.classList.remove('sweeping');
    closeProjectArticle();
    cameraRig.beginTransition(interiorCamPos, interiorCamTarget, 'interior');
  }

  osClose.addEventListener('click', () => {
    if (cameraRig.getState() === 'screen') closeScreen();
  });

  function activateOsTab(tabId) {
    document.querySelectorAll('.os-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    document.querySelectorAll('.os-page').forEach(p => p.classList.toggle('active', p.dataset.panel === tabId));

    if (tabId !== 'projects') closeProjectArticle();

    if (cameraRig.getState() === 'screen') {
      replayEntrance();

      kickFilterRepaint();
    }
  }

  function goToScreenTab(tabId) {
    const state = cameraRig.getState();
    if (state === 'transitioning') return;
    activateOsTab(tabId);
    if (state === 'screen') return;
    cameraRig.beginTransition(screenCamPos, screenCamTarget, 'screen');
  }

  function goHome() {
    const state = cameraRig.getState();
    if (state === 'transitioning') return;
    activateOsTab('about');
    if (state === 'screen') { closeScreen(); return; }

    if (state === 'interior') { cameraRig.beginTransition(HERO_SHOTS[0].startPos, HERO_SHOTS[0].startTarget, 'exterior'); return; }
    if (state === 'freelook') { cameraRig.beginTransition(HERO_SHOTS[0].startPos, HERO_SHOTS[0].startTarget, 'exterior'); return; }
    heroLoop.start();
  }

  document.querySelectorAll('.os-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      activateOsTab(tab.dataset.tab);
    });
  });

  return { goToScreenTab, goHome, closeScreen, revealScreenPanel };
}