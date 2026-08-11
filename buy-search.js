/* My Bookshelf — Books to Buy title/author lookup */
(() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const score = (title,author,item) => {
    const t=norm(title), it=norm(item.title||'');
    let n=t===it?100:(it.includes(t)||t.includes(it)?75:0);
    if(author && item.authors?.length){const a=norm(author);n+=Math.max(...item.authors.map(x=>{const b=norm(x);return a===b?40:(a.includes(b)||b.includes(a)||b.includes(a.split(' ').pop())?25:0)}));}
    return n;
  };
  async function google(title,author){
    const q=`intitle:${title}${author?` inauthor:${author}`:''}`;
    const r=await fetch(`https://www.googleapis.com/books/v1/volumes?${new URLSearchParams({q,maxResults:'10',printType:'books'})}`); if(!r.ok)throw Error('Google Books failed');
    const d=await r.json();
    return (d.items||[]).map(v=>{const i=v.volumeInfo||{},img=i.imageLinks?.extraLarge||i.imageLinks?.large||i.imageLinks?.medium||i.imageLinks?.thumbnail;return img?{title:i.title||'',authors:i.authors||[],cover:img.replace(/^http:/,'https:'),description:i.description||'',link:i.infoLink||'',published:i.publishedDate||'',score:score(title,author,{title:i.title,authors:i.authors||[]})}:null}).filter(Boolean);
  }
  async function openLibrary(title,author){
    const p=new URLSearchParams({title,limit:'10'});if(author)p.set('author',author);
    const r=await fetch(`https://openlibrary.org/search.json?${p}`);if(!r.ok)throw Error('Open Library failed');const d=await r.json();
    return (d.docs||[]).map(x=>x.cover_i?{title:x.title||'',authors:x.author_name||[],cover:`https://covers.openlibrary.org/b/id/${x.cover_i}-L.jpg`,description:'',link:x.key?`https://openlibrary.org${x.key}`:'',published:x.first_publish_year?String(x.first_publish_year):'',score:score(title,author,{title:x.title,authors:x.author_name||[]})}:null).filter(Boolean);
  }
  async function lookup(title,author){
    const all=[];try{all.push(...await google(title,author))}catch{}try{all.push(...await openLibrary(title,author))}catch{}
    const seen=new Set();return all.sort((a,b)=>b.score-a.score).filter(x=>{const k=x.cover;if(seen.has(k))return false;seen.add(k);return x.score>=(author?40:35)}).slice(0,8);
  }
  function install(){
    if(typeof window.addBuy!=='function' || window.addBuy.__lookupWrapped)return;
    const original=window.addBuy;
    const wrapped=function(){
      openModal(`<div class="row"><h2>🛍️ Add to Buy List</h2><button class="btn" type="button" id="buyCancel">Cancel</button></div><form id="buyForm" class="form-grid"><div class="wide" style="display:grid;grid-template-columns:1fr auto;gap:8px"><input name="title" placeholder="Book title" required><button class="btn" type="button" id="buyLookup">🔎 Look Up Book</button></div><input name="author" placeholder="Author" required><div id="buyLookupStatus" class="status wide">Enter the title and author, then look it up to fill the book details.</div><div id="buyResults" class="wide"></div><input class="wide" name="link" placeholder="Book/store link (optional)"><textarea class="wide" name="summary" placeholder="Summary (optional)"></textarea><button class="btn" type="button" id="buyCancel2">Cancel</button><button class="btn primary" type="submit">Add to Buy List</button></form>`);
      const form=$('buyForm'),status=$('buyLookupStatus'),results=$('buyResults');
      const close=()=>closeModal();$('buyCancel').onclick=close;$('buyCancel2').onclick=close;
      $('buyLookup').onclick=async()=>{
        const title=form.elements.title.value.trim(),author=form.elements.author.value.trim();if(!title){status.textContent='Add the book title first. 💕';return}
        status.textContent=`Looking up “${title}”${author?` by ${author}`:''}…`;results.innerHTML='';$('buyLookup').disabled=true;
        try{const matches=await lookup(title,author);if(!matches.length){status.textContent='I couldn’t find a strong match. Try the title/author again or enter it manually.';return}
          status.textContent=`Found ${matches.length} possible match${matches.length===1?'':'es'} — choose the one you want. 💕`;
          results.innerHTML='<div class="buy-lookup-results">'+matches.map((m,i)=>`<button type="button" class="buy-lookup-card" data-i="${i}"><img src="${esc(m.cover)}" alt=""><span><b>${esc(m.title)}</b><small>${esc(m.authors.join(', '))}</small>${m.published?`<small>${esc(m.published)}</small>`:''}</span></button>`).join('')+'</div>';
          results.querySelectorAll('.buy-lookup-card').forEach(btn=>btn.onclick=()=>{const m=matches[Number(btn.dataset.i)];form.elements.title.value=m.title;form.elements.author.value=m.authors.join(', ');form.elements.link.value=m.link||'';form.elements.summary.value=m.description||'';form.dataset.cover=m.cover||'';results.querySelectorAll('.buy-lookup-card').forEach(x=>x.classList.remove('selected'));btn.classList.add('selected');status.textContent='✓ Book selected. Add it to your Buy List when you’re ready. 💕';});
        }catch(e){status.textContent='The book lookup is temporarily unavailable. You can still enter the book manually.'}finally{$('buyLookup').disabled=false}
      };
      form.onsubmit=e=>{e.preventDefault();const x=Object.fromEntries(new FormData(form).entries());const selectedCover=form.dataset.cover||'';state.buy.push({...x,cover:selectedCover});saveLocal();closeModal();render();sync()};
    };
    wrapped.__lookupWrapped=true;window.addBuy=wrapped;
  }
  function styles(){if($('buyLookupStyles'))return;const s=document.createElement('style');s.id='buyLookupStyles';s.textContent=`#buyResults{min-width:0}.buy-lookup-results{display:flex;gap:9px;overflow-x:auto;padding:8px 2px}.buy-lookup-card{flex:0 0 110px;width:110px;border:1px solid var(--line);border-radius:13px;background:#fff8fb;padding:7px;text-align:left;color:var(--ink);cursor:pointer}.buy-lookup-card:hover{border-color:var(--accent);transform:translateY(-1px)}.buy-lookup-card.selected{border:2px solid var(--accent);background:#fde7ef}.buy-lookup-card img{width:94px;height:128px;object-fit:contain;background:#fcecf3;border-radius:8px;display:block;margin-bottom:6px}.buy-lookup-card b,.buy-lookup-card small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.buy-lookup-card b{font-size:10px}.buy-lookup-card small{font-size:9px;color:var(--muted);margin-top:2px}@media(max-width:600px){#buyForm>div:first-child{grid-template-columns:1fr!important}.buy-lookup-card{flex-basis:96px;width:96px}.buy-lookup-card img{width:80px;height:112px}}`;document.head.appendChild(s)}
  const start=()=>{styles();install()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,0));else setTimeout(start,0);new MutationObserver(()=>install()).observe(document.body,{childList:true,subtree:true});
})();