/* My Bookshelf — stats cleanup
 * Keeps series names out of the Tags / tropes chart.
 * A tag is ignored for a book when it matches that book's Series value.
 */
(() => {
  function cleanKey(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function renderCleanStats() {
    const p = document.getElementById('statsPanel');
    if (!p || !window.state) return;

    const books = Array.isArray(state.books) ? state.books : [];
    const read = books.filter(b => String(b.status || '').trim().toLowerCase() === 'read');
    const byStatus = {};
    const byTag = {};

    books.forEach(b => {
      const status = b.status || 'Other';
      byStatus[status] = (byStatus[status] || 0) + 1;

      const seriesKey = cleanKey(b.series);
      const tags = Array.isArray(b.tags) ? b.tags : [];
      tags.forEach(tag => {
        const label = String(tag || '').trim();
        if (!label) return;
        // Series names were historically imported into the tags array.
        // If a tag is this book's series value, leave it out of the Tags / tropes chart.
        if (seriesKey && cleanKey(label) === seriesKey) return;
        byTag[label] = (byTag[label] || 0) + 1;
      });
    });

    const pieHtml = typeof window.pie === 'function' ? window.pie(byTag) : '<div class="empty">Not enough data yet.</div>';
    const statusPie = typeof window.pie === 'function' ? window.pie(byStatus) : '';
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
    if (typeof window.renderStats !== 'function') return false;
    window.renderStats = renderCleanStats;
    renderCleanStats();
    return true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        if (install() || tries > 40) clearInterval(timer);
      }, 100);
    });
  } else {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (install() || tries > 40) clearInterval(timer);
    }, 100);
  }
})();
