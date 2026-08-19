/* Bookshelf — stable four-section renderer */
(() => {
  const READ_STATUSES = new Set(['read','finished','complete','completed','archived']);
  const CURRENT_STATUSES = new Set(['currently reading']);
  const DNF_STATUSES = new Set(['dnf']);

  function install() {
    if (window.__fourShelfSectionsInstalled || typeof window.render !== 'function') return;
    window.__fourShelfSectionsInstalled = true;

    const originalRender = window.render;

    function bookshelfIsVisible() {
      const panel = document.getElementById('bookshelfPanel');
      if (!panel) return false;
      const style = window.getComputedStyle(panel);
      return style.display !== 'none' && panel.offsetParent !== null;
    }

    function enhanceBookshelf() {
      if (!bookshelfIsVisible()) return;

      const books = (typeof state !== 'undefined' && Array.isArray(state.books)) ? state.books : [];
      const norm = b => String(b.status || '').trim().toLowerCase();
      const q = ($('bookSearch')?.value || '').toLowerCase();
      const sf = String($('statusFilter')?.value || '').trim().toLowerCase();
      const rf = Number($('ratingFilter')?.value || 0);
      const filtered = books.filter(b =>
        (!q || JSON.stringify(b).toLowerCase().includes(q)) &&
        (!sf || norm(b) === sf) &&
        (!rf || Number(b.rating) >= rf)
      );

      const current = filtered.filter(b => norm(b) === 'currently reading');
      const unread = filtered.filter(b => !['currently reading','dnf','read','finished','complete','completed','archived'].includes(norm(b)));
      const read = filtered.filter(b => ['read','finished','complete','completed','archived'].includes(norm(b)));
      const dnf = filtered.filter(b => norm(b) === 'dnf');

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
      if (panel && unreadSection.parentNode !== panel) panel.appendChild(unreadSection);
    }

    // Keep the app's original render function in charge of every tab.
    // Only add the four bookshelf sections when the Bookshelf panel is visible.
    window.render = function (...args) {
      const result = originalRender.apply(this, args);
      try { enhanceBookshelf(); } catch (e) { console.warn('Bookshelf section enhancement failed', e); }
      return result;
    };

    window.renderFourSections = enhanceBookshelf;
    window.render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
