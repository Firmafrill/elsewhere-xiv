function setupHeaderHeight(){
  const header = document.querySelector('.site-header');
  if (!header) return;

  function setHeaderVar(){
    const h = header.offsetHeight;
    document.documentElement.style.setProperty('--header-h', h + 'px');
  }

  setHeaderVar();
  window.addEventListener('resize', setHeaderVar);
  setTimeout(setHeaderVar, 100);
}

const GALLERY = [
  'assets/images/gallery/image17.jpg',
  'assets/images/gallery/image16.jpg',
  'assets/images/gallery/image18.jpg',
  'assets/images/gallery/image19.jpg'
];

function initGallery(){
  const galleryEl = document.getElementById('gallery');

  if (!galleryEl || !GALLERY.length) return;

  let i = 0;

  galleryEl.style.backgroundImage = `url('${GALLERY[0]}')`;
  galleryEl.style.opacity = '1';
  i = 1;

  function show(){
    // Fade
    galleryEl.style.opacity = '0';

    setTimeout(() => {
      const src = GALLERY[i % GALLERY.length];
      galleryEl.style.backgroundImage = `url('${src}')`;
      i++;
      galleryEl.style.opacity = '1';
    }, 700);
  }

  setInterval(show, 6000);
}

async function loadHeader(){
  const headerEl = document.getElementById('site-header');

  if (!headerEl) return;

  try {
    const response = await fetch('components/header.html');

    if (!response.ok) {
      throw new Error(`Failed to load header: ${response.status}`);
    }

    headerEl.outerHTML = await response.text();

    setupHeaderHeight();

  } catch (error) {
    console.error('Failed to load shared header:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
  initGallery();
});