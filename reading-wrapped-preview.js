/* Reading Wrapped preview — read-only. Never mutates state or cloud data. */
(() => {
  'use strict';
  const panel = document.getElementById('wrappedPanel');
  const tab = document.querySelector('[data-tab="wrapped"]');
  if (!panel || !tab) return;
  const clean = v => String(v ?? '').trim();
  const lower = v => clean(v).toLowerCase();
  const escapeHtml = v => clean(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateOf = b => {
    const raw = clean(b.dateFinished || b.finished || b.finishDate || b.completed);
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(raw);
    if (!m) return null;
    const y = +m[1], month = +m[2], day = +m[3];
    const d = new Date(Date.UTC(y, month - 1, day));
    return d.getUTCFullYear() === y && d.getUTCMonth() === month - 1 && d.getUTCDate() === day ? {year:y,month:month-1} : null;
  };
  const isRead = b => ['read','finished','complete','completed'].includes(lower(b.status));
  const library = () => typeof state !== 'undefined' && Array.isArray(state.books) ? state.books : [];
  const count = (items, getter) => {
    const map = new Map();
    items.forEach(item => {
      const values = getter(item);
      (Array.isArray(values) ? values : [values]).forEach(value => {
        const name = clean(value);
        if (name) map.set(name, (map.get(name) || 0) + 1);
      });
    });
    return [...map].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]));
  };
  const css = document.createElement('style');
  css.textContent = `
    #wrappedPanel{--wrap-forest:#193e2d;--wrap-gold:#c5a45d;--wrap-cream:#faf5e8;color:var(--wrap-forest)}
    .wrap-hero{padding:30px;border-radius:22px;background:linear-gradient(130deg,#183c2c,#315b40);color:var(--wrap-cream);border:1px solid #9d8c57;box-shadow:0 14px 30px #153a2526}
    .wrap-eyebrow{text-transform:uppercase;letter-spacing:.19em;font-size:11px;color:#e1c98e}
    .wrap-hero h2{font-family:Georgia,serif;font-size:clamp(29px,5vw,45px);margin:10px 0;color:#fff8e8}
    .wrap-hero p{color:#efe5c9;margin:0}
    .wrap-toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:20px 0}
    .wrap-toolbar label{color:#fff5d9;font-weight:700;text-shadow:0 1px 3px #102b20}
    .wrap-toolbar .wrap-note{color:#f6ecd0;text-shadow:0 1px 3px #102b20;margin:0}
    .wrap-toolbar select{border-radius:12px;padding:10px 14px;border:1px solid #9baf97;background:#fffdf5;color:#173e2c}
    .wrap-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
    .wrap-stat,.wrap-section{background:#fffdf5;border:1px solid #d9d0ad;border-radius:17px;padding:20px;box-shadow:0 6px 20px #193e2d0d}
    .wrap-stat strong{display:block;font:700 30px Georgia,serif;color:#1a4833;overflow-wrap:anywhere}
    .wrap-stat span{font-size:13px;color:#586a57}
    .wrap-sections{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}
    .wrap-section h3{margin:0 0 15px;font-family:Georgia,serif;color:#244833}
    .wrap-line{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #eae5d5}
    .wrap-line:last-child{border:0}
    .wrap-line span{overflow-wrap:anywhere}
    .wrap-line b{color:#836a36;white-space:nowrap}
    .wrap-months{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));align-items:end;gap:7px;height:150px}
    .wrap-month{display:flex;flex-direction:column;align-items:center;justify-content:end;height:100%;gap:5px;font-size:12px;color:#315b40;font-weight:600}
    .wrap-bar{background:linear-gradient(#bca05e,#416b4d);border-radius:5px 5px 0 0;width:100%;min-height:2px}
    .wrap-note{margin:16px 0;color:#566c59;font-size:13px;line-height:1.55}
    #wrappedPanel > .wrap-note{color:#fff3d3;text-shadow:0 1px 4px #102b20;font-weight:500}
    .wrap-month b{font-size:11px;color:#244833}
    @media(max-width:780px){.wrap-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.wrap-sections{grid-template-columns:1fr}}
    @media(max-width:430px){.wrap-hero{padding:22px}.wrap-stat{padding:14px}.wrap-stat strong{font-size:25px}.wrap-grid{gap:9px}.wrap-sections{gap:11px}.wrap-section{padding:15px}.wrap-months{gap:3px;height:125px}.wrap-month{font-size:10px}.wrap-toolbar{gap:8px}}
  `;
  document.head.appendChild(css);
  let selectedYear = new Date().getFullYear();
  const listHtml = (entries, empty='Nothing recorded yet') => entries.length
    ? entries.slice(0,6).map(([name,n]) => '<div class="wrap-line"><span>'+escapeHtml(name)+'</span><b>'+n+'</b></div>').join('')
    : '<p class="wrap-note">'+empty+'</p>';
  function renderWrapped() {
    const all = library();
    const finished = all.filter(isRead);
    const dated = finished.map(book => ({book,date:dateOf(book)})).filter(x => x.date);
    const years = [...new Set([new Date().getFullYear(), selectedYear, ...dated.map(x=>x.date.year)])].sort((a,b)=>b-a);
    const yearBooks = dated.filter(x=>x.date.year === selectedYear);
    const books = yearBooks.map(x=>x.book);
    const ratings = books.map(b=>Number(b.rating)).filter(v=>Number.isFinite(v)&&v>0&&v<=5);
    const pages = books.reduce((n,b)=>n+(Number.isFinite(Number(b.pages))?Math.max(0,Number(b.pages)):0),0);
    const authors = count(books,b=>b.author);
    // Pairings and legacy orientation labels are not reading tropes.
    const excluded = new Set(['gay','lesbian','bisexual','pansexual','queer','asexual','demisexual','questioning','mm','mf','ff','m/m','m/f','f/f','other','poly','why choose','reverse harem']);
    const tags = count(books,b=>Array.isArray(b.tags)?[...new Set(b.tags.map(clean).filter(t=>t&&!excluded.has(t.toLowerCase())))]:[]);
    const months = Array(12).fill(0);
    yearBooks.forEach(x=>months[x.date.month]++);
    const max = Math.max(1,...months);
    const topRated = books.filter(b=>Number(b.rating)>0).sort((a,b)=>Number(b.rating)-Number(a.rating)||clean(a.title).localeCompare(clean(b.title))).slice(0,5);
    const unknown = finished.filter(b=>!dateOf(b)).length;
    panel.innerHTML = '<div class="wrap-hero"><div class="wrap-eyebrow">My Bookshelf · A year among the pages</div><h2>'+selectedYear+' Reading Wrapped ✦</h2><p>Your stories, your favorite tropes, your reading year.</p></div>'
      +'<div class="wrap-toolbar"><label for="wrappedYear"><b>Reading year</b></label><select id="wrappedYear">'+years.map(y=>'<option value="'+y+'"'+(y===selectedYear?' selected':'')+'>'+y+'</option>').join('')+'</select><span class="wrap-note">Read-only preview · nothing is saved or changed</span></div>'
      +'<div class="wrap-grid"><div class="wrap-stat"><strong>'+books.length+'</strong><span>Books finished</span></div><div class="wrap-stat"><strong>'+Math.round(pages).toLocaleString()+'</strong><span>Pages read (recorded)</span></div><div class="wrap-stat"><strong>'+(ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1)+' ★':'—')+'</strong><span>Average rating</span></div><div class="wrap-stat"><strong>'+escapeHtml(tags[0]?.[0]||'—')+'</strong><span>Most common tag</span></div></div>'
      +'<div class="wrap-sections"><section class="wrap-section"><h3>Monthly reading</h3><div class="wrap-months">'+months.map((n,i)=>'<div class="wrap-month"><b>'+n+'</b><div class="wrap-bar" style="height:'+Math.max(2,n/max*100)+'%"></div><span>'+['J','F','M','A','M','J','J','A','S','O','N','D'][i]+'</span></div>').join('')+'</div></section>'
      +'<section class="wrap-section"><h3>Favorite authors</h3>'+listHtml(authors)+'</section>'
      +'<section class="wrap-section"><h3>Top tropes & tags</h3>'+listHtml(tags)+'</section>'
      +'<section class="wrap-section"><h3>Highest-rated reads</h3>'+(topRated.length?topRated.map(b=>'<div class="wrap-line"><span>'+escapeHtml(b.title||'Untitled')+'</span><b>'+Number(b.rating).toFixed(1)+' ★</b></div>').join(''):'<p class="wrap-note">No rated books for this year yet.</p>')+'</section></div>'
      +'<p class="wrap-note">Only books marked Read/Finished/Complete with valid finish dates are counted. '+(unknown?unknown+' finished book(s) have no usable finish date and are excluded from annual totals.':'')+' Page totals use saved page counts; missing values contribute zero.</p>';
    document.getElementById('wrappedYear').addEventListener('change',e=>{selectedYear=Number(e.target.value);renderWrapped()});
  }
  // Capture phase prevents legacy tab handlers from hiding the new panel.
  tab.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    document.querySelectorAll('#nav .tab').forEach(t=>t.classList.toggle('active',t===tab));
    ['bookshelfPanel','statsPanel','fanfictionPanel','buyPanel'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none'});
    panel.style.display='block';
    renderWrapped();
  },true);
  // Hide Wrapped when navigating to any existing tab (including the wishlist's capture handler).
  document.addEventListener('click', event => { if (event.target.closest('#nav .tab:not([data-tab="wrapped"])')) panel.style.display='none'; }, true);
  window.renderReadingWrappedPreview=renderWrapped;
})();