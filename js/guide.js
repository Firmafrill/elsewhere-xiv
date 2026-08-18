document.addEventListener('DOMContentLoaded', initGuide);

async function initGuide() {
  const guideId = getGuideIdFromUrl();

  const titleEl = document.getElementById('guideTitle');
  const metaEl = document.getElementById('guideMeta');
  const contentEl = document.getElementById('guideContent');
  const tocEmptyEl = document.getElementById('guideTocEmpty');

  if (!titleEl || !contentEl) {
    return;
  }

  if (!guideId) {
    showGuideError(
      titleEl,
      contentEl,
      tocEmptyEl,
      'No guide selected',
      'This page needs a guide id in the address.'
    );
    return;
  }

  try {
    const item = await getGuideMetadata(guideId);

    if (!item) {
      showGuideError(
        titleEl,
        contentEl,
        tocEmptyEl,
        'Guide not found',
        'No guide with that id was found in the archive.'
      );
      document.title = 'Elsewhere XIV - Guide not found';
      return;
    }

    document.title = `Elsewhere XIV: ${item.title || 'Guide'}`;

    titleEl.textContent = item.title || 'Untitled guide';

    setGuideMeta(metaEl, item);
    buildDocButtons(item);


    await loadMarkdownForGuide(guideId, contentEl, tocEmptyEl);

  } catch (error) {
    console.error(error);

    showGuideError(
      titleEl,
      contentEl,
      tocEmptyEl,
      'Error loading guide',
      'There was a problem loading guide data.'
    );

    document.title = 'Elsewhere XIV - Error';
  }
}


function getGuideIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}


async function getGuideMetadata(guideId) {
  const response = await fetch('../data/guides.json', {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to load guides.json');
  }

  const data = await response.json();
  const items = Array.isArray(data.items) ? data.items : [];

  return items.find(guide => guide.id === guideId) || null;
}


function setGuideMeta(metaEl, item) {
  if (!metaEl) {
    return;
  }

  const metaBits = [];

  if (item.creator) {
    metaBits.push(`by ${item.creator}`);
  }

  if (Array.isArray(item.versions) && item.versions.length) {
    metaBits.push(item.versions.join(', '));
  }

  if (Array.isArray(item.programs) && item.programs.length) {
    metaBits.push(item.programs.join(', '));
  }

  metaEl.textContent = metaBits.join(' • ');
}


function buildDocButtons(item) {
  const container = document.getElementById('guideDocButtons');

  if (!container) {
    return;
  }

  const extras = Array.isArray(item.extras) ? item.extras : [];

  container.innerHTML = '';

  if (!extras.length) {
    container.style.display = 'none';
    return;
  }

  container.style.display = '';

  extras.forEach(extra => {
    if (!extra?.href || !extra?.label) {
      return;
    }

    const link = document.createElement('a');

    link.className = 'guide-btn';
    link.href = extra.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = extra.label;

    container.appendChild(link);
  });
}

async function loadMarkdownForGuide(guideId, contentEl, tocEmptyEl) {
  const markdownPath = `../content/${guideId}/${guideId}.md`;

  try {
    const response = await fetch(markdownPath, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Markdown file not found: ${markdownPath}`);
    }

    const markdown = await response.text();

    if (typeof marked === 'undefined') {
      throw new Error('Marked Markdown renderer is not loaded');
    }

    contentEl.innerHTML = marked.parse(markdown);

    normalizeGuideContent(contentEl);

    buildOutlineFromContent(contentEl, tocEmptyEl);

  } catch (error) {
    console.error(error);

    contentEl.innerHTML =
      '<p class="guide-error">No local Markdown archive was found for this guide.</p>';

    if (tocEmptyEl) {
      tocEmptyEl.textContent = 'No sections available.';
    }
  }
}


function normalizeGuideContent(contentEl) {
  const images = contentEl.querySelectorAll('img');

  images.forEach(image => {
    image.style.maxWidth = '100%';
    image.style.height = 'auto';
  });

  const wrappers = contentEl.querySelectorAll('.c37, .doc-content');

  wrappers.forEach(wrapper => {
    wrapper.style.backgroundColor = 'transparent';
    wrapper.style.maxWidth = '100%';
    wrapper.style.padding = '0';
    wrapper.style.margin = '0';
  });
}


function buildOutlineFromContent(contentEl, tocEmptyEl) {
  const headings = [];
  const usedIds = new Set();

  contentEl.querySelectorAll('h2, h3').forEach(heading => {
    const level = heading.tagName === 'H2' ? 2 : 3;
    const text = heading.textContent.trim() || 'Section';

    const baseId = heading.id || slugify(text) || 'section';

    let id = baseId;
    let counter = 2;

    while (usedIds.has(id)) {
      id = `${baseId}-${counter}`;
      counter++;
    }

    usedIds.add(id);
    heading.id = id;

    headings.push({
      level,
      id,
      text
    });
  });

  buildOutline(headings, tocEmptyEl);
}


function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}


function buildOutline(headings, tocEmptyEl) {
  const tocEl = document.getElementById('guideToc');

  if (!tocEl) {
    return;
  }

  tocEl.innerHTML = '';

  if (!headings.length) {
    if (tocEmptyEl) {
      tocEmptyEl.textContent = 'No sections detected in this document.';
    }

    return;
  }

  if (tocEmptyEl) {
    tocEmptyEl.textContent = '';
  }

  headings.forEach(heading => {
    const li = document.createElement('li');
    const link = document.createElement('a');

    link.href = `#${heading.id}`;
    link.textContent = heading.text;

    if (heading.level === 3) {
      li.classList.add('guide-toc-sub');
    }

    li.appendChild(link);
    tocEl.appendChild(li);
  });
}

function showGuideError(titleEl, contentEl, tocEmptyEl, title, message) {
  titleEl.textContent = title;

  contentEl.innerHTML =
    `<p class="guide-error">${message}</p>`;

  if (tocEmptyEl) {
    tocEmptyEl.textContent = 'No sections available.';
  }
}
