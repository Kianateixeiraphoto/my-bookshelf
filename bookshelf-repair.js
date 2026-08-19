/* My Bookshelf — final bookshelf recovery layer */
(() => {
  const READ = new Set(['read','finished','complete','completed','archived']);
  const CURRENT = new Set(['currently reading']);
  const DNF = new Set(['dnf']);
  const UNREAD = new Set(['unread','want to read','to read','tbr','not started']);

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stars = value => {
    const n = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
    return n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '—';
  };

  function card(b = {}) {
    const tags = Array.isArray(b.tags) ? b.tags : (b.tags ? [b.tags] : []);
    const id = escapeHtml(b.id || '');
    const cover = typeof b.cover === 'string' ? b.cover : '';
    return `<article class="book"><div class="cover">${cover ? `<img src="${escapeHtml(cover)}" alt="">` : '<div class="cover-placeholder">📖</div>'}<button class="heart" onclick="toggleFav('${id}')">${b.favorite ? '♥' : '♡'}</button></div><div class="book-body"><div class="book-title">${escapeHtml(b.title || b.name || 'Untitled')}</div><div class="author">${escapeHtml(b.author || 'Unknown author')}</div><div class="chips">${tags.slice(0,4).map(t => `<span class="chip">${escapeHtml(t)}</span>`).join('')}</div><div class="meta">${escapeHtml(b.status || '')} · ${b.rating ? stars(b.rating) : 'No rating'}<br>📄 ${Number(b.pages || 0).toLocaleString()} pages</div><div class="book-actions"><button class="btn" onclick="editBook('${id}')">Edit</button><button class="btn" onclick="deleteBook('${id}')">Delete</button></div></div></article>`;
  }

  function install() {
    if (window.__bookshelfRepairInstalled || typeof window.render !== 'function') return;
    window.__bookshelfRepairInstalled = true;
    const previousRender = window.render;

    window.render = function repairedRender() {
      try { previousRender(); } catch (e) { console.warn('Bookshelf recovery handled a render error:', e); }

      let books = [];
      try { books = (typeof state !== 'undefined' && Array.isArray(state.books)) ? state.books : []; } catch (_) {}
      const norm = b => String(b?.status || '').trim().toLowerCase();
      const search = (document.getElementById('bookSearch')?.value || '').toLowerCase();
      const status = String(document.getElementById('statusFilter')?.value || '').trim().toLowerCase();
      const rating = Number(document.getElementById('ratingFilter')?.value || 0);
      const filtered = books.filter(b => {
        let text = '';
        try { text = JSON.stringify(b).toLowerCase(); } catch (_) {}
        return (!search || text.includes(search)) && (!status || norm(b) === status) && (!rating || Number(b?.rating) >= rating);
      });

      const sections = {
        current: filtered.filter(b => CURRENT.has(norm(b))),
        unread: filtered.filter(b => UNREAD.has(norm(b))),
        read: filtered.filter(b => READ.has(norm(b))),
        dnf: filtered.filter(b => DNF.has(norm(b)))
      };

      const panel = document.getElementById('bookshelfPanel');
      if (!panel) return;
      let unreadSection = document.getElementById('unreadSection');
      if (!unreadSection) { unreadSection = document.createElement('div'); unreadSection.id = 'unreadSection'; unreadSection.className = 'section'; }
      const els = [document.getElementById('currentlySection'), unreadSection, document.getElementById('archivedSection'), document.getElementById('dnfSection')];
      els.forEach(el => { if (el) panel.appendChild(el); });

      const fill = (el, title, subtitle, items, empty) => {
        if (!el) return;
        const html = items.map(card).join('');
        el.innerHTML = `<div class="section-title">${title}</div><div class="section-sub">${subtitle}</div>${html ? `<div class="shelf">${html}</div>` : `<div class="panel empty">${empty}</div>`}`;
      };
      fill(document.getElementById('currentlySection'), '📖 Currently Reading', 'Books you have started and are actively reading. 💕', sections.current, 'Nothing currently reading. Time to pick a new victim. 😂📚');
      fill(unreadSection, '🌿 Unread', 'Books you own or have saved but have not started yet.', sections.unread, 'No unread books yet. Your TBR pile is behaving itself. 😂📚');
      fill(document.getElementById('archivedSection'), '📚 Already Read', 'Finished books live here. Your completed reading shelf. ✨', sections.read, 'No already-read books yet.');
      fill(document.getElementById('dnfSection'), '🚫 DNF — Did Not Finish', 'Books you decided not to finish live here. No judgment. 💕', sections.dnf, 'No DNF books yet.');
    };

    window.render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
