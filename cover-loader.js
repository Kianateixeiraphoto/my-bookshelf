/* My Bookshelf — automatic + per-book cover finder
 * Uses public Google Books data first, then Open Library as a fallback.
 * Covers can be manually chosen/approved and kept across refreshes.
 */
(() => {
  const CACHE_KEY = 'my-bookshelf-cover-cache-v1';
  const APPROVED_KEY = 'my-bookshelf-approved-covers-v1';
  const cache = (() => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; } })();
  const approved = (() => { try { return JSON.parse(localStorage.getItem(APPROVED_KEY) || '{}'); } catch { return {}; } })();
  let running = false;
  let observer;
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const keyFor = (title, author) => `${norm(title)}||${norm(author)}`;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const escHtml = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function titleScore(a, b) {
    const x = norm(a), y = norm(b);
    if (!x || !y) return 0;
    if (x === y) return 100;
    if (x.includes(y) || y.includes(x)) return 75;
    const aw = new Set(x.split(' ')), bw = new Set(y.split(' '));
    let hits = 0;
    bw.forEach(w => { if (aw.has(w)) hits++; });
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

  async function googleCandidates(title, author) {
    const q = `intitle:${title}${author ? ` inauthor:${author}` : ''}`;
    const url = `https://www.googleapis.com/books/v1/volumes?${new URLSearchParams({q, maxResults:'10', printType:'books'})}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('Google Books request failed');
    const data = await r.json();
    return (data.items || []).map(item => {
      const info = item.volumeInfo || {};
      const image = info.imageLinks?.extraLarge || info.imageLinks?.large || info.imageLinks?.medium || info.imageLinks?.small || info.imageLinks?.thumbnail;
      if (!image) return null;
      const score = titleScore(title, info.title) + authorScore(author, info.authors || []);
      return { url:image.replace(/^http:/,'https:'), title:info.title || '', author:(info.authors || []).join(', '), score, source:'Google Books' };
    }).filter(x => x && x.score >= (author ? 45 : 40));
  }

  async function openLibraryCandidates(title, author) {
    const params = new URLSearchParams({title, limit:'10'});
    if (author) params.set('author', author);
    const r = await fetch(`https://openlibrary.org/search.json?${params}`);
    if (!r.ok) throw new Error('Open Library request failed');
    const data = await r.json();
    return (data.docs || []).map(doc => {
      if (!doc.cover_i) return null;
      const score = titleScore(title, doc.title) + authorScore(author, doc.author_name || []);
      return { url:`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`, title:doc.title || '', author:(doc.author_name || []).join(', '), score, source:'Open Library' };
    }).filter(x => x && x.score >= (author ? 40 : 35));
  }

  async function getCandidates(title, author) {
    const key = keyFor(title, author);
    const all = [];
    try { all.push(...await googleCandidates(title, author)); } catch {}
    try { all.push(...await openLibraryCandidates(title, author)); } catch {}
    const seen = new Set();
    return all.sort((a,b) => b.score - a.score).filter(x => {
      if (seen.has(x.url)) return false;
      seen.add(x.url);
      return true;
    }).slice(0, 8).map((x, i) => ({...x, index:i}));
  }

  async function findCover(title, author) {
    const key = keyFor(title, author);
    if (Object.prototype.hasOwnProperty.call(approved, key)) return approved[key];
    if (Object.prototype.hasOwnProperty.call(cache, key)) return cache[key];
    const candidates = await getCandidates(title, author);
    const url = candidates[0]?.url || null;
    cache[key] = url || '';
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
    return url;
  }

  function saveApproved(key, url) {
    if (!url) return;
    approved[key] = url;
    try { localStorage.setItem(APPROVED_KEY, JSON.stringify(approved)); } catch {}
  }

  function getCards() { return [...document.querySelectorAll('.book')]; }

  function addApprovalButton(cover, key, url) {
    if (!url || cover.querySelector('.cover-approve')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cover-approve btn';
    b.textContent = Object.prototype.hasOwnProperty.call(approved, key) ? '✓ Saved' : '✓ Keep Cover';
    b.title = 'Keep this cover on your bookshelf';
    b.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:4;padding:5px 8px;font-size:10px;background:rgba(255,250,252,.94);backdrop-filter:blur(4px);';
    b.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      saveApproved(key, url);
      b.textContent = '✓ Saved';
      b.disabled = true;
    };
    cover.appendChild(b);
  }

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
        const key = keyFor(title, author);
        if (!title || !cover) { card.dataset.coverLoaderDone = 'done'; continue; }
        const existingImg = cover.querySelector('img');
        if (existingImg) {
          const existingUrl = existingImg.currentSrc || existingImg.src;
          if (existingUrl && Object.prototype.hasOwnProperty.call(approved, key)) addApprovalButton(cover, key, approved[key]);
          card.dataset.coverLoaderDone = 'done';
          continue;
        }
        const url = await findCover(title, author);
        if (url) {
          const img = document.createElement('img');
          img.alt = `${title} cover`;
          img.loading = 'lazy';
          img.referrerPolicy = 'no-referrer';
          img.onload = () => {
            cover.querySelector('.cover-placeholder')?.remove();
            cover.classList.add('has-cover');
            addApprovalButton(cover, key, url);
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

  /* Per-book cover search inside Edit Book. */
  let editorCandidates = [];
  function installEditorCoverTools() {
    const form = document.getElementById('bookForm');
    if (!form || form.dataset.coverToolsInstalled === '1') return;
    const coverInput = form.querySelector('[name="cover"]');
    if (!coverInput) return;
    form.dataset.coverToolsInstalled = '1';

    const wrap = document.createElement('div');
    wrap.className = 'editor-cover-tools wide';
    wrap.innerHTML = `
      <div class="editor-cover-head">
        <div><b>🖼️ Cover Finder</b><span>Search for this book only — you choose which cover to use.</span></div>
        <button type="button" class="btn" id="editorFindCoverBtn">🖼️ Find Cover</button>
      </div>
      <div id="editorCoverStatus" class="editor-cover-status"></div>
      <div id="editorCoverChoices" class="editor-cover-choices"></div>`;
    coverInput.insertAdjacentElement('afterend', wrap);

    const status = wrap.querySelector('#editorCoverStatus');
    const choices = wrap.querySelector('#editorCoverChoices');
    const findBtn = wrap.querySelector('#editorFindCoverBtn');

    const showCurrent = () => {
      choices.innerHTML = '';
      if (coverInput.value) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'cover-choice selected';
        item.innerHTML = `<img src="${escHtml(coverInput.value)}" alt="Current cover"><span>Current cover</span>`;
        item.onclick = () => { coverInput.focus(); };
        choices.appendChild(item);
      }
    };
    showCurrent();

    findBtn.onclick = async () => {
      const title = form.querySelector('[name="title"]')?.value?.trim() || '';
      const author = form.querySelector('[name="author"]')?.value?.trim() || '';
      if (!title) { status.textContent = 'Add a book title first. 💕'; return; }
      findBtn.disabled = true;
      findBtn.textContent = '🔎 Searching…';
      status.textContent = `Looking for “${title}”${author ? ` by ${author}` : ''}…`;
      choices.innerHTML = '';
      try {
        editorCandidates = await getCandidates(title, author);
        if (!editorCandidates.length) {
          status.textContent = 'No good matches found. Try adjusting the title or author, then search again.';
          return;
        }
        status.textContent = `${editorCandidates.length} cover options found — click the one you want. 💕`;
        editorCandidates.forEach((candidate, index) => {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'cover-choice';
          item.innerHTML = `<img src="${escHtml(candidate.url)}" alt="${escHtml(candidate.title)}"><span>${escHtml(candidate.title || 'Cover '+(index+1))}</span><small>${escHtml(candidate.author || candidate.source)}</small>`;
          item.onclick = () => {
            coverInput.value = candidate.url;
            coverInput.dispatchEvent(new Event('input', {bubbles:true}));
            coverInput.dispatchEvent(new Event('change', {bubbles:true}));
            choices.querySelectorAll('.cover-choice').forEach(x => x.classList.remove('selected'));
            item.classList.add('selected');
            status.textContent = '✓ Cover selected. Save the book to keep it. 💕';
          };
          choices.appendChild(item);
        });
      } catch (e) {
        console.error(e);
        status.textContent = 'I could not search for covers right now. You can still paste a cover URL manually.';
      } finally {
        findBtn.disabled = false;
        findBtn.textContent = '🖼️ Find Cover';
      }
    };
  }

  function addEditorStyles() {
    if (document.getElementById('editorCoverFinderStyles')) return;
    const style = document.createElement('style');
    style.id = 'editorCoverFinderStyles';
    style.textContent = `
      #bookForm .editor-cover-tools{grid-column:1/-1;border:1px solid var(--line);border-radius:16px;background:#fffafb;padding:12px;margin-top:-2px}
      #bookForm .editor-cover-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
      #bookForm .editor-cover-head>div{display:flex;flex-direction:column;gap:3px}
      #bookForm .editor-cover-head b{color:#684352;font-size:13px}
      #bookForm .editor-cover-head span,#bookForm .editor-cover-status{font-size:11px;color:var(--muted)}
      #bookForm .editor-cover-status{margin-top:8px;min-height:16px}
      #bookForm .editor-cover-choices{display:flex;gap:9px;overflow-x:auto;padding:8px 2px 3px}
      #bookForm .cover-choice{flex:0 0 82px;width:82px;border:1px solid var(--line);border-radius:11px;background:#fff8fb;padding:5px;color:var(--ink);cursor:pointer;text-align:left}
      #bookForm .cover-choice:hover{border-color:var(--accent);transform:translateY(-1px)}
      #bookForm .cover-choice.selected{border:2px solid var(--accent);background:#fde7ef}
      #bookForm .cover-choice img{display:block;width:70px;height:96px;object-fit:contain;background:#fcecf3;border-radius:7px;margin:0 auto 5px}
      #bookForm .cover-choice span,#bookForm .cover-choice small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px}
      #bookForm .cover-choice small{color:var(--muted);margin-top:2px}
      @media(max-width:600px){#bookForm .editor-cover-tools{grid-column:1}.editor-cover-head{align-items:stretch!important}.editor-cover-head .btn{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function installEditorRouting() {
    try {
      window.editBook = function(id) {
        const book = state.books.find(b => b.id === id);
        if (book && typeof window.addBook === 'function') window.addBook(book);
      };
      const addBtn = document.getElementById('addBookBtn');
      if (addBtn && typeof window.addBook === 'function') addBtn.onclick = () => window.addBook();
    } catch (e) { console.warn('Detailed editor routing could not be installed yet', e); }
  }

  function start() {
    addEditorStyles();
    addButton();
    installEditorCoverTools();
    installEditorRouting();
    applyCovers();
    if (!observer) {
      observer = new MutationObserver(() => {
        addButton();
        addEditorStyles();
        installEditorCoverTools();
        installEditorRouting();
        applyCovers();
      });
      const target = document.body;
      observer.observe(target, {childList:true, subtree:true});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* EDIT-BOOK-BOTTOM-UI: fix the notes/review area and bottom action bar. */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #modal .modal-card { width: min(900px, 100%); max-height: 92vh; overflow: hidden; padding: 24px; }
    #modal #bookForm { max-height: calc(92vh - 100px) !important; overflow-x: hidden !important; overflow-y: auto !important; padding: 2px 10px 0 0 !important; align-content: start; }
    #modal #bookForm > label { display:flex; flex-direction:column; align-items:stretch; gap:6px; line-height:1.2; min-width:0; }
    #modal #bookForm > label.wide { grid-column:1/-1; width:100%; }
    #modal #bookForm > label > input,#modal #bookForm > label > select { width:100%; min-width:0; }
    #modal #bookForm > label.wide textarea { width:100% !important; min-width:0; min-height:150px; height:170px; display:block; resize:vertical; line-height:1.45; }
    #modal #bookForm > .wide.actions { grid-column:1/-1; width:100%; margin-top:2px; padding:14px 0 2px; border-top:1px solid var(--line); background:#fffafa; position:sticky; bottom:0; z-index:3; justify-content:flex-end; }
    #modal #bookForm > .wide.actions .btn { min-width:110px; }
    @media (max-width:600px) { #modal{padding:10px} #modal .modal-card{width:100%;max-height:94vh;padding:18px;border-radius:20px} #modal #bookForm{grid-template-columns:1fr !important;max-height:calc(94vh - 90px) !important} #modal #bookForm > label.wide,#modal #bookForm > .wide.actions{grid-column:auto} #modal #bookForm > label.wide textarea{height:150px} }
  `;
  document.head.appendChild(style);
})();

/* COVER-CARD-POLISH: keep real book covers intact and remove the fallback icon once a cover loads. */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    .book .cover { background:linear-gradient(145deg,#ffeaf2,#f9e9f2); display:flex; align-items:center; justify-content:center; overflow:hidden; }
    .book .cover img { width:100%; height:100%; object-fit:contain !important; object-position:center; display:block; background:#fdebf2; }
    .book .cover.has-cover .cover-placeholder { display:none; }
    .book .cover .cover-approve:hover { transform:translateY(-1px); border-color:var(--accent); }
    .book .cover .cover-approve:disabled { opacity:.9; cursor:default; }
  `;
  document.head.appendChild(style);
})();