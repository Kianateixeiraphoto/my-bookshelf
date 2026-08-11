/* My Bookshelf — stats cleanup v2
 * Series is metadata, never a Tags / tropes chart value.
 * This also cleans legacy imports where series values were accidentally copied into tags.
 */
(() => {
  const cleanKey = value => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

  function renderCleanStats() {
    const p = document.getElementById('statsPanel');
    if (!p || typeof state === 'undefined') return;

    const books = Array.isArray(state.books) ? state.books : [];
    const read = books.filter(b => cleanKey(b.status) === 'read');
    const byStatus = {};
    const byTag = {};

    // Build a global set as well as per-book values. This catches legacy records
    // where the series field was lost but the series name remained in tags.
    const allSeries = new Set(
      books.map(b => cleanKey(b.series)).filter(Boolean)
    );

    books.forEach(b => {
      const status = String(b.status || 'Other').trim() || 'Other';
      byStatus[status] = (byStatus[status] || 0) + 1;

      const ownSeries = cleanKey(b.series);
      (Array.isArray(b.tags) ? b.tags : []).forEach(tag => {
        const label = String(tag || '').trim();
        const key = cleanKey(label);
        if (!label || (ownSeries && key === ownSeries) || allSeries.has(key)) return;
        byTag[label] = (byTag[label] || 0) + 1;
      });
    });

    const pieHtml = typeof pie === 'function' ? pie(byTag) : '<div class="empty">Not enough data yet.</div>';
    const statusPie = typeof pie === 'function' ? pie(byStatus) : '';
    const pages = read.reduce((a, b) => a + (Number(b.pages) || 0), 0).toLocaleString();
    const ratedRead = read.filter(b => Number(b.rating) > 0);
    const avg = ratedRead.length
      ? (ratedRead.reduce((a, b) => a + Number(b.rating || 0), 0) / ratedRead.length).toFixed(1)
      : '—';
    const favorites = books.filter(b => b.favorite).length;

    p.innerHTML = '<div class="section-title">📊 Reading Stats</div>' +
      '<div class="section-sub">Your reading numbers at a glance. Pie-chart vibes included. 🎀</div>' +
      '<div class="reading-grid">' +
        '<div class="reading-card"><b>' + read.length + '</b><span>Books finished</span></div>' +
        '<div class="reading-card"><b>' + pages + '</b><span>Pages read</span></div>' +
        '<div class="reading-card"><b>' + avg + '</b><span>Average rating</span></div>' +
        '<div class="reading-card"><b>' + favorites + '</b><span>Favorites</span></div>' +
      '</div>' +
      '<div class="panel" style="margin-top:14px"><h3>Books by status</h3>' + statusPie + '</div>' +
      '<div class="panel" style="margin-top:14px"><h3>Tags / tropes</h3>' + pieHtml + '</div>';
  }

  function install() {
    if (typeof renderStats !== 'function') return false;
    renderStats = renderCleanStats;
    return true;
  }

  // Install after the main app script has defined renderStats.
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 100) clearInterval(timer);
  }, 100);
})();
