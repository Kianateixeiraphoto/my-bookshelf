/* My Bookshelf — Reading Stats V2
 * Personal Reading Year dashboard: pretty first, useful second.
 * Uses the existing books JSON in Supabase; no schema changes required.
 */
(() => {
  if (window.__readingStatsV2Installed) return;
  window.__readingStatsV2Installed = true;

  const escHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const clean = value => String(value ?? '').trim().toLowerCase();
  const booksFromState = () => (typeof state !== 'undefined' && Array.isArray(state.books)) ? state.books : [];
  const readBooks = books => books.filter(b => clean(b.status) === 'read');

  function finishedDate(book) {
    const raw = book.finished || book.dateFinished || book.completed || '';
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function yearsAvailable(books) {
    const years = new Set();
    books.forEach(book => {
      const d = finishedDate(book);
      if (d && clean(book.status) === 'read') years.add(d.getFullYear());
    });
    years.add(new Date().getFullYear());
    return [...years].sort((a,b) => b-a);
  }

  function coverHtml(book, className='stats-book-cover') {
    const cover = String(book.cover || '').trim();
    if (cover) return `<img class="${className}" src="${escHtml(cover)}" alt="" loading="lazy">`;
    return `<div class="${className} stats-cover-placeholder">📖</div>`;
  }

  function countBy(books, getter) {
    const map = {};
    books.forEach(book => {
      const value = getter(book);
      if (!value) return;
      map[value] = (map[value] || 0) + 1;
    });
    return map;
  }

  function topEntries(map, limit=5) {
    return Object.entries(map).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0, limit);
  }

  function tagCounts(books) {
    const map = {};
    books.forEach(book => {
      const seen = new Set();
      let tags = book.tags;
      if (typeof tags === 'string') {
        try { tags = JSON.parse(tags); } catch (_) { tags = tags.split(','); }
      }
      (Array.isArray(tags) ? tags : []).forEach(tag => {
        const value = String(tag || '').trim();
        const key = clean(value);
        if (value && !seen.has(key)) { map[value] = (map[value] || 0) + 1; seen.add(key); }
      });
    });
    return map;
  }

  function monthCounts(books, year) {
    const counts = Array(12).fill(0);
    books.forEach(book => {
      const d = finishedDate(book);
      if (d && d.getFullYear() === year) counts[d.getMonth()] += 1;
    });
    return counts;
  }

  function miniBars(values) {
    const max = Math.max(1, ...values);
    return `<div class="stats-month-bars">${values.map((value, i) => {
      const height = value ? Math.max(8, Math.round(value / max * 100)) : 3;
      return `<div class="stats-month-col"><div class="stats-bar" style="height:${height}%" title="${value} book${value === 1 ? '' : 's'}"></div><span>${['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span><b>${value || ''}</b></div>`;
    }).join('')}</div>`;
  }

  function progressBar(value, max) {
    const pct = max ? Math.min(100, Math.round(value / max * 100)) : 0;
    return `<div class="stats-progress"><span style="width:${pct}%"></span></div>`;
  }

  function bookStrip(books) {
    if (!books.length) return '<div class="stats-empty">Nothing here yet — this section will fill itself in as you read. 💕</div>';
    return `<div class="stats-book-strip">${books.slice(0, 8).map(book => `
      <div class="stats-mini-book" title="${escHtml(book.title || 'Untitled')}">
        ${coverHtml(book)}
        <div class="stats-mini-title">${escHtml(book.title || 'Untitled')}</div>
        ${book.rating ? `<div class="stats-mini-rating">${'★'.repeat(Math.max(0, Math.min(5, Number(book.rating))))} <span>${escHtml(book.rating)}</span></div>` : ''}
      </div>`).join('')}</div>`;
  }

  function listRows(entries, total) {
    if (!entries.length) return '<div class="stats-empty">No data yet.</div>';
    return entries.map(([name, count]) => `<div class="stats-list-row"><div class="stats-list-label"><span>${escHtml(name)}</span><b>${count}</b></div>${progressBar(count, total)}</div>`).join('');
  }


  function calendarHtml(books, year) { const dated=books.filter(b=>finishedDate(b)); const latest=dated.length?[...dated].sort((a,b)=>finishedDate(b)-finishedDate(a))[0]:null; const m=latest?finishedDate(latest).getMonth():new Date().getMonth(), y=latest?finishedDate(latest).getFullYear():year; const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate(),byDay={}; dated.forEach(b=>{const d=finishedDate(b);if(d&&d.getFullYear()===y&&d.getMonth()===m)(byDay[d.getDate()]||=[]).push(b)}); let cells=Array(first).fill('<div class="stats-cal-day blank"></div>').join(''); for(let d=1;d<=days;d++){const items=byDay[d]||[];cells+='<div class="stats-cal-day"><b>'+d+'</b><div>'+items.map(book=>book.cover?'<img src="'+escHtml(book.cover)+'" title="'+escHtml(book.title||'')+'" alt="">':'<span title="'+escHtml(book.title||'')+'">📖</span>').join('')+'</div></div>'} return '<div class="stats-cal-title">'+new Date(y,m,1).toLocaleString('en-US',{month:'long',year:'numeric'})+'</div><div class="stats-cal-week"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div><div class="stats-calendar">'+cells+'</div>'; }

  function renderStatsV2() {
    const panel = document.getElementById('statsPanel');
    if (!panel) return;
    const books = booksFromState();
    const allRead = readBooks(books);
    const years = yearsAvailable(books);
    const storedYear = Number(panel.dataset.statsYear);
    const year = years.includes(storedYear) ? storedYear : years[0];
    panel.dataset.statsYear = String(year);
    const yearRead = allRead.filter(book => {
      const d = finishedDate(book);
      return d && d.getFullYear() === year;
    });
    const rated = yearRead.filter(book => Number(book.rating) > 0);
    const pages = yearRead.reduce((sum, book) => sum + (Number(book.pages) || 0), 0);
    const avg = rated.length ? (rated.reduce((sum, book) => sum + Number(book.rating), 0) / rated.length).toFixed(2) : '—';
    const fiveStars = yearRead.filter(book => Number(book.rating) === 5);
    const favorites = yearRead.filter(book => Boolean(book.favorite));
    const longest = [...yearRead].sort((a,b) => (Number(b.pages)||0) - (Number(a.pages)||0))[0];
    const shortest = [...yearRead].filter(b => Number(b.pages) > 0).sort((a,b) => Number(a.pages)-Number(b.pages))[0];
    const authors = topEntries(countBy(yearRead, b => String(b.author || '').trim()), 5);
    const tags = topEntries(tagCounts(yearRead), 6);
    const months = monthCounts(allRead, year);
    const bestMonthCount = Math.max(0, ...months);
    const bestMonthIndex = months.indexOf(bestMonthCount);
    const bestMonth = bestMonthCount ? new Date(year, bestMonthIndex, 1).toLocaleString('en-US', {month:'long'}) : '—';
    const currentlyReading = books.filter(b => clean(b.status) === 'currently reading' || clean(b.status) === 'reading');
    const tbr = books.filter(b => ['tbr','to be read','want to read'].includes(clean(b.status)));
    const allFavorites = books.filter(b => Boolean(b.favorite));

    panel.innerHTML = `
      <div class="stats-v2-head">
        <div><div class="stats-kicker">✨ YOUR READING YEAR</div><h2>My ${year} Reading Year</h2><p>A little look at everything you read, loved, and survived. 📚💕</p></div>
        <label class="stats-year-select">Year <select id="statsYearSelect">${years.map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
      </div>
      <div class="stats-hero-grid">
        <div class="stats-big-card"><span>📚</span><b>${yearRead.length}</b><small>Books Read</small></div>
        <div class="stats-big-card"><span>📖</span><b>${pages.toLocaleString()}</b><small>Pages Read</small></div>
        <div class="stats-big-card"><span>⭐</span><b>${avg}</b><small>Average Rating</small></div>
        <div class="stats-big-card"><span>💖</span><b>${fiveStars.length}</b><small>5-Star Reads</small></div>
      </div>
      <section class="panel stats-feature stats-calendar-full"><h3>🗓️ Reading Calendar</h3><p class="stats-section-copy">Every finished book on the day you completed it.</p>${calendarHtml(yearRead, year)}</section>\n      <div class="stats-feature-grid">
        <section class="panel stats-feature"><h3>📅 My Reading Year</h3><p class="stats-section-copy">Books finished each month</p>${miniBars(months)}<div class="stats-highlight">${bestMonthCount ? `<b>${bestMonth}</b> was your biggest reading month with <b>${bestMonthCount}</b> book${bestMonthCount === 1 ? '' : 's'}.` : 'Start finishing books to see your year take shape. ✨'}</div></section>
        <section class="panel stats-feature"><h3>📌 Where I’m At</h3><p class="stats-section-copy">Your bookshelf right now</p><div class="stats-status-stack"><div><span>📖 Currently Reading</span><b>${currentlyReading.length}</b></div><div><span>🛒 On My TBR</span><b>${tbr.length}</b></div><div><span>💗 Favorites</span><b>${allFavorites.length}</b></div></div></section>
      </div>
      <div class="stats-feature-grid">
        <section class="panel stats-feature"><h3>💕 My Favorite Reads</h3><p class="stats-section-copy">Your five-star books from ${year}</p>${bookStrip(fiveStars)}</section>
        <section class="panel stats-feature"><h3>✍️ Authors I Read Most</h3><p class="stats-section-copy">Most books finished by one author</p>${listRows(authors, authors[0]?.[1] || 1)}</section>
      </div>
      <div class="stats-feature-grid">
        <section class="panel stats-feature"><h3>🏷️ My Reading Vibe</h3><p class="stats-section-copy">Your most-used tags this year</p>${listRows(tags, tags[0]?.[1] || 1)}</section>
        <section class="panel stats-feature"><h3>✨ Little Things</h3><p class="stats-section-copy">Because numbers should be fun</p><div class="stats-fun-grid">
          <div><span>📚 Longest</span><b>${escHtml(longest?.title || '—')}</b><small>${longest?.pages ? `${Number(longest.pages).toLocaleString()} pages` : '—'}</small></div>
          <div><span>💨 Shortest</span><b>${escHtml(shortest?.title || '—')}</b><small>${shortest?.pages ? `${Number(shortest.pages).toLocaleString()} pages` : '—'}</small></div>
          <div><span>💖 Favorites</span><b>${favorites.length}</b><small>this year</small></div>
          <div><span>⭐ 5-Star Rate</span><b>${yearRead.length ? Math.round(fiveStars.length / yearRead.length * 100) : 0}%</b><small>of books read</small></div>
        </div></section>
      </div>
      <section class="stats-personality"><div class="stats-personality-kicker">🎀 A LITTLE READING CHECK-IN</div><h3>${yearRead.length ? 'Your reading life is looking pretty bookish.' : 'Your reading year is waiting for its first chapter.'}</h3><p>${yearRead.length ? `You finished <b>${yearRead.length}</b> book${yearRead.length === 1 ? '' : 's'} in ${year}${pages ? ` and turned ${pages.toLocaleString()} pages` : ''} — with an average rating of <b>${avg}</b>. ${fiveStars.length ? `You had <b>${fiveStars.length}</b> five-star read${fiveStars.length === 1 ? '' : 's'}, too. 💕` : 'Your five-star shelf is still waiting for its moment. ✨'}` : 'Once you start marking books as finished, this little yearbook will start filling itself in. ✨'}</p></section>
    `;
    const select = document.getElementById('statsYearSelect');
    if (select) select.addEventListener('change', () => { panel.dataset.statsYear = select.value; renderStatsV2(); });
  }

  function installStyles() {
    if (document.getElementById('reading-stats-v2-styles')) return;
    const style = document.createElement('style');
    style.id = 'reading-stats-v2-styles';
    style.textContent = `
      #statsPanel{padding:20px}
      .stats-v2-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:18px}.stats-kicker{font-size:11px;letter-spacing:2px;color:#c05a7b;font-weight:700;margin-bottom:5px}.stats-v2-head h2{font-family:Georgia,serif;color:#9e4d68;font-size:30px;margin:0 0 5px}.stats-v2-head p{margin:0;color:#8a717b;font-size:13px}.stats-year-select{font-size:11px;color:#8a717b;display:flex;align-items:center;gap:7px}.stats-year-select select{padding:8px 12px;border-radius:999px}
      .stats-hero-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:14px}.stats-big-card{background:linear-gradient(145deg,rgba(255,247,250,.95),rgba(255,253,252,.98));border:1px solid #efd5dd;border-radius:18px;padding:15px;min-height:112px;display:flex;flex-direction:column;justify-content:center;box-shadow:0 8px 22px rgba(180,93,122,.08)}.stats-big-card span{font-size:18px}.stats-big-card b{font-family:Georgia,serif;color:#a64d6b;font-size:27px;margin:3px 0}.stats-big-card small{font-size:11px;color:#8a717b}
      .stats-feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:14px}.stats-feature{min-width:0}.stats-feature h3{font-family:Georgia,serif;color:#5f3446;margin:0 0 3px;font-size:19px;text-shadow:0 1px 0 rgba(255,255,255,.85)}.stats-section-copy{color:#8a717b;font-size:11px;margin:0 0 12px}
      .stats-month-bars{height:145px;display:grid;grid-template-columns:repeat(12,1fr);gap:5px;align-items:end;padding-top:15px}.stats-month-col{height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px;position:relative}.stats-month-col b{font-size:9px;color:#a64d6b;min-height:10px}.stats-month-col span{font-size:9px;color:#927782}.stats-bar{width:72%;min-height:3px;border-radius:7px 7px 2px 2px;background:linear-gradient(180deg,#e88ba7,#d96f91)}.stats-highlight{margin-top:12px;padding:9px 11px;border-radius:12px;background:#fff0f4;color:#8a596c;font-size:11px;line-height:1.5}.stats-highlight b{color:#a64d6b}
      .stats-status-stack{display:grid;gap:8px}.stats-status-stack>div{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#fff8fa;border:1px solid #f0dce2;border-radius:12px;font-size:12px;color:#765967}.stats-status-stack b{color:#a64d6b;font-size:18px}.stats-book-strip{display:flex;gap:10px;overflow-x:auto;padding:2px 1px 8px}.stats-mini-book{flex:0 0 86px}.stats-book-cover{width:86px;height:120px;object-fit:cover;border-radius:9px;background:#fde3eb;display:block;box-shadow:0 6px 14px rgba(180,93,122,.10)}.stats-cover-placeholder{display:flex;align-items:center;justify-content:center;font-size:25px}.stats-mini-title{font-size:10px;color:#684352;font-weight:600;line-height:1.25;margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.stats-mini-rating{font-size:9px;color:#d26b8c;margin-top:3px;white-space:nowrap}.stats-mini-rating span{color:#927782}
      .stats-list-row{margin:9px 0}.stats-list-label{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:#6f5360;margin-bottom:4px}.stats-list-label span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.stats-list-label b{color:#a64d6b}.stats-progress{height:6px;background:#f8e8ed;border-radius:99px;overflow:hidden}.stats-progress span{display:block;height:100%;border-radius:99px;background:#e88ba7}
      .stats-fun-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.stats-fun-grid>div{padding:10px;background:#fff8fa;border:1px solid #f0dce2;border-radius:12px;min-width:0}.stats-fun-grid span,.stats-fun-grid small{display:block;color:#8a717b;font-size:10px}.stats-fun-grid b{display:block;color:#9e4d68;font-family:Georgia,serif;font-size:13px;margin:3px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .stats-personality{margin-top:2px;padding:22px;border-radius:20px;background:linear-gradient(135deg,#fff0f4,#fff8fa 55%,#f9eff9);border:1px solid #efd1dc;text-align:center}.stats-personality-kicker{font-size:10px;letter-spacing:1.8px;color:#c05a7b;font-weight:700}.stats-personality h3{font-family:Georgia,serif;color:#9e4d68;font-size:22px;margin:7px 0}.stats-personality p{max-width:650px;margin:0 auto;color:#765967;font-size:12px;line-height:1.7}.stats-personality b{color:#a64d6b}.stats-empty{padding:20px 5px;color:#927782;font-size:11px;text-align:center}
      .stats-calendar-full{margin-bottom:14px}.stats-cal-title{text-align:center;font-family:Georgia,serif;color:#9e4d68;font-weight:700;margin:4px 0 9px}.stats-cal-week,.stats-calendar{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.stats-cal-week span{text-align:center;font-size:9px;color:#927782;font-weight:700}.stats-cal-day{min-height:84px;padding:6px;border:1px solid #efd5dd;border-radius:10px;background:#fffafb}.stats-cal-day.blank{visibility:hidden}.stats-cal-day>b{font-size:10px;color:#9e4d68}.stats-cal-day>div{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px}.stats-cal-day img{width:30px;height:43px;object-fit:cover;border-radius:4px}.stats-cal-day span{font-size:20px}
      /* Readability layer — deliberately visible over the floral background */
      .stats-feature h3{display:inline-block;position:relative;z-index:2;padding:8px 14px;border-radius:13px;background:rgba(255,248,251,.98);border:1px solid #e8cbd5;box-shadow:0 5px 14px rgba(120,70,90,.12);text-shadow:none}
      .stats-v2-head h2{display:inline-block;position:relative;z-index:2;padding:6px 14px;border-radius:13px;background:rgba(255,248,251,.98);border:1px solid #ead0d8;box-shadow:0 5px 14px rgba(120,70,90,.10)}
      @media(max-width:800px){.stats-hero-grid{grid-template-columns:repeat(2,1fr)}.stats-feature-grid{grid-template-columns:1fr}}
      @media(max-width:560px){#statsPanel{padding:15px}.stats-v2-head{align-items:flex-start;flex-direction:column}.stats-v2-head h2{font-size:25px}.stats-year-select{align-self:flex-start}.stats-hero-grid{grid-template-columns:1fr 1fr;gap:8px}.stats-big-card{min-height:98px}.stats-big-card b{font-size:23px}.stats-month-bars{gap:2px}.stats-month-col span{font-size:8px}.stats-bar{width:80%}.stats-feature h3{padding:7px 11px;font-size:17px}}
    `;
    document.head.appendChild(style);
  }

  function install() {
    installStyles();
    if (typeof window.renderStats === 'function') {
      window.renderStats = renderStatsV2;
      renderStatsV2();
      return true;
    }
    if (typeof renderStats === 'function') {
      renderStats = renderStatsV2;
      renderStatsV2();
      return true;
    }
    return false;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries > 120) clearInterval(timer);
  }, 100);
})();

/* Keep the existing AO3 importer and stale fanfiction cleanup behavior. */
(() => {
  const id = 'ao3-import-script';
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.src = 'ao3-import.js?v=1';
  script.defer = false;
  document.head.appendChild(script);
})();

(() => {
  const removeDuplicateInsights = () => {
    const root = document.getElementById('fanfictionPanel');
    if (!root) return;
    const candidates = Array.from(root.querySelectorAll('*')).filter(el => {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      return /^📊?\s*Fanfiction Insights\s*A quick look at your AO3 reads/i.test(text) ||
        (text.startsWith('Fanfiction Insights') && text.includes('A quick look at your AO3 reads'));
    });
    candidates.forEach(el => {
      const panel = el.closest('.panel');
      if (panel && panel !== root) panel.remove();
    });
  };
  const start = () => {
    removeDuplicateInsights();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      removeDuplicateInsights();
      if (tries > 40) clearInterval(timer);
    }, 250);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
