/* Bookshelf — stable four-section renderer */
(() => {
  const READ_STATUSES = new Set(['read','finished','complete','completed','archived']);
  const CURRENT_STATUSES = new Set(['currently reading']);
  const DNF_STATUSES = new Set(['dnf']);
  const UNREAD_STATUSES = new Set(['unread','want to read','tbr']);

  function install() {
    if (window.__fourShelfSectionsInstalled || typeof window.render !== 'function') return;
    window.__fourShelfSectionsInstalled = true;

    const originalRender = window.render;

    function renderFourSections() {
      originalRender();
      const books = Array.isArray(state.books) ? state.books : [];
      const norm = b => String(b.status || '').trim().toLowerCase();
      const q = ($('bookSearch')?.value || '').toLowerCase();
      const sf = String($('statusFilter')?.value || '').trim().toLowerCase();
      const rf = Number($('ratingFilter')?.value || 0);
      const filtered = books.filter(b =>
        (!q || JSON.stringify(b).toLowerCase().includes(q)) &&
        (!sf || norm(b) === sf) &&
        (!rf || Number(b.rating) >= rf)
      );

      const current = filtered.filter(b => CURRENT_STATUSES.has(norm(b)));
      const unread = filtered.filter(b => !CURRENT_STATUSES.has(norm(b)) && !DNF_STATUSES.has(norm(b)) && !READ_STATUSES.has(norm(b)));
      const read = filtered.filter(b => READ_STATUSES.has(norm(b)));
      const dnf = filtered.filter(b => DNF_STATUSES.has(norm(b)));

      let unreadSection = document.getElementById('unreadSection');
      if (!unreadSection) {
        unreadSection = document.createElement('div');
        unreadSection.id = 'unreadSection';
        unreadSection.className = 'section';
      }

      const fill = (el, title, subtitle, items, emptyText) => {
        if (!el) return;
        el.innerHTML = '<div class="section-title">'+title+'</div><div class="section-sub">'+subtitle+'</div>' +
          (items.length ? '<div class="shelf">'+items.map(bookCard).join('')+'</div>' : '<div class="panel empty">'+emptyText+'</div>');
      };

      fill(document.getElementById('currentlySection'), '📖 Currently Reading', 'Books you have started and are actively reading. 💕', current, 'Nothing currently reading. Time to pick a new victim. 😂📚');
      fill(unreadSection, '🌿 Unread', 'Books you own or have saved but have not started yet.', unread, 'No unread books yet. Your TBR pile is behaving itself. 😂📚');
      fill(document.getElementById('archivedSection'), '📚 Already Read', 'Finished books live here. Your completed reading shelf. ✨', read, 'No already-read books yet.');
      fill(document.getElementById('dnfSection'), '🚫 DNF — Did Not Finish', 'Books you decided not to finish live here. No judgment. 💕', dnf, 'No DNF books yet.');

      const panel = document.getElementById('bookshelfPanel');
      if (panel && unreadSection.parentNode !== panel) {
        panel.appendChild(unreadSection);
      }
    }

    window.render = renderFourSections;
    window.renderFourSections = renderFourSections;
    renderFourSections();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
