/* My Bookshelf — Reading Stats grouped charts
 * Splits tag/trope statistics into the same sections used by Edit Book.
 * Series is metadata and is never counted as a tag/trope.
 * Spice rating is tracked separately from the Spice / Vibes tag section.
 */
(() => {
  const cleanKey = value => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

  const TAG_SECTIONS = {
    'Pairing': ['MM','MF','FF','Poly','Why Choose','Reverse Harem'],
    'Orientation': ['Gay','Lesbian','Bisexual','Pansexual','Queer','Asexual','Demisexual','Questioning'],
    'Romance Tropes': ['Enemies to Lovers','Friends to Lovers','Friends with Benefits','Fake Dating','Forced Proximity','Only One Bed','Grumpy x Sunshine','Found Family','Second Chance','Forbidden Romance','Age Gap','Forbidden Love','Opposites Attract','Workplace Romance','Small Town Romance','Sports Romance','College Romance'],
    'Relationship / Dynamic': ['Possessive','Jealousy','Betrayal','Hurt/Comfort','Slow Burn','High Angst','Fluff','HEA','Happy for Now','Open Relationship','Established Relationship','Secret Relationship','Mutual Pining','Only One Bed'],
    'Spice / Vibes': ['Sweet','Spicy','Very Spicy','Dark Romance','Dark','Cozy','Angsty','Emotional','Funny','Protective','Morally Gray','Touch Her/Him and Die'],
    'Fantasy / Paranormal': ['Shifters','Vampires','Werewolves','Omegaverse','Mpreg','Witches','Fae','Demons','Monsters','Magic','Supernatural'],
    'Genre / Setting': ['Contemporary','Historical','Fantasy','Paranormal','Sci-Fi','RomCom','Mystery','Thriller','Horror','Mafia','Billionaire','Military','Law Enforcement','Cowboys','Academia','High School','College','Workplace','Small Town','Road Trip']
  };

  function countsForSection(books, options) {
    const allowed = new Set(options.map(cleanKey));
    const counts = {};
    options.forEach(option => { counts[option] = 0; });
    books.forEach(book => {
      const seen = new Set();
      (Array.isArray(book.tags) ? book.tags : []).forEach(tag => {
        const key = cleanKey(tag);
        if (allowed.has(key) && !seen.has(key)) {
          const canonical = options.find(option => cleanKey(option) === key) || tag;
          counts[canonical] = (counts[canonical] || 0) + 1;
          seen.add(key);
        }
      });
    });
    return Object.fromEntries(Object.entries(counts).filter(([, count]) => count > 0));
  }

  function canonicalSpice(value) {
    const s = String(value ?? '').trim().toLowerCase();
    if (!s || s === 'not rated' || s === '0' || s === '0 chilis') return 'Not rated';
    const match = s.match(/[1-5]/);
    if (!match) return 'Not rated';
    const n = Number(match[0]);
    return n === 1 ? '🌶️ 1 chili' : `🌶️ ${n} chilis`;
  }

  function spiceCounts(books) {
    const order = ['Not rated','🌶️ 1 chili','🌶️ 2 chilis','🌶️ 3 chilis','🌶️ 4 chilis','🌶️ 5 chilis'];
    const counts = Object.fromEntries(order.map(key => [key, 0]));
    books.forEach(book => { counts[canonicalSpice(book.spice || book.spiceRating || book.spice_level)] += 1; });
    return Object.fromEntries(order.filter(key => counts[key] > 0).map(key => [key, counts[key]]));
  }

  function ensureStatsStyles() {
    if (document.getElementById('stats-sections-v4')) return;
    const style = document.createElement('style');
    style.id = 'stats-sections-v4';
    style.textContent = `
      .stats-chart-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:14px}
      .stats-chart-panel{min-width:0}
      .stats-chart-panel h3{margin:0 0 12px;font-family:Georgia,serif;color:#684352}
      .stats-chart-panel .pie-wrap{justify-content:flex-start;align-items:center}
      .stats-chart-panel .pie-circle{width:165px;height:165px;flex:0 0 165px}
      .stats-legend{min-width:190px;max-width:100%;font-size:12px;color:#6f5360}
      .stats-legend-row{display:flex;align-items:center;gap:7px;margin:5px 0}
      .stats-legend-dot{width:10px;height:10px;border-radius:3px;flex:0 0 10px}
      .stats-empty{padding:18px 4px;color:var(--muted);font-size:12px}
      @media(max-width:800px){.stats-chart-grid{grid-template-columns:1fr}}
      @media(max-width:520px){.stats-chart-panel .pie-wrap{flex-direction:column;align-items:flex-start}.stats-chart-panel .pie-circle{width:150px;height:150px;flex-basis:150px}.stats-legend{min-width:0;width:100%}}
    `;
    document.head.appendChild(style);
  }

  function pieCard(title, counts) {
    if (!Object.keys(counts).length) {
      return `<div class="panel stats-chart-panel"><h3>${esc(title)}</h3><div class="stats-empty">No books have been tagged in this section yet.</div></div>`;
    }
    const vals = Object.entries(counts);
    const total = vals.reduce((sum, [, value]) => sum + value, 0);
    const colors = ['#e99ab5','#c9a0e9','#8fd3c7','#f2bd73','#9bb8e8','#e8a5a5','#d99bb6','#a9c8a5','#c3a6df','#efb0a8','#9fc9d9','#e7c07b'];
    let start = 0;
    const stops = vals.map(([, value], index) => {
      const end = start + value / total * 360;
      const stop = `${colors[index % colors.length]} ${start}deg ${end}deg`;
      start = end;
      return stop;
    }).join(',');
    const legend = vals.map(([key, value], index) =>
      `<div class="stats-legend-row"><span class="stats-legend-dot" style="background:${colors[index % colors.length]}"></span><span>${esc(key)}: ${value}</span></div>`
    ).join('');
    return `<div class="panel stats-chart-panel"><h3>${esc(title)}</h3><div class="pie-wrap" style="display:flex;gap:22px;flex-wrap:wrap"><div class="pie-circle" style="border-radius:50%;background:conic-gradient(${stops})"></div><div class="stats-legend">${legend}</div></div></div>`;
  }

  function renderCleanStats() {
    const p = document.getElementById('statsPanel');
    if (!p || typeof state === 'undefined') return;
    ensureStatsStyles();
    const books = Array.isArray(state.books) ? state.books : [];
    const read = books.filter(b => cleanKey(b.status) === 'read');
    const byStatus = {};
    books.forEach(book => {
      const status = String(book.status || 'Other').trim() || 'Other';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    const pages = read.reduce((sum, book) => sum + (Number(book.pages) || 0), 0).toLocaleString();
    const ratedRead = read.filter(book => Number(book.rating) > 0);
    const avg = ratedRead.length ? (ratedRead.reduce((sum, book) => sum + Number(book.rating || 0), 0) / ratedRead.length).toFixed(1) : '—';
    const favorites = books.filter(book => book.favorite).length;
    const sectionCharts = Object.entries(TAG_SECTIONS).map(([name, options]) => pieCard(name, countsForSection(books, options))).join('');
    const spiceChart = pieCard('🌶️ Spice Rating', spiceCounts(books));
    p.innerHTML = `<div class="section-title">📊 Reading Stats</div>
      <div class="section-sub">Your reading numbers at a glance — organized by your Edit Book tag sections. 🎀</div>
      <div class="reading-grid">
        <div class="reading-card"><b>${read.length}</b><span>Books finished</span></div>
        <div class="reading-card"><b>${pages}</b><span>Pages read</span></div>
        <div class="reading-card"><b>${avg}</b><span>Average rating</span></div>
        <div class="reading-card"><b>${favorites}</b><span>Favorites</span></div>
      </div>
      <div class="panel" style="margin-top:14px"><h3>Books by status</h3>${typeof pie === 'function' ? pie(byStatus) : '<div class="stats-empty">Not enough data yet.</div>'}</div>
      <div class="stats-chart-grid">${sectionCharts}${spiceChart}</div>`;
  }

  function install() {
    if (typeof renderStats !== 'function') return false;
    renderStats = renderCleanStats;
    return true;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 100) clearInterval(timer);
  }, 100);
})();

/* Load the AO3 importer after the main app has defined state/render helpers. */
(() => {
  const id = 'ao3-import-script';
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.src = 'ao3-import.js?v=1';
  script.defer = false;
  document.head.appendChild(script);
})();
