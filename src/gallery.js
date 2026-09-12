export function createGallery() {
  const extGrid = document.querySelector('.ext-gallery');
  const osGrid = document.querySelector('.os-gallery');
  const extCount = document.getElementById('extPhotoCount');
  const osCount = document.getElementById('osPhotoCount');

  const lightbox = document.getElementById('photoLightbox');
  const lbImg = document.getElementById('plImg');
  const lbCaption = document.getElementById('plCaption');
  const lbClose = document.getElementById('plClose');
  const lbPrev = document.getElementById('plPrev');
  const lbNext = document.getElementById('plNext');

  if ((!extGrid && !osGrid) || !lightbox) return { openImage: () => {} };

  let photos = [];
  let currentIndex = 0;

  function showPhoto(i) {
    if (!photos.length) return;
    currentIndex = ((i % photos.length) + photos.length) % photos.length;
    const p = photos[currentIndex];
    lbImg.src = p.src;
    lbImg.alt = p.label || '';
    if (lbCaption) lbCaption.textContent = [p.label, p.tag].filter(Boolean).join(' — ');
    if (lbPrev) lbPrev.style.display = '';
    if (lbNext) lbNext.style.display = '';
    lightbox.classList.add('visible');
  }

  function openImage(src, caption) {
    if (lbPrev) lbPrev.style.display = 'none';
    if (lbNext) lbNext.style.display = 'none';
    lbImg.src = src;
    lbImg.alt = caption || '';
    if (lbCaption) lbCaption.textContent = caption || '';
    lightbox.classList.add('visible');
  }

  function closeLightbox() {
    lightbox.classList.remove('visible');
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', () => showPhoto(currentIndex - 1));
  if (lbNext) lbNext.addEventListener('click', () => showPhoto(currentIndex + 1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  window.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('visible')) return;
    if (e.key === 'ArrowLeft') showPhoto(currentIndex - 1);
    else if (e.key === 'ArrowRight') showPhoto(currentIndex + 1);
  });

  function buildGrid(gridEl, tileClass) {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    if (!photos.length) {
      const empty = document.createElement('div');
      empty.className = tileClass + '-empty';
      empty.textContent = 'No photos yet — check back soon.';
      gridEl.appendChild(empty);
      return;
    }
    photos.forEach((p, i) => {
      const tile = document.createElement('div');
      tile.className = tileClass;
      const img = document.createElement('img');
      img.src = p.src;
      img.alt = p.label || `Photo ${i + 1}`;
      img.loading = 'lazy';
      const tag = document.createElement('span');
      tag.className = tileClass + '-tag';
      tag.textContent = p.tag || '';
      tile.appendChild(img);
      tile.appendChild(tag);
      tile.addEventListener('click', () => showPhoto(i));
      gridEl.appendChild(tile);
    });
  }

  fetch(`${import.meta.env.BASE_URL}photos.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`photos.json ${res.status}`);
      return res.json();
    })
    .then((data) => {
      photos = Array.isArray(data) ? data : [];
      buildGrid(extGrid, 'ext-photo');
      buildGrid(osGrid, 'os-photo');
      const countText = `${photos.length} PHOTO${photos.length === 1 ? '' : 'S'}`;
      if (extCount) extCount.textContent = countText;
      if (osCount) osCount.textContent = countText;
    })
    .catch((err) => {
      console.error('[gallery] failed to load photos.json:', err);

      photos = [];
      buildGrid(extGrid, 'ext-photo');
      buildGrid(osGrid, 'os-photo');
      const countText = '0 PHOTOS';
      if (extCount) extCount.textContent = countText;
      if (osCount) osCount.textContent = countText;
    });

  return { openImage };
}