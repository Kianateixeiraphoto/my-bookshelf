(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Number(n||0).toLocaleString();
  const getFics=()=>Array.isArray(window.state?.fanfiction)?window.state.fanfiction:[];
  const save=()=>{try{window.saveLocal?.()}catch(e){console.warn('Fanfiction save failed',e)}};
  const countBy=(items,getter)=>{
    const m=new Map();
    items.forEach(x=>{
      let vals=getter(x); if(!Array.isArray(vals)) vals=[vals];
      vals.forEach(v=>{const k=String(v||'').trim();if(k)m.set(k,(m.get(k)||0)+1)})
    });
    return [...m.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  };
  const listVal=v=>Array.isArray(v)?v:(v?String(v).split(/\s*[,;]\s*/).filter(Boolean):[]);

  function injectStyle(){
    if($('fanficStatsStyle'))return;
    const s=document.createElement('style');s.id='fanficStatsStyle';s.textContent=`
      .ff-insights{margin:16px 0 18px}
      .ff-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0 18px}
      .ff-stat-card{background:rgba(255,253,253,.9);border:1px solid var(--line,#f1dbe3);border-radius:16px;padding:14px;box-shadow:0 6px 20px rgba(190,115,145,.07)}
      .ff-stat-card b{display:block;font-size:22px;color:#70495a}.ff-stat-card span{font-size:11px;color:var(--muted,#927682)}
      .ff-insight-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .ff-insight-box{border:1px solid var(--line,#f1dbe3);border-radius:16px;background:rgba(255,255,255,.72);padding:14px}
      .ff-insight-box h3{margin:0 0 10px;font-family:Georgia,serif;color:#684352;font-size:16px}
      .ff-rank{display:grid;grid-template-columns:minmax(0,1fr) 42px;gap:8px;align-items:center;margin:8px 0}
      .ff-rank-name{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ff-rank-bar{height:7px;background:#f8e8ee;border-radius:99px;overflow:hidden;margin-top:4px}.ff-rank-fill{height:100%;background:linear-gradient(90deg,#e99ab5,#c78bd8);border-radius:99px}
      .ff-rank-count{text-align:right;font-size:11px;color:#8b6170;font-weight:700}
      .ff-detail-row{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.ff-detail-chip{font-size:10px;padding:4px 7px;border-radius:999px;background:#f8e8ff;color:#7655a0;border:1px solid #eadcf1}
      .ff-refresh{margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
      .ff-note{font-size:11px;color:var(--muted,#927682)}
      @media(max-width:800px){.ff-stat-grid{grid-template-columns:repeat(2,1fr)}.ff-insight-grid{grid-template-columns:1fr}}
      @media(max-width:500px){.ff-stat-grid{grid-template-columns:1fr 1fr}.ff-stat-card b{font-size:18px}}
    `;document.head.appendChild(s);
  }

  function rankBox(title,arr){
    const top=arr.slice(0,3),max=top[0]?.[1]||1;
    return `<div class="ff-insight-box"><h3>${esc(title)}</h3>${top.length?top.map(([name,n])=>`<div class="ff-rank"><div><div class="ff-rank-name" title="${esc(name)}">${esc(name)}</div><div class="ff-rank-bar"><div class="ff-rank-fill" style="width:${Math.round(n/max*100)}%"></div></div></div><div class="ff-rank-count">${n}</div></div>`).join(''):`<div class="ff-note">No data yet.</div>`}</div>`;
  }

  function ensurePanel(){
    const fan=$('fanfictionPanel');
    if(!fan)return null;
    let panel=$('ffInsights');
    if(!panel){
      panel=document.createElement('div');
      panel.id='ffInsights';
      panel.className='panel ff-insights';
      fan.prepend(panel);
    }
    return panel;
  }

  function hideDuplicateStats(){
    const fan=$('fanfictionPanel');
    if(!fan)return;

    // Keep the single combined Fanfiction Insights panel at the top.
    // Hide only the old duplicate summary row containing Completed works / Total kudos.
    fan.querySelectorAll('.stats').forEach(el=>{
      if(el.closest('#ffInsights'))return;
      const text=el.textContent||'';
      if(/Completed works|Total kudos/i.test(text))el.style.display='none';
    });

    // Hide the old duplicate four-card Top Ratings/Categories/Fandoms/Relationships grid.
    // The actual fanfiction work cards remain untouched.
    fan.querySelectorAll('.reading-grid').forEach(el=>{
      if(el.closest('#ffInsights'))return;
      const text=el.textContent||'';
      const hasTopRatings=/Top Ratings/i.test(text);
      const hasTopCategories=/Top Categories/i.test(text);
      const hasTopFandoms=/Top Fandoms/i.test(text);
      const hasTopRelationships=/Top Relationships/i.test(text);
      if(hasTopRatings&&hasTopCategories&&hasTopFandoms&&hasTopRelationships)el.style.display='none';
    });
  }

  function renderInsights(){
    const panel=ensurePanel(); if(!panel)return;
    const fics=getFics();
    const totalWords=fics.reduce((s,f)=>s+(Number(String(f.words||0).replace(/,/g,''))||0),0);
    const totalChapters=fics.reduce((s,f)=>s+(parseInt(String(f.chapters||'').split('/')[0],10)||0),0);
    const avgWords=fics.length?Math.round(totalWords/fics.length):0;
    const ratings=countBy(fics,f=>f.rating||'Not rated');
    const categories=countBy(fics,f=>listVal(f.category||f.categories));
    const fandoms=countBy(fics,f=>listVal(f.fandoms));
    const relationships=countBy(fics,f=>listVal(f.relationships));
    const warnings=countBy(fics,f=>listVal(f.warnings||f.archiveWarnings));
    panel.innerHTML=`
      <div class="row"><div><h2 style="margin:0">📊 Fanfiction Insights</h2><div class="ff-note" style="margin-top:5px">A quick look at your AO3 reads — no pie charts required. 🖤</div></div></div>
      <div class="ff-stat-grid">
        <div class="ff-stat-card"><b>${fmt(fics.length)}</b><span>Works tracked</span></div>
        <div class="ff-stat-card"><b>${fmt(totalWords)}</b><span>Total words</span></div>
        <div class="ff-stat-card"><b>${fmt(totalChapters)}</b><span>Chapters</span></div>
        <div class="ff-stat-card"><b>${fmt(avgWords)}</b><span>Average words / fic</span></div>
      </div>
      <div class="ff-insight-grid">
        ${rankBox('⭐ Top Ratings',ratings)}
        ${rankBox('🏷️ Categories',categories)}
        ${rankBox('📚 Top Fandoms',fandoms)}
        ${rankBox('💞 Top Relationships',relationships)}
      </div>
      ${warnings.length?`<div style="margin-top:12px">${rankBox('⚠️ Archive Warnings',warnings)}</div>`:''}
      <div class="ff-refresh"><span class="ff-note">AO3 details are saved with each work when available.</span><button class="btn" id="refreshFfDetails">↻ Refresh AO3 details</button></div>`;
    $('refreshFfDetails')?.addEventListener('click',()=>enrichAll(true));
  }

  function enhanceCards(){
    const fics=getFics();
    const list=document.querySelector('#fanfictionPanel');
    if(!list)return;
    const cards=[...list.querySelectorAll('.buy-card')].filter(c=>c.querySelector('h3'));
    cards.forEach((card,i)=>{
      const title=card.querySelector('h3')?.textContent?.trim();
      const f=fics.find(x=>x.title===title)||fics[i]; if(!f)return;
      let row=card.querySelector('.ff-detail-row');
      if(!row){row=document.createElement('div');row.className='ff-detail-row';const words=card.querySelector('p');if(words)words.after(row);else card.appendChild(row)}
      const chips=[];
      if(f.rating)chips.push('⭐ '+f.rating);
      listVal(f.category||f.categories).slice(0,2).forEach(x=>chips.push('🏷️ '+x));
      listVal(f.relationships).slice(0,2).forEach(x=>chips.push('💞 '+x));
      listVal(f.fandoms).slice(0,2).forEach(x=>chips.push('📚 '+x));
      row.innerHTML=chips.map(x=>`<span class="ff-detail-chip">${esc(x)}</span>`).join('');
    });
  }

  function parseAO3(doc){
    const text=sel=>[...doc.querySelectorAll(sel)].map(x=>x.textContent.trim()).filter(Boolean);
    const first=sel=>text(sel)[0]||'';
    const wordsRaw=first('dd.words');
    const chapters=first('dd.chapters');
    const rating=first('dd.rating.tags a.tag')||first('dd.rating');
    const category=text('dd.category.tags a.tag');
    const fandoms=text('dd.fandom.tags a.tag');
    const relationships=text('dd.relationship.tags a.tag');
    const warnings=text('dd.warning.tags a.tag');
    const title=first('h2.title');
    const author=first('h3.byline a[rel="author"]')||first('h3.byline');
    const words=Number((wordsRaw||'').replace(/[^0-9]/g,''))||0;
    return {title,author,words,chapters,rating,category,fandoms,relationships,warnings};
  }

  async function fetchAO3(url){
    const id=(String(url||'').match(/archiveofourown\.org\/works\/(\d+)/i)||[])[1];
    if(!id)return null;
    const canonical=`https://archiveofourown.org/works/${id}`;
    const targets=[
      canonical,
      'https://api.allorigins.win/raw?url='+encodeURIComponent(canonical),
      'https://api.codetabs.com/v1/proxy?quest='+encodeURIComponent(canonical)
    ];
    for(const target of targets){
      try{
        const r=await fetch(target,{headers:{Accept:'text/html'}});
        if(!r.ok)continue;
        const html=await r.text();
        const doc=new DOMParser().parseFromString(html,'text/html');
        const parsed=parseAO3(doc);
        if(parsed.title||parsed.rating||parsed.fandoms.length||parsed.relationships.length)return parsed;
      }catch(e){console.warn('AO3 details fetch failed',e)}
    }
    return null;
  }

  let enrichBusy=false;
  async function enrichAll(force=false){
    if(enrichBusy)return;
    const fics=getFics(); if(!fics.length){renderInsights();hideDuplicateStats();return}
    enrichBusy=true;
    try{
      for(const f of fics){
        if(!f.url)continue;
        if(!force && f.ao3DetailsFetched)continue;
        const d=await fetchAO3(f.url);
        if(!d)continue;
        if(d.title&&!f.title)f.title=d.title;
        if(d.author&&!f.author)f.author=d.author;
        if(d.words)f.words=d.words;
        if(d.chapters)f.chapters=d.chapters;
        if(d.rating)f.rating=d.rating;
        if(d.category.length)f.category=d.category;
        if(d.fandoms.length)f.fandoms=d.fandoms;
        if(d.relationships.length)f.relationships=d.relationships;
        if(d.warnings.length)f.warnings=d.warnings;
        f.ao3DetailsFetched=true;
      }
      save();
      renderInsights();
      enhanceCards();
      hideDuplicateStats();
      if(typeof window.renderFanfiction==='function')window.renderFanfiction();
    }finally{enrichBusy=false}
  }

  function hook(){
    injectStyle();
    const old=window.renderFanfiction;
    if(typeof old==='function'&&!old.__ffWrapped){
      const wrapped=function(){
        const r=old.apply(this,arguments);
        setTimeout(()=>{renderInsights();enhanceCards();hideDuplicateStats()},0);
        return r;
      };
      wrapped.__ffWrapped=true;
      window.renderFanfiction=wrapped;
    }
    renderInsights();
    enhanceCards();
    hideDuplicateStats();
    enrichAll(false);
  }

  document.addEventListener('DOMContentLoaded',()=>{hook();setTimeout(hook,500);setTimeout(hook,1500);});
  setTimeout(hook,1000);
})();
