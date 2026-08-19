/* READING-STATS-SECTIONS-V1 — split tag analytics into the same tag groups used by book entries */
(() => {
  if (window.__readingStatsSectionsInstalled) return;
  window.__readingStatsSectionsInstalled = true;

  const groups = [
    {
      title: '💞 Representation',
      tags: ['M/M','Gay','Bisexual','Queer']
    },
    {
      title: '💕 Romance & Tropes',
      tags: [
        'Forbidden Romance','Opposites Attract','College Romance','Possessive','HEA',
        'Protective','Enemies to Lovers','Age Gap','Jealousy','Forced Proximity',
        'Grumpy x Sunshine','Secret Relationship','Forbidden Love','Friends with Benefits'
      ]
    },
    {
      title: '🌶️ Spice',
      tags: ['Very Spicy','Spicy']
    },
    {
      title: '📚 Genre & Setting',
      tags: ['Mafia','Dark Romance','Dark','College','Sports Romance','Small Town','Vampires','Paranormal']
    }
  ];

  const normalize = value => String(value || '').trim().toLowerCase();
  const tagMap = new Map();
  groups.forEach(group => group.tags.forEach(tag => tagMap.set(normalize(tag), group.title)));

  function pie(obj) {
    const vals = Object.entries(obj);
    if (!vals.length) return '<div class="empty">No data in this section yet.</div>';
    const total = vals.reduce((sum, [, value]) => sum + value, 0);
    const colors = ['#e99ab5','#c9a0e9','#8fd3c7','#f2bd73','#9bb8e8','#e8a5a5','#b8d98a','#d7a0c8'];
    let start = 0;
    const stops = vals.map(([, value], i) => {
      const end = start + value / total * 360;
      const stop = colors[i % colors.length] + ' ' + start + 'deg ' + end + 'deg';
      start = end;
      return stop;
    }).join(',');
    return '<div class="stats-pie-wrap"><div class="stats-pie" style="background:conic-gradient(' + stops + ')"></div><div class="stats-legend">' +
      vals.map(([key, value], i) => '<div class="stats-legend-row"><span class="stats-swatch" style="background:' + colors[i % colors.length] + '"></span>' + esc(key) + ': ' + value + '</div>').join('') +
      '</div></div>';
  }

  function renderGroupedStats() {
    const p = $('statsPanel');
    if (!p || typeof state === 'undefined') return;
    const books = Array.isArray(state.books) ? state.books : [];
    const read = books.filter(b => normalize(b.status) === 'read');
    const byStatus = {};
    const grouped = new Map(groups.map(g => [g.title, {}]));
    const ungrouped = {};

    books.forEach(book => {
      const tags = Array.isArray(book.tags) ? book.tags : [];
      const seen = new Set();
      tags.forEach(tag => {
        const clean = String(tag || '').trim();
        if (!clean) return;
        const groupTitle = tagMap.get(normalize(clean));
        if (groupTitle) {
          if (!seen.has(groupTitle)) {
            const target = grouped.get(groupTitle);
            target[clean] = (target[clean] || 0) + 1;
            seen.add(groupTitle);
          }
        } else {
          ungrouped[clean] = (ungrouped[clean] || 0) + 1;
        }
      });
      const status = book.status || 'Other';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    let html = '<div class="section-title">📊 Reading Stats</div>' +
      '<div class="section-sub">Your reading numbers at a glance, with tags separated into the same categories used when you add a book. 🎀</div>' +
      '<div class="reading-grid">' +
      '<div class="reading-card"><b>' + read.length + '</b><span>Books finished</span></div>' +
      '<div class="reading-card"><b>' + read.reduce((a,b) => a + (Number(b.pages) || 0), 0).toLocaleString() + '</b><span>Pages read</span></div>' +
      '<div class="reading-card"><b>' + (read.length ? (read.reduce((a,b) => a + Number(b.rating || 0), 0) / (read.filter(b => b.rating).length || 1)).toFixed(1) : '—') + '</b><span>Average rating</span></div>' +
      '<div class="reading-card"><b>' + books.filter(b => b.favorite).length + '</b><span>Favorites</span></div>' +
      '</div>';

    html += '<div class="panel" style="margin-top:14px"><h3>Books by status</h3>' + pie(byStatus) + '</div>';

    groups.forEach(group => {
      const data = grouped.get(group.title) || {};
      html += '<div class="panel stats-group-panel" style="margin-top:14px"><h3>' + group.title + '</h3>' + pie(data) + '</div>';
    });

    if (Object.keys(ungrouped).length) {
      html += '<div class="panel stats-group-panel" style="margin-top:14px"><h3>🏷️ Other Tags</h3>' + pie(ungrouped) + '</div>';
    }

    p.innerHTML = html;
  }

  const style = document.createElement('style');
  style.textContent = `
    .stats-group-panel h3{font-family:Georgia,serif;color:#9e4d68;margin:0 0 12px}
    .stats-pie-wrap{display:flex;gap:24px;align-items:center;flex-wrap:wrap}
    .stats-pie{width:190px;height:190px;border-radius:50%;flex:0 0 190px}
    .stats-legend{min-width:220px;max-height:230px;overflow:auto;padding-right:8px}
    .stats-legend-row{margin:6px 0;font-size:13px;color:#3f3037}
    .stats-swatch{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:7px;vertical-align:-1px}
    @media(max-width:600px){.stats-pie-wrap{display:block}.stats-pie{margin:0 auto 16px}.stats-legend{max-height:none}}
  `;
  document.head.appendChild(style);

  window.renderReadingStatsSections = renderGroupedStats;

  // renderStats is called by the app's main renderer. Replace only that function;
  // do not touch the global render() function so the other tabs remain stable.
  window.renderStats = renderGroupedStats;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(renderGroupedStats, 0), { once:true });
  } else {
    setTimeout(renderGroupedStats, 0);
  }
})();
