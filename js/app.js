/* =====================================================
   app.js — Company Leaderboard 2025
   Pure vanilla JS, no dependencies
   ===================================================== */

const CATEGORY_ICONS = {
  'Education': 'fa-graduation-cap',
  'Public Speaking': 'fa-display',
  'University Partnership': 'fa-face-smile'
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── State ──────────────────────────────────────────────
let allPeople = [];
let activeFilters = { year: '', quarter: '', category: '' };
let searchQuery = '';

// ── Boot ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetch('data/leaderboard.json')
    .then(r => r.json())
    .then(data => {
      allPeople = data.people;
      initFilters();
      initSearch();
      applyFilters();
    })
    .catch(err => {
      console.error('Failed to load leaderboard data:', err);
    });
});

// ── Helpers ────────────────────────────────────────────

/** Simple deterministic hash for a string → 0..359 */
function nameToHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function getInitials(firstName, lastName) {
  return (firstName[0] + lastName[0]).toUpperCase();
}

function formatDate(iso) {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const mon = MONTHS[d.getUTCMonth()];
  const yr = d.getUTCFullYear();
  return `${day}-${mon}-${yr}`;
}

/** Build avatar element — photo or initials circle */
function buildAvatar(person, size) {
  const wrapper = document.createElement('div');
  wrapper.className = 'avatar';
  wrapper.style.width = size + 'px';
  wrapper.style.height = size + 'px';
  wrapper.style.fontSize = Math.round(size * 0.33) + 'px';

  if (person.photo) {
    const img = document.createElement('img');
    img.src = person.photo;
    img.alt = `${person.firstName} ${person.lastName}`;
    // Fallback to initials if image fails
    img.addEventListener('error', () => {
      wrapper.removeChild(img);
      renderInitials(wrapper, person);
    });
    wrapper.appendChild(img);
  } else {
    renderInitials(wrapper, person);
  }
  return wrapper;
}

function renderInitials(wrapper, person) {
  const hue = nameToHue(person.firstName + person.lastName);
  wrapper.style.background = `hsl(${hue}, 55%, 55%)`;
  wrapper.textContent = getInitials(person.firstName, person.lastName);
}

// ── Filter engine ──────────────────────────────────────

function computeStats(person, filters) {
  const acts = person.activities.filter(a => {
    if (filters.year && String(a.year) !== filters.year) return false;
    if (filters.quarter && a.quarter !== filters.quarter) return false;
    if (filters.category && a.category !== filters.category) return false;
    return true;
  });

  const totalPoints = acts.reduce((s, a) => s + a.points, 0);
  const categoryCounts = {};
  for (const a of acts) {
    categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
  }
  return { totalPoints, categoryCounts, filteredActivities: acts };
}

function applyFilters() {
  // Compute stats for every person
  const computed = allPeople.map(p => ({
    person: p,
    ...computeStats(p, activeFilters)
  }));

  // Sort descending by total, remove zero-point people
  const ranked = computed
    .filter(c => c.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  // Apply search on top
  const query = searchQuery.trim().toLowerCase();
  const visible = query
    ? ranked.filter(c => {
        const full = `${c.person.firstName} ${c.person.lastName}`.toLowerCase();
        return full.includes(query);
      })
    : ranked;

  renderPodium(visible.slice(0, 3));
  renderPersonList(visible);
}

// ── Podium ─────────────────────────────────────────────

const PODIUM_VARIANTS = [
  { key: 'second', badgeMod: 'silver', scoreMod: 'silver', blockMod: 'second', blockH: 100 },
  { key: 'first',  badgeMod: 'gold',   scoreMod: 'gold',   blockMod: 'first',  blockH: 130 },
  { key: 'third',  badgeMod: 'bronze', scoreMod: 'bronze', blockMod: 'third',  blockH: 75  },
];

function renderPodium(top) {
  const container = document.getElementById('podium');
  container.innerHTML = '';

  if (top.length === 0) return;

  // Reorder: visual order is [2nd, 1st, 3rd]
  const order = [top[1], top[0], top[2]];

  order.forEach((entry, visualIdx) => {
    if (!entry) return;

    const v = PODIUM_VARIANTS[visualIdx];
    const { person, totalPoints } = entry;
    const avatarSize = v.key === 'first' ? 104 : 72;

    const col = document.createElement('div');
    col.className = `podium__person podium__person--${v.key}`;

    // Info section
    const info = document.createElement('div');
    info.className = 'podium__info';

    // Avatar wrapper
    const avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'podium__avatar-wrapper';
    const avatar = buildAvatar(person, avatarSize);
    avatarWrapper.appendChild(avatar);

    const badge = document.createElement('div');
    badge.className = `podium__badge podium__badge--${v.badgeMod}`;
    badge.textContent = entry.rank;
    avatarWrapper.appendChild(badge);
    info.appendChild(avatarWrapper);

    // Name
    const name = document.createElement('div');
    name.className = 'podium__name';
    name.textContent = `${person.firstName} ${person.lastName}`;
    info.appendChild(name);

    // Meta
    const meta = document.createElement('div');
    meta.className = 'podium__meta';
    meta.textContent = `${person.jobTitle} (${person.department})`;
    info.appendChild(meta);

    // Score pill
    const score = document.createElement('div');
    score.className = `podium__score podium__score--${v.scoreMod}`;
    score.innerHTML = `<i class="fa-solid fa-star podium__score-star"></i> ${totalPoints}`;
    info.appendChild(score);

    col.appendChild(info);

    // Podium block
    const block = document.createElement('div');
    block.className = `podium__block podium__block--${v.blockMod}`;
    const watermark = document.createElement('span');
    watermark.className = 'podium__block-watermark';
    watermark.textContent = entry.rank;
    block.appendChild(watermark);
    col.appendChild(block);

    container.appendChild(col);
  });
}

// ── Person List ────────────────────────────────────────

function renderPersonList(people) {
  const container = document.getElementById('personList');
  container.innerHTML = '';

  if (people.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'person-list__empty';
    empty.textContent = 'No results found.';
    container.appendChild(empty);
    return;
  }

  people.forEach(entry => {
    const card = buildPersonCard(entry);
    container.appendChild(card);
  });
}

function buildPersonCard(entry) {
  const { person, rank, totalPoints, categoryCounts, filteredActivities } = entry;
  const isTop3 = rank <= 3;

  const card = document.createElement('div');
  card.className = 'person-card' + (isTop3 ? ' person-card--top' : '');

  // ── Row ──
  const row = document.createElement('div');
  row.className = 'person-card__row';

  // Rank
  const rankEl = document.createElement('div');
  rankEl.className = 'person-card__rank';
  rankEl.textContent = rank;
  row.appendChild(rankEl);

  // Avatar
  const avatarWrap = document.createElement('div');
  avatarWrap.className = 'person-card__avatar';
  avatarWrap.appendChild(buildAvatar(person, 48));
  row.appendChild(avatarWrap);

  // Info
  const info = document.createElement('div');
  info.className = 'person-card__info';
  const nameEl = document.createElement('div');
  nameEl.className = 'person-card__name';
  nameEl.textContent = `${person.firstName} ${person.lastName}`;
  const metaEl = document.createElement('div');
  metaEl.className = 'person-card__meta';
  metaEl.textContent = `${person.jobTitle} (${person.department})`;
  info.appendChild(nameEl);
  info.appendChild(metaEl);
  row.appendChild(info);

  // Category icons
  const cats = document.createElement('div');
  cats.className = 'person-card__categories';
  for (const [cat, icon] of Object.entries(CATEGORY_ICONS)) {
    const count = categoryCounts[cat] || 0;
    if (count === 0) continue;
    const catEl = document.createElement('div');
    catEl.className = 'person-card__category';
    catEl.title = cat;
    catEl.innerHTML = `<i class="fa-solid ${icon} person-card__category-icon"></i>
                       <span class="person-card__category-count">${count}</span>`;
    cats.appendChild(catEl);
  }
  row.appendChild(cats);

  // Total score
  const totalEl = document.createElement('div');
  totalEl.className = 'person-card__total';
  totalEl.innerHTML = `<span class="person-card__total-label">Total</span>
    <div class="person-card__total-score">
      <i class="fa-solid fa-star person-card__total-star"></i>
      <span class="person-card__total-number">${totalPoints}</span>
    </div>`;
  row.appendChild(totalEl);

  // Chevron
  const chevron = document.createElement('div');
  chevron.className = 'person-card__chevron';
  chevron.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
  row.appendChild(chevron);

  card.appendChild(row);

  // ── Details (expanded) ──
  const details = document.createElement('div');
  details.className = 'person-card__details';

  const table = buildActivityTable(filteredActivities);
  details.appendChild(table);
  card.appendChild(details);

  // ── Toggle expand ──
  let rendered = false;
  row.addEventListener('click', () => {
    const isExpanded = card.classList.toggle('person-card--expanded');
    if (isExpanded && !rendered) {
      rendered = true;
    }
  });

  return card;
}

function buildActivityTable(activities) {
  const table = document.createElement('div');
  table.className = 'activity-table';

  const heading = document.createElement('div');
  heading.className = 'activity-table__heading';
  heading.textContent = 'Recent Activity';
  table.appendChild(heading);

  const header = document.createElement('div');
  header.className = 'activity-table__header';
  header.innerHTML = `<div>Activity</div><div>Category</div><div>Date</div><div>Points</div>`;
  table.appendChild(header);

  // Sort activities by date descending (most recent first)
  const sorted = [...activities].sort((a, b) => b.date.localeCompare(a.date));

  sorted.forEach(act => {
    const row = document.createElement('div');
    row.className = 'activity-table__row';
    row.innerHTML = `
      <div class="activity-table__cell--name">${escapeHtml(act.name)}</div>
      <div class="activity-table__cell--category">
        <span class="category-pill">${escapeHtml(act.category)}</span>
      </div>
      <div class="activity-table__cell--date">${formatDate(act.date)}</div>
      <div class="activity-table__cell--points">+${act.points}</div>
    `;
    table.appendChild(row);
  });

  return table;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Custom Dropdowns ───────────────────────────────────

function initFilters() {
  const dropdowns = document.querySelectorAll('.filters__dropdown');

  dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('.filters__trigger');
    const options = dropdown.querySelectorAll('.filters__option');
    const labelEl = dropdown.querySelector('.filters__trigger-label');
    const filterKey = dropdown.dataset.filter;

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('filters__dropdown--open');
      // Close all
      dropdowns.forEach(d => d.classList.remove('filters__dropdown--open'));
      if (!isOpen) {
        dropdown.classList.add('filters__dropdown--open');
      }
    });

    options.forEach(opt => {
      opt.addEventListener('click', e => {
        e.stopPropagation();
        const value = opt.dataset.value;

        // Update selected state
        options.forEach(o => o.classList.remove('filters__option--selected'));
        opt.classList.add('filters__option--selected');

        // Update trigger label
        labelEl.textContent = opt.textContent;
        labelEl.title = opt.textContent;

        // Update filter state
        activeFilters[filterKey] = value;
        dropdown.classList.remove('filters__dropdown--open');

        applyFilters();
      });
    });
  });

  // Close all dropdowns on outside click
  document.addEventListener('click', () => {
    dropdowns.forEach(d => d.classList.remove('filters__dropdown--open'));
  });
}

// ── Search ─────────────────────────────────────────────

function initSearch() {
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('searchClear');
  const wrapper = input.closest('.filters__search');

  input.addEventListener('input', () => {
    searchQuery = input.value;
    if (searchQuery) {
      wrapper.classList.add('filters__search--has-value');
    } else {
      wrapper.classList.remove('filters__search--has-value');
    }
    applyFilters();
  });

  clear.addEventListener('click', () => {
    input.value = '';
    searchQuery = '';
    wrapper.classList.remove('filters__search--has-value');
    input.focus();
    applyFilters();
  });
}
