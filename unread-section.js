/* Bookshelf — Unread section without replacing the app's global render() */
(() => {
  if (window.__unreadSectionInstalled) return;
  window.__unreadSectionInstalled = true;

  const READ_STATUSES = new Set(['read','finished','complete','completed','archived']);
  const CURRENT_STATUSES = new Set(['currently reading']);
  const DNF_STATUSES = new Set(['dnf']);

  function books() {
    return (typeof state !== 'undefined' && Array.isArray(state.books)) ? state.books : [];
  }
  function norm(b) { return String(b?.status || '').trim().toLowerCase(); }

  function renderUnreadOnly() {
    const panel = document.getElementById('bookshelfPanel');
    if (!panel || window.getComputedStyle(panel).display === 'none') return;

    let section = document.getElementById('unreadSection');
    if (!section) {
      section = document.createElement('div');
      section.id = 'unreadSection';
      section.className = 'section';
      panel.appendChild(section);
    }

    const q = (document.getElementById('bookSearch')?.value || '').toLowerCase();
    const sf = String(document.getElementById('statusFilter')?.value || '').trim().toLowerCase();
    const rf = Number(document.getElementById('ratingFilter')?.value || 0);
    const filtered = books().filter(b =>
      (!q || JSON.stringify(b).toLowerCase().includes(q)) &&
      (!sf || norm(b) === sf) &&
      (!rf || Number(b.rating) >= rf)
    );
    const unread = filtered.filter(b => !CURRENT_STATUSES.has(norm(b)) && !DNF_STATUSES.has(norm(b)) && !READ_STATUSES.has(norm(b)));

    section.innerHTML = '<div class="section-title">🌿 Unread</div>' +
      '<div class="section-sub">Books you own or have saved but have not started yet.</div>' +
      (unread.length ? '<div class="shelf">' + unread.map(bookCard).join('') + '</div>' : '<div class="panel empty">No unread books yet. Your TBR pile is behaving itself. 😂📚</div>');
  }

  function schedule() { requestAnimationFrame(() => requestAnimationFrame(renderUnreadOnly)); }

  function install() {
    const nav = document.getElementById('nav');
    if (nav) nav.addEventListener('click', schedule, true);
    ['bookSearch','statusFilter','ratingFilter'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.addEventListener('input', schedule); el.addEventListener('change', schedule); }
    });
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
