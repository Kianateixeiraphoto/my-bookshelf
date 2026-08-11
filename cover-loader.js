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

  function titleScore(a, b) {
    const x = norm(a), y = norm(b);
    if (!x || !y) return 0;
    if (x === y) return 100;
    if (x.includes(y) || y.includes(x)) return 75;
    const aw = new Set(x.split(' ')), bw = new Set(y.split(' '));
    let hits = 0; bw.forEach(w => { if (aw.has(w)) hits++; });
    return Math.round(60 * hits / Math.max(aw.size, bw.size));
  }

  function authorScore(bookAuthor, authors) {
    const a = norm(bookAuthor);
    if (!a || !authors?.length) return 0;
    return Math.max(...authors.map(x => {
      const b = norm(x);
      if (a === b) return 40;
      const last = a.split(' ').pop();
      return b.includes(a) || a.includes(b) || (last && b.includes(last)) ? 25 : 0;
    }));
  }

  async function googleCover(title, author) {
    const q = `intitle:${title}${author ? ` inauthor:${author}` : ''}`;
    const url = `https://www.googleapis.com/books/v1/volumes?${new URLSearchParams({q, maxResults:'8', printType:'books'})}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('Google Books request failed');
    const data = await r.json();
    const items = data.items || [];
    let best = null, bestScore = 0;
    for (const item of items) {
      const info = item.volumeInfo || {};
      const score = titleScore(title, info.title) + authorScore(author, info.authors || []);
      const image = info.imageLinks?.extraLarge || info.imageLinks?.large || info.imageLinks?.medium || info.imageLinks?.small || info.imageLinks?.thumbnail;
      if (image && score > bestScore) { best = image.replace(/^http:/, 'https:'); bestScore = score; }
    }
    return bestScore >= (author ? 65 : 60) ? best : null;
  }

  async function openLibraryCover(title, author) {
    const params = new URLSearchParams({title, limit:'8'});
    if (author) params.set('author', author);
    const r = await fetch(`https://openlibrary.org/search.json?${params}`);
    if (!r.ok) throw new Error('Open Library request failed');
    const data = await r.json();
    const docs = data.docs || [];
    let best = null, bestScore = 0;
    for (const doc of docs) {
      const score = titleScore(title, doc.title) + authorScore(author, doc.author_name || []);
      if (doc.cover_i && score > bestScore) {
        best = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
        bestScore = score;
      }
    }
    return bestScore >= (author ? 55 : 50) ? best : null;
  }

  async function findCover(title, author) {
    const key = keyFor(title, author);
    if (Object.prototype.hasOwnProperty.call(cache, key)) return cache[key];
    let url = null;
    try { url = await googleCover(title, author); } catch {}
    if (!url) { try { url = await openLibraryCover(title, author); } catch {} }
    cache[key] = url || '';
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
    return url;
  }

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
          img.src = url;
          img.onerror = () => { img.remove(); };
          cover.prepend(img);
          found++;
        }
        card.dataset.coverLoaderDone = 'done';
        await sleep(250);
      }
    } finally {
      running = false;
      if (button) { button.disabled = false; button.textContent = found ? `🖼️ Covers found (${found})` : '🖼️ Find Covers'; setTimeout(() => { if (button) button.textContent = '🖼️ Find Covers'; }, 3500); }
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
