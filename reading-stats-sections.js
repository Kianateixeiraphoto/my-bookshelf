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
    /* READING-STATS-PINK-V2 — keep Reading Stats pink while Bookshelf stays green */
    #statsPanel{
      background:rgba(255,248,250,.90);
      border-color:#efd3dc;
      box-shadow:0 10px 28px rgba(180,93,122,.10);
    }
    #statsPanel .reading-card,
    #statsPanel>.panel{
      background:rgba(255,253,252,.93);
      border-color:#efd5dd;
      box-shadow:0 8px 22px rgba(180,93,122,.09);
    }
    #statsPanel .reading-card b{color:#a64d6b}
    #statsPanel .reading-card span{color:#8a717b}
    #statsPanel>.panel h3,
    #statsPanel .stats-group-panel h3{font-family:Georgia,serif;color:#9e4d68;margin:0 0 12px}

    /* BOOKSHELF-CARD-CLEAN-V2 — keep the forest page, but make book info cards neutral */
    /* Keep the tan/cream outer book entry, but remove the green inset behind its text. */
    #bookshelfPanel .book{
      background:rgba(255,249,233,.96);
      border-color:#d3c28b;
      box-shadow:0 8px 22px rgba(10,45,28,.15);
    }
    #bookshelfPanel .book-body{
      background:transparent !important;
      border:none !important;
      box-shadow:none !important;
      border-radius:0 !important;
    }

    /* Restore the bookshelf section panels removed in the previous pass. */
    #bookshelfPanel #currentlySection .panel,
    #bookshelfPanel #archivedSection .panel{
      background:rgba(255,248,232,.88);
      border-color:#d0bf86;
      box-shadow:var(--shadow);
      padding:18px;
    }

    /* Make section headings readable over the forest artwork. */
    #bookshelfPanel #currentlySection > .section-title,
    #bookshelfPanel #currentlySection > .section-sub,
    #bookshelfPanel #archivedSection > .section-title,
    #bookshelfPanel #archivedSection > .section-sub{
      background:rgba(255,248,232,.90);
      border:1px solid rgba(208,191,134,.72);
      padding-left:10px;
      padding-right:10px;
      width:max-content;
      max-width:100%;
    }
    #bookshelfPanel #currentlySection > .section-title,
    #bookshelfPanel #archivedSection > .section-title{
      border-radius:12px 12px 0 0;
      padding-top:5px;
      padding-bottom:3px;
      margin-bottom:0;
    }
    #bookshelfPanel #currentlySection > .section-sub,
    #bookshelfPanel #archivedSection > .section-sub{
      border-top:0;
      border-radius:0 0 12px 12px;
      padding-top:3px;
      padding-bottom:6px;
      margin-top:0;
    }
    #bookshelfPanel .book-title{color:#31583a}
    #bookshelfPanel .author,
    #bookshelfPanel .meta{color:#62735c}
    #bookshelfPanel .chip{background:#e3edca;color:#436239}

    .stats-pie-wrap{display:flex;gap:24px;align-items:center;flex-wrap:wrap}
    .stats-pie{width:190px;height:190px;border-radius:50%;flex:0 0 190px}
    .stats-legend{min-width:220px;max-height:230px;overflow:auto;padding-right:8px}
    .stats-legend-row{margin:6px 0;font-size:13px;color:#3f3037}
    .stats-swatch{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:7px;vertical-align:-1px}
    @media(max-width:600px){
      .stats-pie-wrap{display:block}
      .stats-pie{margin:0 auto 16px}
      .stats-legend{max-height:none}
      #statsPanel{padding:15px}
      #statsPanel .reading-card,#statsPanel>.panel{background:rgba(255,253,252,.96)}
      #bookshelfPanel .book{background:rgba(255,253,252,.97)}
    }
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
