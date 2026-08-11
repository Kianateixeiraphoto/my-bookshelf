(function(){
  'use strict';
  const KEY='myBookshelfFanfictionV1';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  const write=v=>localStorage.setItem(KEY,JSON.stringify(v));
  const countBy=(items,getter)=>{const m=new Map();items.forEach(x=>{const vals=getter(x);(Array.isArray(vals)?vals:[vals]).forEach(v=>{const k=String(v||'').trim();if(k)m.set(k,(m.get(k)||0)+1)})});return [...m.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))};
  const fmt=n=>Number(n||0).toLocaleString();
  const inferCategory=f=>{
    const rel=(f.relationships||[]).join(' ').toLowerCase();
    if(/\bf\/f\b|\bf\-f\b|female\/female|women\/women/.test(rel)) return 'F/F';
    if(/\bm\/m\b|\bm\-m\b|male\/male|men\/men/.test(rel)) return 'M/M';
    if(/\bf\/m\b|\bm\/f\b|female\/male|male\/female/.test(rel)) return 'F/M';
    if((f.relationships||[]).length===0) return 'Gen';
    return 'Other / Multi';
  };
  function injectStyle(){
    if($('fanficStatsStyle'))return;
    const s=document.createElement('style');s.id='fanficStatsStyle';s.textContent=`
      .ff-insights{margin-bottom:18px}
      .ff-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0 18px}
      .ff-stat-card{background:rgba(255,253,253,.9);border:1px solid var(--line,#f1dbe3);border-radius:16px;padding:14px;box-shadow:0 6px 20px rgba(190,115,145,.07)}
      .ff-stat-card b{display:block;font-size:22px;color:#70495a}.ff-stat-card span{font-size:11px;color:var(--muted,#927682)}
      .ff-insight-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .ff-insight-box{border:1px solid var(--line,#f1dbe3);border-radius:16px;background:rgba(255,255,255,.7);padding:14px}
      .ff-insight-box h3{margin:0 0 10px;font-family:Georgia,serif;color:#684352;font-size:16px}
      .ff-rank{display:grid;grid-template-columns:minmax(0,1fr) 42px;gap:8px;align-items:center;margin:8px 0}
      .ff-rank-name{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ff-rank-bar{height:7px;background:#f8e8ee;border-radius:99px;overflow:hidden;margin-top:4px}.ff-rank-fill{height:100%;background:linear-gradient(90deg,#e99ab5,#c78bd8);border-radius:99px}
      .ff-rank-count{text-align:right;font-size:11px;color:#8b6170;font-weight:700}
      .ff-card-detail{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.ff-detail-chip{font-size:10px;padding:4px 7px;border-radius:999px;background:#f8e8ff;color:#7655a0;border:1px solid #eadcf1}
      @media(max-width:800px){.ff-stat-grid{grid-template-columns:repeat(2,1fr)}.ff-insight-grid{grid-template-columns:1fr}}
      @media(max-width:500px){.ff-stat-grid{grid-template-columns:1fr 1fr}.ff-stat-card b{font-size:18px}}
    `;document.head.appendChild(s);
  }
  function rankBox(title,arr){
    const top=arr.slice(0,3), max=top[0]?.[1]||1;
    return `<div class="ff-insight-box"><h3>${esc(title)}</h3>${top.length?top.map(([name,n])=>`<div class="ff-rank"><div><div class="ff-rank-name" title="${esc(name)}">${esc(name)}</div><div class="ff-rank-bar"><div class="ff-rank-fill" style="width:${Math.round(n/max*100)}%"></div></div></div><div class="ff-rank-count">${n}</div></div>`).join(''):`<div class="hint">No data yet.</div>`}</div>`;
  }
  function ensurePanel(){
    const fan=$('fanfiction'); if(!fan)return null;
    let panel=$('ffInsights');
    if(!panel){
      panel=document.createElement('div');panel.id='ffInsights';panel.className='panel ff-insights';
      const listPanel=$('ao3List')?.closest('.panel');
      if(listPanel) fan.insertBefore(panel,listPanel); else fan.appendChild(panel);
    }
    return panel;
  }
  function renderInsights(){
    const fan=$('fanfiction'); if(!fan)return;
    const fics=read(), panel=ensurePanel(); if(!panel)return;
    const totalWords=fics.reduce((s,f)=>s+Number(String(f.words||0).replace(/,/g,'')||0),0);
    const totalChapters=fics.reduce((s,f)=>s+(parseInt(String(f.chapters||'').split('/')[0],10)||0),0);
    const avgWords=fics.length?Math.round(totalWords/fics.length):0;
    const ratings=countBy(fics,f=>f.rating), categories=countBy(fics,f=>f.category||inferCategory(f));
    const fandoms=countBy(fics,f=>f.fandoms||[]), relationships=countBy(fics,f=>f.relationships||[]), warnings=countBy(fics,f=>f.warnings||[]);
    panel.innerHTML=`<div class="row"><div><h2 style="margin:0">📊 Fanfiction Insights</h2><div class="hint" style="margin-top:5px">A quick look at what you're actually reading on AO3 — no pie charts required. 🖤</div></div></div>
      <div class="ff-stat-grid"><div class="ff-stat-card"><b>${fmt(fics.length)}</b><span>Fics Read</span></div><div class="ff-stat-card"><b>${fmt(totalWords)}</b><span>Total Words</span></div><div class="ff-stat-card"><b>${fmt(totalChapters)}</b><span>Chapters</span></div><div class="ff-stat-card"><b>${fmt(avgWords)}</b><span>Average Words / Fic</span></div></div>
      <div class="ff-insight-grid">${rankBox('⭐ Top Ratings',ratings)}${rankBox('🏷️ Categories',categories)}${rankBox('📚 Top Fandoms',fandoms)}${rankBox('💞 Top Relationships',relationships)}</div>
      ${warnings.length?`<div style="margin-top:12px">${rankBox('⚠️ Archive Warnings',warnings)}</div>`:''}`;
  }
  async function fetchCategory(url){
    const id=(String(url||'').match(/archiveofourown\.org\/works\/(\d+)/i)||[])[1]; if(!id)return '';
    const canonical=`https://archiveofourown.org/works/${id}`;
    for(const target of [canonical,'https://api.allorigins.win/raw?url='+encodeURIComponent(canonical)]){
      try{const r=await fetch(target,{headers:{Accept:'text/html'}});if(!r.ok)continue;const doc=new DOMParser().parseFromString(await r.text(),'text/html');const vals=[...doc.querySelectorAll('dd.category.tags a.tag')].map(x=>x.textContent.trim()).filter(Boolean);if(vals.length)return vals.join(', ')}catch(e){}
    }
    return '';
  }
  let enrichBusy=false;
  async function enrichCategories(){
    if(enrichBusy)return;enrichBusy=true;
    try{const fics=read();let changed=false;for(const f of fics){if(f.category)continue;const cat=await fetchCategory(f.url);const value=cat||inferCategory(f);if(value){f.category=value;changed=true}}if(changed){write(fics);renderInsights();enhanceCards()}}finally{enrichBusy=false}
  }
  function enhanceCards(){
    const fics=read();
    [...document.querySelectorAll('#ao3List .ao3-card')].forEach((card,i)=>{
      const title=card.querySelector('.ao3-title')?.textContent?.trim();const f=fics.find(x=>x.title===title)||fics[i];if(!f)return;
      let detail=card.querySelector('.ff-card-detail');if(!detail){detail=document.createElement('div');detail.className='ff-card-detail';const meta=card.querySelector('.ao3-meta');if(meta)meta.after(detail)}
      const chips=[];const cat=f.category||inferCategory(f);if(cat)chips.push('🏷️ '+cat);(f.relationships||[]).slice(0,2).forEach(x=>chips.push('💞 '+x));(f.fandoms||[]).slice(0,2).forEach(x=>chips.push('📚 '+x));detail.innerHTML=chips.map(x=>`<span class="ff-detail-chip">${esc(x)}</span>`).join('');
    });
  }
  function hook(){
    injectStyle();const old=window.renderFanfiction;
    if(typeof old==='function'&&!old.__ffWrapped){const wrapped=function(){const r=old.apply(this,arguments);setTimeout(()=>{renderInsights();enhanceCards()},0);return r};wrapped.__ffWrapped=true;window.renderFanfiction=wrapped}
    renderInsights();enhanceCards();const save=document.getElementById('fSave');
    if(save&&!save.__ffEnrichHook){save.__ffEnrichHook=true;save.addEventListener('click',()=>setTimeout(()=>{renderInsights();enhanceCards();enrichCategories()},300))}
    enrichCategories();
  }
  document.addEventListener('DOMContentLoaded',()=>{hook();setTimeout(hook,800);setInterval(()=>{if($('fanfiction')?.style.display!=='none')hook()},1500)});
})();
