const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  toggle.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('open');
  toggle.querySelector('span').textContent = '＋';
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
  toggle.querySelector('span').textContent = open ? '−' : '＋';
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    closeMenu(); toggle.focus();
  }
});
document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-category]').forEach(row => {
      row.hidden = button.dataset.filter !== 'all' && row.dataset.category !== button.dataset.filter;
    });
  });
});

// Search the full publication record without changing the source information.
const publicationSearch = document.querySelector('#publication-search');
if (publicationSearch) {
  const records = [...document.querySelectorAll('.legacy-content li')];
  const result = document.querySelector('#publication-result');
  function searchPublications() {
    const words = publicationSearch.value.normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    records.forEach(record => {
      const haystack = record.textContent.normalize('NFKC').toLocaleLowerCase();
      const matches = words.every(word => haystack.includes(word));
      record.hidden = !matches;
      if (matches) visible++;
    });
    const english = document.documentElement.lang === 'en';
    result.textContent = english
      ? (words.length ? `${visible} publication${visible === 1 ? '' : 's'} found.` : `${records.length} publications listed.`)
      : (words.length ? `${visible}件の業績が見つかりました。` : `${records.length}件の業績を掲載しています。`);
  }
  publicationSearch.addEventListener('input', searchPublications);
  searchPublications();
}

// An archive anchor may point into a folded alumni record.
function revealAnchor() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  let parent = target.parentElement;
  while (parent) {
    if (parent.tagName === 'DETAILS') parent.open = true;
    parent = parent.parentElement;
  }
}
window.addEventListener('hashchange', revealAnchor);
revealAnchor();

