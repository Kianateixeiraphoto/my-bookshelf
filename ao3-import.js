/* My Bookshelf — AO3 metadata importer
 * Reads publicly accessible AO3 work metadata through Jina Reader.
 * It imports metadata only; it does not import fic text.
 */
(() => {
  const READER = 'https://r.jina.ai/';
  const escSafe = value => typeof esc === 'function' ? esc(value) : String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  function cleanUrl(raw) {
    let value = String(raw || '').trim();
    if (!value) throw new Error('Paste an AO3 work link first.');
    if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (!['archiveofourown.org','archive.transformativeworks.org','secure.ao3.org'].includes(host)) {
      throw new Error('Please use a public AO3 work link.');
    }
    if (!/^\/works\/\d+/.test(url.pathname)) throw new Error('That looks like an AO3 page, but not an individual work. Paste a link like /works/12345678.');
    return url.href;
  }

  async function fetchAO3(url) {
    const target = READER + url;
    const response = await fetch(target, {headers:{Accept:'text/plain'}, cache:'no-store'});
    if (!response.ok) throw new Error(`AO3 reader returned ${response.status}.`);
    const text = await response.text();
    if (!text || text.length < 100) throw new Error('AO3 returned an empty page.');
    return text;
  }

  const LABELS = ['Rating','Archive Warning','Category','Fandoms','Fandom','Relationship','Relationships','Characters','Additional Tags','Language','Stats','Published','Completed','Words','Chapters','Comments','Kudos','Bookmarks','Hits'];
  function linesOf(text) { return text.replace(/\r/g,'').split('\n').map(x => x.trim()).filter(Boolean); }

  function block(lines, labels) {
    const start = lines.findIndex(line => labels.some(label => line.toLowerCase() === label.toLowerCase() + ':'));
    if (start < 0) return '';
    const values = [];
    for (let i = start + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (LABELS.some(label => line.toLowerCase() === label.toLowerCase() + ':')) break;
      if (/^(Published|Completed|Words|Chapters|Comments|Kudos|Bookmarks|Hits):/i.test(line)) break;
      values.push(line);
    }
    return values.join(' ').trim();
  }

  function stat(text, name) {
    const match = text.match(new RegExp('(?:^|\\s)' + name + ':\\s*([^\\s]+)', 'i'));
    return match ? match[1].replace(/,/g,'') : '';
  }

  function splitTags(value) {
    return String(value || '').split(/\s*,\s*|\s+·\s+/).map(x => x.trim()).filter(Boolean);
  }

  function parseAO3(text, url) {
    const lines = linesOf(text);
    let title = '';
    const heading = lines.find(line => /^#{1,6}\s+/.test(line));
    if (heading) title = heading.replace(/^#{1,6}\s+/,'').trim();
    if (!title) {
      const titleLine = lines.find(line => /^Title:\s*/i.test(line));
      if (titleLine) title = titleLine.replace(/^Title:\s*/i,'').trim();
    }

    let author = '';
    const by = lines.find(line => /^by\s+/i.test(line));
    if (by) author = by.replace(/^by\s+/i,'').trim();
    if (!author) {
      const creator = lines.find(line => /^Creator:\s*/i.test(line));
      if (creator) author = creator.replace(/^Creator:\s*/i,'').trim();
    }

    const statsLineIndex = lines.findIndex(line => /^Stats:\s*$/i.test(line));
    let statsText = statsLineIndex >= 0 ? lines.slice(statsLineIndex + 1, statsLineIndex + 3).join(' ') : '';
    if (!statsText) statsText = text;

    const data = {
      url,
      title,
      author,
      rating: block(lines,['Rating']),
      warnings: splitTags(block(lines,['Archive Warning'])),
      category: splitTags(block(lines,['Category'])),
      fandoms: splitTags(block(lines,['Fandoms','Fandom'])),
      relationships: splitTags(block(lines,['Relationship','Relationships'])),
      characters: splitTags(block(lines,['Characters'])),
      additionalTags: splitTags(block(lines,['Additional Tags'])),
      language: block(lines,['Language']),
      published: '',
      completed: '',
      words: Number(stat(statsText,'Words') || 0),
      chapters: stat(statsText,'Chapters'),
      comments: Number(stat(statsText,'Comments') || 0),
      kudos: Number(stat(statsText,'Kudos') || 0),
      bookmarks: Number(stat(statsText,'Bookmarks') || 0),
      hits: Number(stat(statsText,'Hits') || 0)
    };

    const pubLine = lines.find(line => /^Published:\s*/i.test(line));
    const compLine = lines.find(line => /^Completed:\s*/i.test(line));
    data.published = pubLine ? pubLine.replace(/^Published:\s*/i,'').trim() : '';
    data.completed = compLine ? compLine.replace(/^Completed:\s*/i,'').trim() : '';

    if (!data.title) throw new Error('I reached the AO3 page, but could not find the work title.');
    return data;
  }

  function renderList(items) { return (Array.isArray(items) ? items : []).map(x => `<span class="fic-chip">${escSafe(x)}</span>`).join(''); }

  function renderFanfictionRich() {
    const p = document.getElementById('fanfictionPanel');
    if (!p || typeof state === 'undefined') return;
    const f = Array.isArray(state.fanfiction) ? state.fanfiction : [];
    const totalWords = f.reduce((sum, x) => sum + (Number(x.words) || 0), 0);
    const ratings = {}; const categories = {}; const fandoms = {}; const relationships = {};
    f.forEach(x => {
      if (x.rating) ratings[x.rating] = (ratings[x.rating] || 0) + 1;
      (x.category || []).forEach(v => categories[v] = (categories[v] || 0) + 1);
      (x.fandoms || []).forEach(v => fandoms[v] = (fandoms[v] || 0) + 1);
      (x.relationships || []).forEach(v => relationships[v] = (relationships[v] || 0) + 1);
    });
    const top = obj => Object.entries(obj).sort((a,b) => b[1]-a[1]).slice(0,3);
    const statList = (obj, empty='Nothing imported yet.') => { const vals=top(obj); return vals.length ? vals.map(([k,v])=>`<div class="fic-stat-row"><span>${escSafe(k)}</span><b>${v}</b></div>`).join('') : `<div class="status">${empty}</div>`; };
    p.innerHTML = `<div class="row"><div><div class="section-title">🖤 Fanfiction</div><div class="section-sub">Your AO3 reads, with the good metadata pulled in for you. ✨</div></div><button class="btn primary" onclick="addFic()">+ Add AO3 Work</button></div>
      <div class="reading-grid"><div class="reading-card"><b>${f.length}</b><span>Works tracked</span></div><div class="reading-card"><b>${totalWords.toLocaleString()}</b><span>Total words</span></div><div class="reading-card"><b>${f.filter(x=>x.completed).length}</b><span>Completed works</span></div><div class="reading-card"><b>${f.reduce((s,x)=>s+(Number(x.kudos)||0),0).toLocaleString()}</b><span>Total kudos</span></div></div>
      <div class="fic-insights"><div class="panel"><h3>⭐ Top Ratings</h3>${statList(ratings)}</div><div class="panel"><h3>🏷️ Top Categories</h3>${statList(categories)}</div><div class="panel"><h3>📚 Top Fandoms</h3>${statList(fandoms)}</div><div class="panel"><h3>💞 Top Relationships</h3>${statList(relationships)}</div></div>
      <div class="buy-grid" style="margin-top:15px">${f.length ? f.map((x,i)=>`<div class="buy-card"><h3>${escSafe(x.title||'AO3 Work')}</h3><div class="muted">${escSafe(x.author||'')}</div><div class="fic-meta"><b>${escSafe(x.rating||'Rating not found')}</b>${x.category?.length ? ' · '+escSafe(x.category.join(', ')) : ''}</div>${x.fandoms?.length ? `<div class="fic-label">Fandoms</div><div class="fic-chips">${renderList(x.fandoms)}</div>`:''}${x.relationships?.length ? `<div class="fic-label">Relationships</div><div class="fic-chips">${renderList(x.relationships)}</div>`:''}<p>📝 ${Number(x.words||0).toLocaleString()} words · 📖 ${escSafe(x.chapters||'')} chapters</p><div class="fic-small">💬 ${Number(x.comments||0).toLocaleString()} · ❤️ ${Number(x.kudos||0).toLocaleString()} · 🔖 ${Number(x.bookmarks||0).toLocaleString()} · 👀 ${Number(x.hits||0).toLocaleString()}</div><p><a href="${escSafe(x.url||'#')}" target="_blank" rel="noopener">Open on AO3 ↗</a> <button class="btn" onclick="removeFic(${i})">Remove</button></p></div>`).join('') : '<div class="panel empty" style="grid-column:1/-1">No fanfiction tracked yet.</div>'}</div>`;
  }

  function installStyles() {
    if (document.getElementById('ao3-import-styles')) return;
    const style = document.createElement('style'); style.id='ao3-import-styles';
    style.textContent = `.fic-insights{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:15px}.fic-insights h3{font-family:Georgia,serif;margin:0 0 10px;color:#684352}.fic-stat-row{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--line);font-size:12px}.fic-stat-row:last-child{border-bottom:0}.fic-label{font-size:10px;color:var(--muted);margin-top:8px}.fic-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}.fic-chip{font-size:10px;padding:3px 6px;border-radius:999px;background:var(--accent2);color:#8a5368}.fic-meta,.fic-small{font-size:11px;color:var(--muted);line-height:1.6}@media(max-width:800px){.fic-insights{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }

  window.addFic = function() {
    openModal(`<div class="row"><h2>🖤 Add AO3 Work</h2><button class="btn" type="button" onclick="closeModal()">Cancel</button></div><form id="ficForm" class="form-grid"><label class="wide">AO3 work link<input name="url" placeholder="https://archiveofourown.org/works/12345678" required></label><div class="wide" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn" type="button" id="fetchAO3Btn">✨ Pull AO3 Information</button><span id="ao3Status" class="status">Paste the link, then pull the metadata.</span></div><label>Title<input name="title" placeholder="Title"></label><label>Author<input name="author" placeholder="Author"></label><label>Rating<input name="rating" placeholder="Rating"></label><label>Category<input name="categoryText" placeholder="M/M, F/F, Gen…"></label><label class="wide">Fandoms<input name="fandomsText" placeholder="Fandoms, separated by commas"></label><label class="wide">Relationships<input name="relationshipsText" placeholder="Relationships, separated by commas"></label><label class="wide">Archive Warnings<input name="warningsText" placeholder="Warnings, separated by commas"></label><label class="wide">Characters<input name="charactersText" placeholder="Characters, separated by commas"></label><label class="wide">Additional Tags<input name="additionalTagsText" placeholder="Additional tags, separated by commas"></label><label>Words<input name="words" type="number" min="0" placeholder="Words"></label><label>Chapters<input name="chapters" placeholder="20/20"></label><label>Comments<input name="comments" type="number" min="0"></label><label>Kudos<input name="kudos" type="number" min="0"></label><label>Bookmarks<input name="bookmarks" type="number" min="0"></label><label>Hits<input name="hits" type="number" min="0"></label><label>Published<input name="published" placeholder="YYYY-MM-DD"></label><label>Completed<input name="completed" placeholder="YYYY-MM-DD"></label><div class="wide actions" style="justify-content:flex-end"><button class="btn" type="button" onclick="closeModal()">Cancel</button><button class="btn primary" type="submit">Save Work</button></div></form>`);

    const form = document.getElementById('ficForm');
    const status = document.getElementById('ao3Status');
    document.getElementById('fetchAO3Btn').onclick = async () => {
      const btn = document.getElementById('fetchAO3Btn');
      try {
        const url = cleanUrl(form.elements.url.value);
        btn.disabled = true; btn.textContent = '🔎 Pulling AO3…'; status.textContent = 'Reading the public AO3 metadata…';
        const data = parseAO3(await fetchAO3(url), url);
        const set = (name, value) => { if (form.elements[name]) form.elements[name].value = Array.isArray(value) ? value.join(', ') : (value || ''); };
        set('title',data.title); set('author',data.author); set('rating',data.rating); set('categoryText',data.category); set('fandomsText',data.fandoms); set('relationshipsText',data.relationships); set('warningsText',data.warnings); set('charactersText',data.characters); set('additionalTagsText',data.additionalTags); set('words',data.words); set('chapters',data.chapters); set('comments',data.comments); set('kudos',data.kudos); set('bookmarks',data.bookmarks); set('hits',data.hits); set('published',data.published); set('completed',data.completed);
        form.dataset.ao3Loaded = JSON.stringify(data);
        status.textContent = '✓ AO3 information pulled. Check it, edit anything you want, then save. 💕';
      } catch (error) { console.error(error); status.textContent = error.message || 'I could not pull that AO3 page.'; }
      finally { btn.disabled = false; btn.textContent = '✨ Pull AO3 Information'; }
    };
    form.onsubmit = e => { e.preventDefault(); const x=Object.fromEntries(new FormData(form).entries()); const arr=v=>String(v||'').split(/\s*,\s*/).map(s=>s.trim()).filter(Boolean); const obj={url:x.url.trim(),title:x.title.trim(),author:x.author.trim(),rating:x.rating.trim(),category:arr(x.categoryText),fandoms:arr(x.fandomsText),relationships:arr(x.relationshipsText),warnings:arr(x.warningsText),characters:arr(x.charactersText),additionalTags:arr(x.additionalTagsText),words:Number(x.words||0),chapters:x.chapters.trim(),comments:Number(x.comments||0),kudos:Number(x.kudos||0),bookmarks:Number(x.bookmarks||0),hits:Number(x.hits||0),published:x.published.trim(),completed:x.completed.trim()}; state.fanfiction=Array.isArray(state.fanfiction)?state.fanfiction:[]; state.fanfiction.push(obj); saveLocal(); closeModal(); render(); sync(); };
  };

  window.renderFanfiction = renderFanfictionRich;
  installStyles();
  if (typeof render === 'function') renderFanfictionRich();
})();
