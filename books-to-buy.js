/* Books to Buy — fresh rebuild with cloud sync */
(() => {
  const KEY = 'my-bookshelf-books-to-buy-v1';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'buy-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  let books = [];
  let cloudClient = null;
  let cloudSession = null;
  let cloudSyncing = false;

  function load(){ try { books = JSON.parse(localStorage.getItem(KEY) || '[]'); if(!Array.isArray(books)) books=[]; } catch { books=[]; } }
  function save(){ localStorage.setItem(KEY, JSON.stringify(books)); }

  function findSupabaseConfig(){
    const text=[...document.scripts].map(s=>s.textContent||'').join('\n');
    const url=text.match(/const\s+SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
    const key=text.match(/const\s+SUPABASE_KEY\s*=\s*['"]([^'"]+)['"]/);
    return url&&key?{url:url[1],key:key[1]}:null;
  }

  function buyKey(b){ return String(b.id||((b.title||'')+'|'+(b.author||''))).trim().toLowerCase(); }
  function mergeBooks(localBooks,cloudBooks){
    const merged=new Map();
    (cloudBooks||[]).forEach(b=>merged.set(buyKey(b),b));
    (localBooks||[]).forEach(b=>{ const k=buyKey(b); if(!merged.has(k)) merged.set(k,b); });
    return [...merged.values()];
  }
  function sameBooks(a,b){ return JSON.stringify(a)===JSON.stringify(b); }
  function setCloudStatus(text){ const el=$('cloudStatus'); if(el) el.textContent=text; }

  async function cloudLoad(){
    if(!cloudClient||!cloudSession)return;
    try{
      const uid=cloudSession.user.id, newId='library:'+uid;
      let {data:row,error}=await cloudClient.from('books').select('id,data,updated_at').eq('user_id',uid).eq('id',newId).maybeSingle();
      if(error)throw error;
      if(!row){ const fallback=await cloudClient.from('books').select('id,data,updated_at').eq('user_id',uid).eq('id','library').maybeSingle(); if(fallback.error)throw fallback.error; row=fallback.data; }
      const cloudBooks=Array.isArray(row?.data?.booksToBuy)?row.data.booksToBuy:[];
      const merged=mergeBooks(books,cloudBooks);
      const localHadExtra=merged.length>cloudBooks.length || !sameBooks(merged,cloudBooks);
      books=merged; save(); render();
      setCloudStatus('Synced from cloud 💕');
      if(localHadExtra)await cloudSave();
    }catch(e){ console.warn('Books to Buy cloud load failed',e); }
  }

  async function cloudSave(){
    if(!cloudClient||!cloudSession||cloudSyncing)return;
    cloudSyncing=true;
    try{
      const uid=cloudSession.user.id, newId='library:'+uid;
      let {data:row,error}=await cloudClient.from('books').select('id,data').eq('user_id',uid).eq('id',newId).maybeSingle();
      if(error)throw error;
      let rowId=newId, existingData={};
      if(!row){ const fallback=await cloudClient.from('books').select('id,data').eq('user_id',uid).eq('id','library').maybeSingle(); if(fallback.error)throw fallback.error; row=fallback.data; }
      if(row){ rowId=row.id; existingData=row.data&&typeof row.data==='object'?row.data:{}; }
      const nextData={...existingData,booksToBuy:books};
      if(row){ const result=await cloudClient.from('books').update({data:nextData,updated_at:new Date().toISOString()}).eq('id',rowId).eq('user_id',uid); if(result.error)throw result.error; }
      else { const result=await cloudClient.from('books').insert({id:rowId,user_id:uid,data:nextData,updated_at:new Date().toISOString()}); if(result.error)throw result.error; }
      setCloudStatus('Books to Buy synced 💕');
    }catch(e){ console.warn('Books to Buy cloud save failed',e); }
    finally{ cloudSyncing=false; }
  }

  async function initCloud(){
    try{
      if(!window.supabase?.createClient)return;
      const cfg=findSupabaseConfig(); if(!cfg)return;
      cloudClient=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true,storage:window.localStorage,storageKey:'my-bookshelf-supabase-auth'}});
      cloudClient.auth.onAuthStateChange((_event,session)=>{ cloudSession=session; if(session)setTimeout(()=>cloudLoad(),0); });
      const result=await cloudClient.auth.getSession();
      cloudSession=result.data.session;
      if(cloudSession)await cloudLoad();
    }catch(e){ console.warn('Books to Buy cloud init failed',e); }
  }

  function injectStyles(){
    if($('books-to-buy-styles')) return;
    const s=document.createElement('style'); s.id='books-to-buy-styles';
    s.textContent=`
      .buy-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px;margin-top:18px}
      .buy-item{overflow:hidden;border:1px solid var(--line);border-radius:20px;background:rgba(255,253,253,.94);box-shadow:var(--shadow);display:flex;flex-direction:column}
      .buy-cover{height:310px;background:linear-gradient(145deg,#ffe5ef,#f3dff4);display:flex;align-items:center;justify-content:center;overflow:hidden}
      .buy-cover img{width:100%;height:100%;object-fit:cover}.buy-cover-placeholder{font-size:62px}
      .buy-item-body{padding:15px}.buy-item-title{font:700 19px/1.2 Georgia,serif;color:#684352}.buy-item-author{margin-top:4px;color:var(--muted);font-size:13px}
      .buy-price{font-size:15px;font-weight:700;color:#8a5368;margin-top:10px}.buy-notes{margin-top:10px;padding:10px 11px;border-radius:12px;background:#fff3f7;border:1px solid #f1dbe3;color:#684352;font-size:12px;line-height:1.5;white-space:pre-wrap}
      .buy-actions{display:flex;gap:7px;margin-top:12px}.buy-actions .btn{padding:7px 10px;font-size:11px}
      .buy-form-cover{display:flex;gap:12px;align-items:flex-start;margin-top:10px}.buy-preview{width:90px;height:120px;border-radius:9px;background:#f8e9ef;display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none}.buy-preview img{width:100%;height:100%;object-fit:cover}.buy-preview span{font-size:30px}
      .buy-search-results{margin-top:10px;display:grid;gap:7px;max-height:210px;overflow:auto}.buy-result{display:flex;gap:9px;align-items:center;padding:8px;border:1px solid var(--line);border-radius:12px;background:#fffafb;cursor:pointer;text-align:left}.buy-result:hover{border-color:var(--accent);background:var(--accent2)}.buy-result img{width:38px;height:54px;object-fit:cover;border-radius:4px;background:#f5e6ec}.buy-result b{display:block;font-size:12px}.buy-result span{font-size:10px;color:var(--muted)}
      @media(max-width:600px){.buy-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.buy-cover{height:240px}.buy-item-body{padding:11px}.buy-item-title{font-size:16px}.buy-form-cover{flex-direction:column}.buy-preview{width:100px}}
    `; document.head.appendChild(s);
  }

  function openForm(book={}){
    const modal=$('modal'), card=$('modalCard'); if(!modal||!card)return;
    card.innerHTML=`<div class="row"><h2>🛍️ ${book.id?'Edit':'Add'} Book</h2><button class="btn" type="button" id="buyCancel">Cancel</button></div>
      <form id="buyForm" class="form-grid">
        <input class="wide" name="title" placeholder="Book title" value="${esc(book.title)}" required>
        <input name="author" placeholder="Author" value="${esc(book.author)}">
        <div class="wide"><div class="actions"><button class="btn" type="button" id="buyLookup">🔎 Look Up Book</button><span class="status" id="buyLookupStatus"></span></div><div id="buyResults" class="buy-search-results"></div></div>
        <div class="buy-form-cover wide"><div class="buy-preview" id="buyPreview">${book.cover?`<img src="${esc(book.cover)}" alt="">`:'<span>📚</span>'}</div><div style="flex:1;min-width:0"><input class="wide" name="cover" id="buyCover" placeholder="Book cover URL" value="${esc(book.cover)}"><div class="status" style="margin-top:5px">You can choose a cover from the lookup or paste one yourself.</div></div></div>
        <input name="price" inputmode="decimal" placeholder="Price (optional)" value="${esc(book.price)}">
        <textarea class="wide" name="notes" rows="5" placeholder="Notes — edition, where you saw it, why you want it, etc.">${esc(book.notes)}</textarea>
        <button class="btn primary wide" type="submit">Save Book</button>
      </form>`;
    modal.classList.add('show');
    $('buyCancel').onclick=()=>modal.classList.remove('show');
    $('buyCover').oninput=()=>preview($('buyCover').value);
    $('buyLookup').onclick=lookup;
    $('buyForm').onsubmit=e=>{e.preventDefault();const x=Object.fromEntries(new FormData(e.target).entries());const obj={...book,id:book.id||uid(),title:x.title.trim(),author:x.author.trim(),cover:x.cover.trim(),price:x.price.trim(),notes:x.notes.trim()};if(book.id)books=books.map(b=>b.id===book.id?obj:b);else books.unshift(obj);save();modal.classList.remove('show');render();cloudSave();};
  }
  function preview(url){$('buyPreview').innerHTML=url?`<img src="${esc(url)}" alt="">`:'<span>📚</span>';}

  async function lookup(){
    const title=$('buyForm')?.elements.title.value.trim(), author=$('buyForm')?.elements.author.value.trim(), status=$('buyLookupStatus'), results=$('buyResults');
    if(!title){status.textContent='Enter a title first.';return;}
    status.textContent='Searching…'; results.innerHTML='';
    try{
      const q=encodeURIComponent([title,author].filter(Boolean).join(' '));
      const r=await fetch(`https://openlibrary.org/search.json?q=${q}&limit=8&fields=key,title,author_name,cover_i,first_publish_year`);
      if(!r.ok)throw new Error('Search failed'); const data=await r.json();
      const docs=(data.docs||[]).filter(x=>x.title);
      status.textContent=docs.length?`${docs.length} matches`:'No matches — you can enter the cover URL manually.';
      results.innerHTML=docs.map((d,i)=>{const cover=d.cover_i?`https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`:'';return `<button type="button" class="buy-result" data-i="${i}">${cover?`<img src="${cover}" alt="">`:'<img alt="">'}<span><b>${esc(d.title)}</b>${esc((d.author_name||[]).slice(0,2).join(', '))}${d.first_publish_year?` · ${d.first_publish_year}`:''}</span></button>`}).join('');
      docs.forEach((d,i)=>results.querySelector(`[data-i="${i}"]`)?.addEventListener('click',()=>{const cover=d.cover_i?`https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`:'';$('buyForm').elements.title.value=d.title||title;$('buyForm').elements.author.value=(d.author_name||[]).slice(0,2).join(', ')||author;$('buyForm').elements.cover.value=cover;preview(cover);status.textContent='Book selected.';results.innerHTML='';}));
    }catch(e){status.textContent='Lookup unavailable right now. You can still enter the book manually.';}
  }

  function render(){
    const panel=$('buyPanel'); if(!panel)return;
    const empty=$('buyEmptyState'); let list=$('buyList');
    if(!list){list=document.createElement('div');list.id='buyList';list.className='buy-list';empty?.after(list);}
    if(empty)empty.style.display=books.length?'none':'flex';
    list.innerHTML=books.map(b=>`<article class="buy-item"><div class="buy-cover">${b.cover?`<img src="${esc(b.cover)}" alt="${esc(b.title)} cover">`:'<div class="buy-cover-placeholder">📚</div>'}</div><div class="buy-item-body"><div class="buy-item-title">${esc(b.title||'Untitled')}</div><div class="buy-item-author">${esc(b.author||'Unknown author')}</div>${b.price?`<div class="buy-price">💰 ${esc(b.price)}</div>`:''}${b.notes?`<div class="buy-notes">📝 ${esc(b.notes)}</div>`:''}<div class="buy-actions"><button class="btn" data-edit="${esc(b.id)}">Edit</button><button class="btn" data-delete="${esc(b.id)}">Delete</button></div></div></article>`).join('');
    list.querySelectorAll('[data-edit]').forEach(btn=>btn.onclick=()=>{const b=books.find(x=>x.id===btn.dataset.edit);if(b)openForm(b)});
    list.querySelectorAll('[data-delete]').forEach(btn=>btn.onclick=()=>{const b=books.find(x=>x.id===btn.dataset.delete);if(b&&confirm(`Remove “${b.title}” from Books to Buy?`)){books=books.filter(x=>x.id!==b.id);save();render();cloudSave();}});
  }

  function init(){
    if(!$('buyPanel')||!$('addBuyBookBtn'))return; load(); injectStyles(); $('addBuyBookBtn').onclick=()=>openForm(); render(); initCloud();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
