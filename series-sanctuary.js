/* Series Sanctuary — Phase 1. Series metadata is separate from existing book records. */
(() => {
'use strict';
const panel=document.getElementById('seriesPanel');if(!panel)return;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const statuses=['Want to Read','Maybe Someday','Skip','Waiting for Release','Read','Currently Reading','DNF'];
const styles=document.createElement('style');styles.textContent=`
#seriesPanel{background:linear-gradient(145deg,#10261f,#244436 65%,#132b24);border:1px solid #a7976c;border-radius:20px;padding:clamp(15px,3vw,30px);color:#f4ead8}
#seriesPanel .ss-hero{text-align:center;padding:26px 12px 30px;background:radial-gradient(ellipse at top,#43634b 0%,transparent 75%);border-bottom:1px solid #99885f}
#seriesPanel h2{font:normal clamp(33px,5vw,49px) Georgia,serif;color:#f5e7cc;margin:8px 0}
#seriesPanel h3{font:normal 24px Georgia,serif;color:#f0dfbc;margin:10px 0}
#seriesPanel .ss-muted{color:#d5c6aa;font-size:13px}
#seriesPanel .ss-toolbar{display:flex;flex-wrap:wrap;gap:10px;margin:22px 0}
#seriesPanel input,#seriesPanel select,#seriesPanel textarea{background:#fff9ee;color:#284337;border:1px solid #b9a67c;border-radius:9px;padding:10px;font:inherit;max-width:100%}
#seriesPanel input[type=search]{flex:1;min-width:170px}
#seriesPanel button{cursor:pointer;border:1px solid #b9a67c;background:#e9d7b3;color:#264334;border-radius:9px;padding:9px 13px;font:inherit}
#seriesPanel button:hover{background:#fff1d3}
#seriesPanel .ss-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:20px 0}
#seriesPanel .ss-metric{background:#294639;border:1px solid #807d5b;border-radius:12px;padding:16px;text-align:center}
#seriesPanel .ss-metric strong{display:block;font:normal 29px Georgia,serif;color:#f0d7a2}
#seriesPanel .ss-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
#seriesPanel .ss-card{background:#f3e8d4;color:#30493b;border:1px solid #c7b58d;border-radius:14px;padding:18px;min-width:0}
#seriesPanel .ss-card h4{font:normal 22px Georgia,serif;color:#284637;margin:0 0 4px}
#seriesPanel .ss-card .ss-muted{color:#647266}
#seriesPanel .ss-pill{display:inline-block;background:#e0d2b4;color:#355441;border-radius:15px;padding:4px 9px;font-size:12px;margin:5px 5px 5px 0}
#seriesPanel .ss-progress{height:9px;border-radius:10px;background:#d2c7af;overflow:hidden;margin:10px 0}
#seriesPanel .ss-progress span{display:block;height:100%;background:#537c5e}
#seriesPanel .ss-book{border-top:1px solid #d2c4a8;padding:12px 0;display:grid;grid-template-columns:minmax(0,1fr) minmax(130px,170px);gap:10px;align-items:center}
#seriesPanel .ss-book select{width:100%}
#seriesPanel .ss-book textarea{grid-column:1/-1;width:100%;min-height:60px}
#seriesPanel .ss-detail{margin-top:13px;border-top:1px solid #d2c4a8;padding-top:12px}
#seriesPanel .ss-detail label{display:block;font-size:12px;margin:8px 0 4px}
#seriesPanel .ss-detail input,#seriesPanel .ss-detail select{width:100%}
#seriesPanel .ss-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
#seriesPanel .ss-empty{padding:25px;text-align:center;border:1px dashed #b49c6a;border-radius:14px}
@media(max-width:760px){#seriesPanel .ss-grid{grid-template-columns:1fr}#seriesPanel .ss-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;document.head.appendChild(styles);
let search='',filter='all',expanded='';
const store=()=>{if(!state.seriesSanctuary||typeof state.seriesSanctuary!=='object')state.seriesSanctuary={series:[]};if(!Array.isArray(state.seriesSanctuary.series))state.seriesSanctuary.series=[];return state.seriesSanctuary.series};
const slug=s=>String(s||'').trim().toLowerCase();
const library=()=>Array.isArray(state.books)?state.books:[];
const groups=()=>{const map=new Map();for(const b of library()){if(!slug(b.series))continue;const k=slug(b.series);if(!map.has(k))map.set(k,{name:b.series,author:b.author||'',books:[]});map.get(k).books.push(b)}return map};
const entries=()=>{const out=[...store()];for(const [key,g] of groups())if(!out.some(x=>slug(x.name)===key))out.push({id:'auto:'+key,name:g.name,author:g.author,kind:'Interconnected Standalones',publication:'Unknown',personal:'Exploring',books:[]});return out.sort((a,b)=>a.name.localeCompare(b.name))};
const linked=s=>groups().get(slug(s.name))?.books||[];
const allBooks=s=>{const items=new Map();for(const b of linked(s))items.set('library:'+b.id,{key:'library:'+b.id,title:b.title||'Untitled',number:b.bookNumber||'',status:b.status==='Read'?'Read':b.status==='Currently Reading'?'Currently Reading':b.status==='DNF'?'DNF':'Want to Read',linked:true});for(const b of s.books||[]){const k=b.key||('extra:'+slug(b.title));if(!items.has(k))items.set(k,{...b,key:k,linked:false});else items.set(k,{...items.get(k),...b,key:k})}return [...items.values()].sort((a,b)=>(Number(a.number)||999)-(Number(b.number)||999))};
const active=b=>!['Skip','Maybe Someday','DNF'].includes(b.status);
const finished=b=>b.status==='Read';
function editable(s){let saved=store().find(x=>x.id===s.id);if(saved)return saved;const obj={id:s.id,name:s.name,author:s.author||'',kind:s.kind||'Interconnected Standalones',publication:s.publication||'Unknown',personal:s.personal||'Exploring',books:[]};store().push(obj);return obj}
async function persist(){saveLocal();render();try{if(session)await sync()}catch(e){console.error('Series Sanctuary cloud save failed',e)}}
const select=(value,choices,attr)=>'<select '+attr+'>'+choices.map(x=>'<option value="'+E(x)+'" '+(x===value?'selected':'')+'>'+E(x)+'</option>').join('')+'</select>';
function render(){
const all=entries(),list=all.filter(s=>(s.name+' '+s.author).toLowerCase().includes(search)&& (filter==='all'||s.personal===filter||filter==='waiting'&&s.personal==='Waiting for Completion'||filter==='completed'&&allBooks(s).filter(active).length>0&&allBooks(s).filter(active).every(finished)));
const waiting=all.filter(s=>s.personal==='Waiting for Completion').length;
const complete=all.filter(s=>allBooks(s).filter(active).length>0&&allBooks(s).filter(active).every(finished)).length;
const upcoming=all.flatMap(s=>allBooks(s).filter(b=>b.status==='Waiting for Release')).length;
panel.innerHTML='<div class="ss-hero"><small style="letter-spacing:.2em;color:#d9bc87">THE FOREST LIBRARY AFTER DARK</small><h2>🌙 Series Sanctuary</h2><p>Every story deserves its ending. You choose which stories are yours.</p></div>'+
'<div class="ss-metrics"><div class="ss-metric"><strong>'+all.length+'</strong><small>Series tracked</small></div><div class="ss-metric"><strong>'+waiting+'</strong><small>Waiting room</small></div><div class="ss-metric"><strong>'+complete+'</strong><small>Your paths complete</small></div><div class="ss-metric"><strong>'+upcoming+'</strong><small>Awaiting release</small></div></div>'+
'<h3>🌿 Your Series Collection</h3><div class="ss-muted">Series already named in your bookshelf appear automatically. Add missing books without creating duplicate bookshelf records.</div>'+
'<div class="ss-toolbar"><input id="ssSearch" type="search" placeholder="Search series or author…" value="'+E(search)+'">'+select(filter,['all','Exploring','Reading','Waiting for Completion','Finished','waiting','completed'],'id="ssFilter"')+'<button id="ssAdd">+ Add Series</button></div>'+
(list.length?'<div class="ss-grid">'+list.map(s=>card(s)).join('')+'</div>':'<div class="ss-empty">No matching series yet. Add a series to begin your collection. 🌱</div>')+
'<h3 style="margin-top:25px">📅 Upcoming Releases</h3><div class="ss-muted">Books you mark “Waiting for Release” appear in your series. Verified dates and calendar views are planned for Phase 3.</div>';
panel.querySelector('#ssSearch').addEventListener('input',e=>{search=e.target.value;const start=e.target.selectionStart;render();const field=panel.querySelector('#ssSearch');field.focus();field.setSelectionRange(start,start)});
panel.querySelector('#ssFilter').addEventListener('change',e=>{filter=e.target.value;render()});
panel.querySelector('#ssAdd').addEventListener('click',()=>{const name=prompt('Series name?');if(!name?.trim())return;const existing=entries().find(s=>slug(s.name)===slug(name));if(existing){expanded=existing.id;render();return}const author=prompt('Author (optional)?')||'';const obj={id:crypto.randomUUID(),name:name.trim(),author:author.trim(),kind:'Interconnected Standalones',publication:'Unknown',personal:'Exploring',books:[]};store().push(obj);expanded=obj.id;persist()});
panel.querySelectorAll('[data-open]').forEach(btn=>btn.addEventListener('click',()=>{expanded=expanded===btn.dataset.open?'':btn.dataset.open;render()}));
panel.querySelectorAll('[data-meta]').forEach(el=>el.addEventListener('change',()=>{const s=entries().find(x=>x.id===el.dataset.meta);if(!s)return;const obj=editable(s);obj[el.dataset.field]=el.value;persist()}));
panel.querySelectorAll('[data-book-status]').forEach(el=>el.addEventListener('change',()=>{const s=entries().find(x=>x.id===el.dataset.bookStatus);if(!s)return;const obj=editable(s),key=el.dataset.key;let b=obj.books.find(x=>x.key===key);if(!b){const orig=allBooks(s).find(x=>x.key===key);b={...orig};obj.books.push(b)}b.status=el.value;persist()}));
panel.querySelectorAll('[data-book-note]').forEach(el=>el.addEventListener('change',()=>{const s=entries().find(x=>x.id===el.dataset.bookNote);if(!s)return;const obj=editable(s),key=el.dataset.key;let b=obj.books.find(x=>x.key===key);if(!b){b={...allBooks(s).find(x=>x.key===key)};obj.books.push(b)}b.skipReason=el.value;persist()}));
panel.querySelectorAll('[data-add-book]').forEach(btn=>btn.addEventListener('click',()=>{const s=entries().find(x=>x.id===btn.dataset.addBook);if(!s)return;const title=prompt('Book title?');if(!title?.trim())return;const number=prompt('Book number (optional)?')||'';const obj=editable(s);obj.books.push({key:'extra:'+crypto.randomUUID(),title:title.trim(),number:number.trim(),status:'Want to Read',skipReason:''});expanded=obj.id;persist()}));
}
function card(s){const books=allBooks(s),path=books.filter(active),read=path.filter(finished).length,pct=path.length?Math.round(read/path.length*100):0,open=expanded===s.id;return '<section class="ss-card"><h4>'+E(s.name)+'</h4><div class="ss-muted">'+E(s.author||'Author not specified')+'</div><span class="ss-pill">'+E(s.kind||'Interconnected Standalones')+'</span><span class="ss-pill">'+E(s.personal||'Exploring')+'</span><div style="font-size:13px;margin-top:8px">'+read+' of '+path.length+' on your reading path · '+books.filter(b=>b.status==='Skip').length+' skipped</div><div class="ss-progress"><span style="width:'+pct+'%"></span></div><button data-open="'+E(s.id)+'">'+(open?'Close details':'View reading path')+'</button>'+(open?'<div class="ss-detail"><label>Your series status</label>'+select(s.personal||'Exploring',['Exploring','Reading','Waiting for Completion','Finished'],'data-meta="'+E(s.id)+'" data-field="personal"')+'<label>Reading order</label>'+select(s.kind||'Interconnected Standalones',['Interconnected Standalones','Sequential Series','Flexible / Recommended Order'],'data-meta="'+E(s.id)+'" data-field="kind"')+'<label>Publication status</label>'+select(s.publication||'Unknown',['Unknown','Ongoing','Complete','Hiatus'],'data-meta="'+E(s.id)+'" data-field="publication"')+'<h4 style="margin-top:18px">Books in this series</h4>'+(books.length?books.map(b=>'<div class="ss-book"><div><strong>'+E(b.number?('#'+b.number+' · '):'')+E(b.title)+'</strong><div class="ss-muted">'+(b.linked?'Linked to My Bookshelf':'Series-only entry')+'</div></div>'+select(b.status||'Want to Read',statuses,'data-book-status="'+E(s.id)+'" data-key="'+E(b.key)+'"')+(b.status==='Skip'?'<textarea data-book-note="'+E(s.id)+'" data-key="'+E(b.key)+'" placeholder="Why did I skip this book?">'+E(b.skipReason||'')+'</textarea>':'')+'</div>').join(''):'<p class="ss-muted">No books linked yet.</p>')+'<div class="ss-actions"><button data-add-book="'+E(s.id)+'">+ Add a book to this series</button></div></div>':'')+'</section>'}
window.renderSeriesSanctuary=render;
})();
