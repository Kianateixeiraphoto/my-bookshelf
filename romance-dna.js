/* Romance DNA Phase 1 — read-only analytics */
(() => {
  'use strict';
  const groups = {
    'Relationship Pairing':['M/M','M/F','F/F','M/M/F','M/F/F','Other'],
    'Romance Tropes':['Enemies to Lovers','Friends to Lovers','Rivals to Lovers','Strangers to Lovers','Second Chance','Fake Dating','Marriage of Convenience','Forced Proximity','Only One Bed','Grumpy x Sunshine','Found Family','Forbidden Romance','Opposites Attract','Workplace Romance','Small Town Romance','Sports Romance','College Romance','Friends with Benefits','One Night Stand','Unrequited Love','Slow Burn','Love at First Sight','Accidental Dating','Dating for a Bet / Dare','Childhood Friends to Lovers','Roommates to Lovers','Emotional Angst'],
    'Relationship Dynamics':['Possessive','Protective','Jealousy','Obsessive Love','Groveling','Chasing / Pursuit','Betrayal','Hurt / Comfort','Mutual Pining','Secret Relationship','Established Relationship','Codependency','Power Imbalance','Touch Them and Die','Age Gap','Size Difference'],
    'Spice Level':['No Spice / Closed Door','Low Spice','Moderate Spice','High Spice','Extremely Spicy'],
    'Mood & Vibes':['Sweet','Cozy','Fluffy','Funny','Angsty','Emotional','Dark','Morally Gray','Heartwarming','Tearjerker','Suspenseful','Wholesome','Chaotic','Intense','Comfort Read'],
    'Genres & Subgenres':[]
  };
  const aliases={'MM':'M/M','MF':'M/F','FF':'F/F','Forbidden Love':'Forbidden Romance','Hurt/Comfort':'Hurt / Comfort','College':'College / University'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s??'').trim().toLowerCase();
  const canonical=s=>aliases[s]||s;
  let mode='reading', genre='all', metric='Romance Tropes';
  function library(){try{return Array.isArray(state.books)?state.books:[]}catch(e){return []}}
  function eligible(book){const status=norm(book.status);return mode==='reading'?['read','finished','complete','completed'].includes(status):['want to read','unread','to read','tbr'].includes(status)}
  function tags(book){return [...new Set((Array.isArray(book.tags)?book.tags:[]).map(t=>canonical(String(t).trim())).filter(Boolean))]}
  function isGenre(t){return /romance|fantasy|romantasy|paranormal|contemporary|historical|sci.fi|science fiction|thriller|horror|mystery|sports|dark academia|urban fantasy|young adult|new adult|literary|erotica|omegaverse/i.test(t)}
  function genreList(books){const set=new Set();books.forEach(b=>tags(b).filter(isGenre).forEach(t=>set.add(t)));return [...set].sort((a,b)=>a.localeCompare(b))}
  function rows(books,cat){let allowed=groups[cat]||[];if(cat==='Genres & Subgenres')allowed=genreList(books);const counts=new Map();books.forEach(b=>{tags(b).forEach(t=>{if(allowed.includes(t))counts.set(t,(counts.get(t)||0)+1)})});return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))}
  function render(){
    const panel=document.getElementById('romanceDnaPanel');if(!panel)return;
    const all=library(), statuses=all.filter(eligible), genres=genreList(all);
    if(genre!=='all'&&!genres.includes(genre))genre='all';
    const selected=statuses.filter(b=>genre==='all'||tags(b).includes(genre));
    const tagged=selected.filter(b=>tags(b).length);
    const categoryTags = metric==='Genres & Subgenres'?genreList(selected):(groups[metric]||[]);
    const categoryTagged = selected.filter(b=>tags(b).some(t=>categoryTags.includes(t)));
    const data=rows(selected,metric), max=Math.max(1,...data.map(r=>r[1]));
    const options=genres.map(g=>'<option value="'+esc(g)+'"'+(genre===g?' selected':'')+'>'+esc(g)+'</option>').join('');
    const charts=data.slice(0,12).map(([tag,n])=>'<div class="dna-bar-item"><div class="dna-bar-label"><span>'+esc(tag)+'</span><b>'+n+' / '+selected.length+' · '+Math.round(n/Math.max(1,selected.length)*100)+'%</b></div><div class="dna-bar-track"><div class="dna-bar-fill" style="width:'+(n/max*100)+'%"></div></div></div>').join('');
    panel.innerHTML='<div class="dna-shell"><div class="dna-hero"><div class="dna-eyebrow">✦ THE MIDNIGHT READER’S DOSSIER ✦</div><h2>🌙 Romance DNA</h2><p>Your bookshelf has receipts.</p></div><div class="dna-controls"><div class="dna-toggle" role="group" aria-label="Romance DNA mode"><button type="button" data-dna-mode="reading" aria-pressed="'+(mode==='reading')+'" class="'+(mode==='reading'?'selected':'')+'">📖 Reading DNA</button><button type="button" data-dna-mode="attraction" aria-pressed="'+(mode==='attraction')+'" class="'+(mode==='attraction'?'selected':'')+'">💌 Attraction DNA</button></div><label class="dna-filter">Genre <select id="dnaGenre"><option value="all">All eligible books</option>'+options+'</select></label></div><div class="dna-summary"><div class="dna-summary-card"><strong>'+selected.length+'</strong><span>'+(mode==='reading'?'Finished books':'Want-to-read books')+'</span></div><div class="dna-summary-card"><strong>'+tagged.length+'</strong><span>Books with tags</span></div><div class="dna-summary-card"><strong>'+data.length+'</strong><span>Matching '+esc(metric.toLowerCase())+'</span></div></div><section class="dna-paper"><div class="dna-section-heading"><div><div class="dna-eyebrow">YOUR ROMANCE FINGERPRINT</div><h3>'+esc(metric)+'</h3></div><label>Explore <select id="dnaMetric">'+Object.keys(groups).map(g=>'<option'+(g===metric?' selected':'')+'>'+esc(g)+'</option>').join('')+'</select></label></div>'+(selected.length===0?'<p class="dna-empty">This chapter is still unwritten. Add books with the matching reading status to see your DNA. 📚</p>':!data.length?'<p class="dna-empty">No matching tags in this category yet. Your bookshelf is keeping its secrets. 🌙</p>':'<div class="dna-bars">'+charts+'</div>')+'<p class="dna-footnote">Each percentage is the share of '+categoryTagged.length+' books tagged in this category. A book can count toward several tags. Untagged books are excluded from these percentages; no book data is changed.</p></section><div class="dna-next">✦ Coming in Phase 2: archetypes, Taste Paradox, and delightfully unhinged commentary.</div></div>';
    panel.querySelectorAll('[data-dna-mode]').forEach(btn=>btn.addEventListener('click',()=>{mode=btn.dataset.dnaMode;render()}));
    panel.querySelector('#dnaGenre').addEventListener('change',e=>{genre=e.target.value;render()});
    panel.querySelector('#dnaMetric').addEventListener('change',e=>{metric=e.target.value;render()});
  }
  window.renderRomanceDNA=render;
  document.getElementById('nav')?.addEventListener('click',e=>{if(e.target.closest('[data-tab="romanceDna"]'))render()});
})();