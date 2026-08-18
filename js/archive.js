let DATA = {
  items: [],
  tags: [],
  softwareList: []
};

const TOP_CATEGORIES = [
  'Compendiums',
  'Face & Head',
  'Makeup & Skin',
  'Hair',
  'Gear'
];



const grid           = document.getElementById('grid');

const categoryRow    = document.getElementById('categoryRow');
const subRow         = document.getElementById('subRow');
const searchInput    = document.getElementById('searchInput');
const sortSelect     = document.getElementById('sortSelect');
const clearAllBtn    = document.getElementById('clearAll');

const advDialog       = document.getElementById('advDialog');
const advLink         = document.getElementById('advancedLink');
const advClose        = document.getElementById('advClose');
const advForm         = document.getElementById('advForm');
const advCreator      = document.getElementById('advCreator');
const advType         = document.getElementById('advType');
const ver6            = document.getElementById('ver6');
const ver7            = document.getElementById('ver7');
const advReset        = document.getElementById('advReset');
const advSoftwareBody = document.getElementById('advSoftwareBody');
const advTagsBody     = document.getElementById('advTagsBody');

const viewer      = document.getElementById('viewer');
const viewerFrame = document.getElementById('viewerFrame');
const viewerTitle = document.getElementById('viewerTitle');



let activeCategory = null;
const subActive    = new Set();

let searchTerm = '';

const advanced = {
  creator:  '',
  type:     '',
  versions: new Set(),
  software: new Set(),
  tags:     new Set()
};

let clearBound = false;


function debounce(fn, delay){
  let t;
  return function(...args){
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

function makeButton(label, on){
  const b = document.createElement('button');
  b.className = 'chip chip--toggle';
  b.type = 'button';
  b.textContent = label;
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.setAttribute(
    'aria-label',
    (on ? 'Selected: ' : 'Toggle filter: ') + label
  );
  return b;
}



function buildCategories(){
  if (!categoryRow) return;
  categoryRow.innerHTML = '';

  TOP_CATEGORIES.forEach(cat => {
    const isOn = activeCategory === cat;
    const b = makeButton(cat, isOn);

    b.addEventListener('click', () => {
      if (activeCategory === cat){
        activeCategory = null;
        subActive.clear();
      } else {
        activeCategory = cat;
        subActive.clear();
      }
      updateCategoryButtons();
      buildSubfilters();
      render();
    });

    categoryRow.appendChild(b);
  });

  if (clearAllBtn && !clearBound){
    clearAllBtn.addEventListener('click', () => {
      activeCategory = null;
      subActive.clear();
      updateCategoryButtons();
      buildSubfilters();

      if (searchInput){
        searchInput.value = '';
      }
      searchTerm = '';

      resetAdvanced();
      buildAdvancedLists();
      render();
    });
    clearBound = true;
  }
}

function updateCategoryButtons(){
  if (!categoryRow) return;
  const btns = categoryRow.querySelectorAll('.chip');
  btns.forEach(btn => {
    const label = btn.textContent;
    const selected = (label === activeCategory);
    btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    btn.setAttribute(
      'aria-label',
      (selected ? 'Selected: ' : 'Toggle filter: ') + label
    );
  });
}

function buildSubfilters(){
  if (!subRow) return;
  subRow.innerHTML = '';

  if (!activeCategory){
    subRow.style.display = 'none';
    return;
  }

  const pool = DATA.items.filter(it =>
    Array.isArray(it.categories) && it.categories.includes(activeCategory)
  );

  const counts = new Map();

  pool.forEach(it => {
    const tags = Array.isArray(it.tags) ? it.tags : [];
    tags.forEach(t => {
      if (t === activeCategory) return;
      counts.set(t, (counts.get(t) || 0) + 1);
    });
  });

  const subs = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(entry => entry[0]);

  subs.forEach(tag => {
    const isOn = subActive.has(tag);
    const chip = makeButton(tag, isOn);

    chip.addEventListener('click', () => {
      if (subActive.has(tag)){
        subActive.delete(tag);
      } else {
        subActive.add(tag);
      }
      chip.setAttribute(
        'aria-pressed',
        subActive.has(tag) ? 'true' : 'false'
      );
      render();
    });

    subRow.appendChild(chip);
  });

  subRow.style.display = subs.length ? 'flex' : 'none';
}

if (searchInput){
  searchInput.addEventListener(
    'input',
    debounce(() => {
      searchTerm = searchInput.value.toLowerCase().trim();
      render();
    }, 120)
  );
}


if (sortSelect){
  sortSelect.addEventListener('change', render);
}


function resetAdvanced(){
  advanced.creator = '';
  advanced.type    = '';
  advanced.versions.clear();
  advanced.software.clear();
  advanced.tags.clear();

  if (advCreator) advCreator.value = '';
  if (advType)    advType.value    = '';

  if (ver6) ver6.checked = false;
  if (ver7) ver7.checked = false;

  if (advSoftwareBody){
    advSoftwareBody
      .querySelectorAll('input[type="checkbox"]')
      .forEach(cb => {
        cb.checked = false;
        const label = cb.closest('.chip--toggle');
        if (label){
          label.setAttribute('aria-pressed', 'false');
        }
      });
  }
  if (advTagsBody){
    advTagsBody
      .querySelectorAll('input[type="checkbox"]')
      .forEach(cb => {
        cb.checked = false;
        const label = cb.closest('.chip--toggle');
        if (label){
          label.setAttribute('aria-pressed', 'false');
        }
      });
  }
}

function buildAdvancedLists(){
  if (!DATA) return;
  if (!advSoftwareBody || !advTagsBody) return;

  const softwareList = Array.isArray(DATA.softwareList) ? DATA.softwareList : [];
  const tagList      = Array.isArray(DATA.tags)         ? DATA.tags         : [];

  advSoftwareBody.innerHTML = '';
  advTagsBody.innerHTML = '';

  function addCheckbox(container, value){
    const id = value.toLowerCase().replace(/\s+/g, '-');

    const label = document.createElement('label');
    label.className = 'chip chip--toggle adv-chip';
    label.setAttribute('role', 'button');
    label.setAttribute('aria-pressed', 'false');

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.value = value;
    input.className = 'adv-chip-input';

    const span = document.createElement('span');
    span.textContent = value;

    label.appendChild(input);
    label.appendChild(span);
    container.appendChild(label);

    input.addEventListener('change', () => {
      const set = (container === advSoftwareBody) ? advanced.software : advanced.tags;

      if (input.checked){
        set.add(value);
        label.setAttribute('aria-pressed', 'true');
      } else {
        set.delete(value);
        label.setAttribute('aria-pressed', 'false');
      }
    });
  }

  softwareList
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .forEach(sw => addCheckbox(advSoftwareBody, sw));

  tagList
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .forEach(tag => addCheckbox(advTagsBody, tag));
}


if (advLink && advDialog){
  advLink.addEventListener('click', (e) => {
    e.preventDefault();
    advDialog.showModal();
  });
}

if (advClose && advDialog){
  advClose.addEventListener('click', () => advDialog.close());
}

if (advReset){
  advReset.addEventListener('click', () => {
    resetAdvanced();
    render();
  });
}

if (advForm){
  advForm.addEventListener('submit', (e) => {
    e.preventDefault();

    advanced.creator = (advCreator.value || '').trim().toLowerCase();
    advanced.type    = advType.value || '';

    advanced.versions.clear();
    if (ver6 && ver6.checked) advanced.versions.add('6.x');
    if (ver7 && ver7.checked) advanced.versions.add('7.x');

    advanced.software.clear();
    if (advSoftwareBody){
      advSoftwareBody
        .querySelectorAll('input[type="checkbox"]')
        .forEach(cb => {
          if (cb.checked) advanced.software.add(cb.value);
        });
    }

    advanced.tags.clear();
    if (advTagsBody){
      advTagsBody
        .querySelectorAll('input[type="checkbox"]')
        .forEach(cb => {
          if (cb.checked) advanced.tags.add(cb.value);
        });
    }

    advDialog.close();
    render();
  });
}


function getFilteredItems(){
  let items = Array.isArray(DATA.items) ? [...DATA.items] : [];

  items = items.filter(item => {
    const tags       = Array.isArray(item.tags)       ? item.tags       : [];
    const categories = Array.isArray(item.categories) ? item.categories : [];
    const versions   = Array.isArray(item.versions)   ? item.versions   : [];
    const programs   = Array.isArray(item.programs)   ? item.programs   : [];

    if (activeCategory){
      if (!categories.includes(activeCategory)) return false;

      if (subActive.size){
        const matchesAnySub = [...subActive].some(t => tags.includes(t));
        if (!matchesAnySub) return false;
      }
    }

    if (advanced){
      if (advanced.type && item.type !== advanced.type) return false;

      if (advanced.creator){
        const creator = (item.creator || '').toLowerCase();
        if (!creator.includes(advanced.creator)) return false;
      }

      if (advanced.versions && advanced.versions.size){
        const matchesVersion = [...advanced.versions].some(v => versions.includes(v));
        if (!matchesVersion) return false;
      }

      if (advanced.software && advanced.software.size){
        const matchesSoftware = [...advanced.software].some(v => programs.includes(v));
        if (!matchesSoftware) return false;
      }

      if (advanced.tags && advanced.tags.size){
        const matchesTag = [...advanced.tags].some(v => tags.includes(v));
        if (!matchesTag) return false;
      }
    }

    if (searchTerm){
      const hay = [
        item.title   || '',
        item.creator || '',
        item.summary || '',
        ...tags
      ].join(' ').toLowerCase();

      if (!hay.includes(searchTerm)) return false;
    }

    return true;
  });

  const mode = sortSelect ? sortSelect.value : 'date-desc';

  items.sort((a, b) => {
    if (mode === 'title-az'){
      return (a.title || '').localeCompare(b.title || '');
    }
    if (mode === 'title-za'){
      return (b.title || '').localeCompare(a.title || '');
    }

    const da = new Date(a.updated);
    const db = new Date(b.updated);

    if (mode === 'date-asc'){
      return da - db;
    }

    return db - da;
  });

  return items;
}


function computeLinks(item){
  const hasPrimary = !!(item.href && item.href.trim());
  const hasLocal   = !!(item.localPath && item.localPath.trim());
  const hasArchive = !!(item.archiveHref && item.archiveHref.trim());
  const archiveOnly = item.archiveOnly === true;

  let titleHref = '#';

  if (archiveOnly){
    if (hasLocal){
      titleHref = `guides/guide.html?id=${encodeURIComponent(item.id)}`;
    } else if (hasArchive){
      titleHref = item.archiveHref;
    }
  } else if (hasPrimary){
    titleHref = item.href;
  } else if (hasLocal){
    titleHref = `guides/guide.html?id=${encodeURIComponent(item.id)}`;
  }

  return {
    titleHref,
    hasPrimary,
    hasLocal,
    hasArchive,
    archiveOnly
  };
}

function card(item){
  const links = computeLinks(item);

  const versionTags = Array.isArray(item.versions) ? item.versions : [];
  const programTags = Array.isArray(item.programs) ? item.programs : [];
  const otherTags  = Array.isArray(item.tags) ? item.tags : [];

  const el = document.createElement('article');
  el.className = 'card';
  el.tabIndex = 0;

  if (versionTags.length){
    const vb = document.createElement('div');
    vb.className = 'version-badge';
    vb.textContent = versionTags[0];
    el.appendChild(vb);
  }

  const body = document.createElement('div');
  body.className = 'body';

  const title = document.createElement('a');
  title.className = 'title';
  title.href = links.titleHref || '#';

  // Every real title destination opens in a new tab.
  if (links.titleHref && links.titleHref !== '#'){
    title.target = '_blank';
    title.rel = 'noopener noreferrer';
  }

  title.textContent = item.title || 'Untitled guide';

  const creatorLine = document.createElement('div');
  creatorLine.className = 'creator-line';

  if (item.creator){
    if (item.creatorUrl && item.creatorUrl.trim()){
      const a = document.createElement('a');
      a.href = item.creatorUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = item.creator;

      creatorLine.append('by ', a);
    } else {
      creatorLine.textContent = 'by ' + item.creator;
    }
  }


  const infoLine = document.createElement('div');
  infoLine.className = 'meta-line';

  const infoBits = [];

  if (programTags.length){
    infoBits.push(programTags.join(', '));
  }

  if (item.type){
    infoBits.push(item.type);
  }

  infoLine.innerHTML =
    infoBits.join(' <span class="sep">|</span> ');



  const divider = document.createElement('div');
  divider.className = 'divider';

  const desc = document.createElement('p');
  desc.className = 'desc mt-1';
  desc.textContent = item.summary || '';


  const levelLine = document.createElement('div');
  levelLine.className = 'level-line mt-2';

  if (item.level){
    levelLine.textContent = 'Level: ' + item.level;
  }


  const tagRow = document.createElement('div');
  tagRow.className = 'meta pill-row mt-2';

  otherTags.forEach(tag => {
    const t = document.createElement('span');
    t.className = 'badge';
    t.textContent = tag;
    tagRow.appendChild(t);
  });

  const actions = document.createElement('div');
  actions.className = 'actions';

  if (links.hasPrimary && !links.archiveOnly){
    const openBtn = document.createElement('a');

    openBtn.className = 'chip chip--action';
    openBtn.textContent = 'Open original';
    openBtn.href = item.href;
    openBtn.target = '_blank';
    openBtn.rel = 'noopener noreferrer';

    actions.appendChild(openBtn);
  }

  if (links.hasLocal){
    const localBtn = document.createElement('a');

    localBtn.className = 'chip chip--action';
    localBtn.textContent = 'Local copy';
    localBtn.href =
      `guides/guide.html?id=${encodeURIComponent(item.id)}`;

    localBtn.target = '_blank';
    localBtn.rel = 'noopener noreferrer';

    actions.appendChild(localBtn);
  }

  if (links.hasArchive){
    const archiveBtn = document.createElement('a');
    archiveBtn.className = 'chip chip--action';
    archiveBtn.textContent = 'Archived copy';
    archiveBtn.href = item.archiveHref;
    archiveBtn.target = '_blank';
    archiveBtn.rel = 'noopener noreferrer';

    actions.appendChild(archiveBtn);
  }

  body.append(
    title,
    creatorLine,
    infoLine,
    divider,
    desc,
    levelLine,
    tagRow
  );

  if (actions.children.length){
    body.appendChild(actions);
  }

  el.appendChild(body);

  return el;
}

function preview(item){
  if (!viewer || !viewerFrame || !viewerTitle) return;

  viewerTitle.textContent = item.title || '';
  const url   = item.href || '';
  const isPdf = /\.pdf($|\?)/i.test(url);
  const isDrive = /drive\.google\.com/.test(url);

  let src = url;
  if (isDrive){
    src = url.replace('/view', '/preview');
  } else if (isPdf){
    src = url;
  }

  viewerFrame.src = src;
  viewer.showModal();
}


function render(){
  if (!grid) return;
  grid.innerHTML = '';

  const items = getFilteredItems();

  if (!items.length){
    const p = document.createElement('p');
    p.textContent = 'No guides match your current search or filters.';
    p.style.color = 'var(--muted)';
    grid.appendChild(p);
    return;
  }

  items.forEach(item => grid.appendChild(card(item)));
}


async function initData(){
  try{
    const res = await fetch('data/guides.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load data/guides.json');

    DATA = await res.json();

    if (!Array.isArray(DATA.items)){
      DATA.items = [];
    }

    const allTags     = new Set();
    const allSoftware = new Set();

    DATA.items.forEach(item => {
      const tags     = Array.isArray(item.tags)     ? item.tags     : [];
      const programs = Array.isArray(item.programs) ? item.programs : [];

      tags.forEach(t => allTags.add(t));
      programs.forEach(p => allSoftware.add(p));
    });

    DATA.tags         = Array.from(allTags);
    DATA.softwareList = Array.from(allSoftware);

    buildCategories();
    buildSubfilters();
    buildAdvancedLists();
    render();
  } catch (err){
    console.error(err);
    if (grid){
      grid.innerHTML =
        '<p style="color:var(--muted)">Could not load guides.</p>';
    }
  }
}

initData();
