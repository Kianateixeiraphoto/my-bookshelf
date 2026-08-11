/* My Bookshelf — automatic cover finder
 * Uses public Google Books data first, then Open Library as a fallback.
 * Covers are displayed on the existing book cards; your reading data is never changed.
 */
(() => {
  const CACHE_KEY = 'my-bookshelf-cover-cache-v1';
  const cache = (() => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; } })();
  let running = false;
  let observer;
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const keyFor = (title, author) => `${norm(title)}||${norm(author)}`;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function titleScore(a, b) { const x = norm(a), y = norm(b); if (!x || !y) return 0; if (x === y) return 100; if (x.includes(y) || y.includes(x)) return 75; const aw = new Set(x.split(' ')), bw = new Set(y.split(' ')); let hits = 0; bw.forEach(w => { if (aw.has(w)) hits++; }); return Math.round(60 * hits / Math.max(aw.size, bw.size)); }
  function authorScore(bookAuthor, authors) { const a = norm(bookAuthor); if (!a || !authors?.length) return 0; return Math.max(...authors.map(x => { const b = norm(x); if (a === b) return 40; const last = a.split(' ').pop(); return b.includes(a) || a.includes(b) || (last && b.includes(last)) ? 25 : 0; })); }
  async function googleCover(title, author) { const q = `intitle:${title}${author ? ` inauthor:${author}` : ''}`; const url = `https://www.googleapis.com/books/v1/volumes?${new URLSearchParams({q, maxResults:'8', printType:'books'})}`; const r = await fetch(url); if (!r.ok) throw new Error('Google Books request failed'); const data = await r.json(); const items = data.items || []; let best = null, bestScore = 0; for (const item of items) { const info = item.volumeInfo || {}; const score = titleScore(title, info.title) + authorScore(author, info.authors || []); const image = info.imageLinks?.extraLarge || info.imageLinks?.large || info.imageLinks?.medium || info.imageLinks?.small || info.imageLinks?.thumbnail; if (image && score > bestScore) { best = image.replace(/^http:/, 'https:'); bestScore = score; } } return bestScore >= (author ? 65 : 60) ? best : null; }
  async function openLibraryCover(title, author) { const params = new URLSearchParams({title, limit:'8'}); if (author) params.set('author', author); const r = await fetch(`https://openlibrary.org/search.json?${params}`); if (!r.ok) throw new Error('Open Library request failed'); const data = await r.json(); const docs = data.docs || []; let best = null, bestScore = 0; for (const doc of docs) { const score = titleScore(title, doc.title) + authorScore(author, doc.author_name || []); if (doc.cover_i && score > bestScore) { best = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`; bestScore = score; } } return bestScore >= (author ? 55 : 50) ? best : null; }
  async function findCover(title, author) { const key = keyFor(title, author); if (Object.prototype.hasOwnProperty.call(cache, key)) return cache[key]; let url = null; try { url = await googleCover(title, author); } catch {} if (!url) { try { url = await openLibraryCover(title, author); } catch {} } cache[key] = url || ''; try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {} return url; }
  function getCards() { return [...document.querySelectorAll('.book')]; }
  async function applyCovers() {
    if (running) return;
    const cards = getCards().filter(card => !card.dataset.coverLoaderDone);
    if (!cards.length) return;
    running = true;
    const button = document.getElementById('findCoversBtn');
    if (button) { button.disabled = true; button.textContent = '🖼️ Finding covers…'; }
    let found = 0;
    try {
      for (const card of cards) {
        card.dataset.coverLoaderDone = 'working';
        const titleEl = card.querySelector('.book-title');
        const authorEl = card.querySelector('.author');
        const cover = card.querySelector('.cover');
        const title = titleEl?.textContent?.trim() || '';
        const author = authorEl?.textContent?.trim() || '';
        if (!title || !cover) { card.dataset.coverLoaderDone = 'done'; continue; }
        if (cover.querySelector('img')) { card.dataset.coverLoaderDone = 'done'; continue; }
        const url = await findCover(title, author);
        if (url) {
          const img = document.createElement('img');
          img.alt = `${title} cover`;
          img.loading = 'lazy';
          img.referrerPolicy = 'no-referrer';
          img.onload = () => {
            cover.querySelector('.cover-placeholder')?.remove();
            cover.classList.add('has-cover');
          };
          img.onerror = () => { img.remove(); };
          img.src = url;
          cover.prepend(img);
          found++;
        }
        card.dataset.coverLoaderDone = 'done';
        await sleep(250);
      }
    } finally {
      running = false;
      if (button) {
        button.disabled = false;
        button.textContent = found ? `🖼️ Covers found (${found})` : '🖼️ Find Covers';
        setTimeout(() => { if (button) button.textContent = '🖼️ Find Covers'; }, 3500);
      }
    }
  }
  function addButton() {
    if (document.getElementById('findCoversBtn')) return;
    const actions = document.querySelector('header .actions');
    if (!actions) return;
    const b = document.createElement('button');
    b.className = 'btn';
    b.id = 'findCoversBtn';
    b.textContent = '🖼️ Find Covers';
    b.title = 'Find cover art for books on your bookshelf';
    b.onclick = () => { getCards().forEach(c => { if (!c.querySelector('.cover img')) delete c.dataset.coverLoaderDone; }); applyCovers(); };
    actions.insertBefore(b, actions.firstChild);
  }
  function start() {
    addButton();
    applyCovers();
    if (!observer) {
      observer = new MutationObserver(() => { addButton(); applyCovers(); });
      const target = document.getElementById('bookshelfPanel') || document.body;
      observer.observe(target, {childList:true, subtree:true});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* Route Edit and + Add Book to the restored detailed editor. */
(() => { const installEditorRouting = () => { try { window.editBook = function(id) { const book = state.books.find(b => b.id === id); if (book && typeof window.addBook === 'function') window.addBook(book); }; const addBtn = document.getElementById('addBookBtn'); if (addBtn && typeof window.addBook === 'function') addBtn.onclick = () => window.addBook(); } catch (e) { console.warn('Detailed editor routing could not be installed yet', e); } }; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installEditorRouting); else installEditorRouting(); setTimeout(installEditorRouting, 0); })();

/* EDIT-BOOK-BOTTOM-UI: fix the notes/review area and bottom action bar. */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    /* Make the detailed editor wider and keep only the form itself scrollable. */
    #modal .modal-card {
      width: min(900px, 100%);
      max-height: 92vh;
      overflow: hidden;
      padding: 24px;
    }
    #modal #bookForm {
      max-height: calc(92vh - 100px) !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      padding: 2px 10px 0 0 !important;
      align-content: start;
    }
    #modal #bookForm > label {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 6px;
      line-height: 1.2;
      min-width: 0;
    }
    #modal #bookForm > label.wide {
      grid-column: 1 / -1;
      width: 100%;
    }
    #modal #bookForm > label > input,
    #modal #bookForm > label > select {
      width: 100%;
      min-width: 0;
    }
    #modal #bookForm > label.wide textarea {
      width: 100% !important;
      min-width: 0;
      min-height: 150px;
      height: 170px;
      display: block;
      resize: vertical;
      line-height: 1.45;
    }
    #modal #bookForm > .wide.actions {
      grid-column: 1 / -1;
      width: 100%;
      margin-top: 2px;
      padding: 14px 0 2px;
      border-top: 1px solid var(--line);
      background: #fffafa;
      position: sticky;
      bottom: 0;
      z-index: 3;
      justify-content: flex-end;
    }
    #modal #bookForm > .wide.actions .btn {
      min-width: 110px;
    }
    @media (max-width: 600px) {
      #modal { padding: 10px; }
      #modal .modal-card { width: 100%; max-height: 94vh; padding: 18px; border-radius: 20px; }
      #modal #bookForm { grid-template-columns: 1fr !important; max-height: calc(94vh - 90px) !important; }
      #modal #bookForm > label.wide { grid-column: auto; }
      #modal #bookForm > .wide.actions { grid-column: auto; }
      #modal #bookForm > label.wide textarea { height: 150px; }
    }
  `;
  document.head.appendChild(style);
})();

/* COVER-CARD-POLISH: keep real book covers intact and remove the fallback icon once a cover loads. */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    .book .cover {
      background: linear-gradient(145deg,#ffeaf2,#f9e9f2);
      display:flex;
      align-items:center;
      justify-content:center;
      overflow:hidden;
    }
    .book .cover img {
      width:100%;
      height:100%;
      object-fit:contain !important;
      object-position:center;
      display:block;
      background:#fdebf2;
    }
    .book .cover.has-cover .cover-placeholder { display:none; }
  `;
  document.head.appendChild(style);
})();
