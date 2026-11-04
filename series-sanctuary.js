/* Series Sanctuary — Phase 1. Series metadata is separate from existing book records. */
(() => {
'use strict';
const panel=document.getElementById('seriesPanel');if(!panel)return;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const statuses=['Want to Read','Maybe Someday','Skip','Waiting for Release','Read','Currently Reading','DNF'];
const ownerships=['Not Owned','Owned','Preordered'];
const releaseKinds=['Unknown','Confirmed','Tentative'];
const releaseKind=b=>releaseKinds.includes(b.releaseKind)?b.releaseKind:'Unknown';
const releaseDate=b=>/^\d{4}-\d{2}-\d{2}$/.test(b.releaseDate||'')?b.releaseDate:'';
const localToday=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const released=b=>releaseKind(b)==='Confirmed'&&releaseDate(b)&&releaseDate(b)<=localToday();
const awaiting=b=>(b.status==='Waiting for Release'&&!released(b))||(releaseKind(b)!=='Unknown'&&releaseDate(b)&&releaseDate(b)>localToday());
const duePreorder=b=>ownershipOf(b)==='Preordered'&&released(b);
const dateLabel=b=>releaseDate(b)?new Date(releaseDate(b)+'T12:00:00').toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'TBA';
const countdown=b=>{if(releaseKind(b)!=='Confirmed'||!releaseDate(b)||releaseDate(b)<=localToday())return '';const days=Math.round((new Date(releaseDate(b)+'T12:00:00')-new Date(localToday()+'T12:00:00'))/86400000);return days+' day'+(days===1?'':'s')+' left'};
const ownershipOf=b=>ownerships.includes(b.ownership)?b.ownership:(b.preordered?'Preordered':b.linked?'Owned':'Not Owned');
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
#seriesPanel .ss-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:start}
#seriesPanel .ss-card{background:#f3e8d4;color:#30493b;border:1px solid #c7b58d;border-radius:14px;padding:18px;min-width:0;align-self:start}
#seriesPanel .ss-card h4{font:normal 22px Georgia,serif;color:#284637;margin:0 0 4px}
#seriesPanel .ss-card .ss-muted{color:#647266}
#seriesPanel .ss-pill{display:inline-block;background:#e0d2b4;color:#355441;border-radius:15px;padding:4px 9px;font-size:12px;margin:5px 5px 5px 0}
#seriesPanel .ss-progress{height:9px;border-radius:10px;background:#d2c7af;overflow:hidden;margin:10px 0}
#seriesPanel .ss-progress span{display:block;height:100%;background:#537c5e}
#seriesPanel .ss-book{border-top:1px solid #d2c4a8;padding:12px 0;display:grid;grid-template-columns:minmax(0,1fr) minmax(130px,170px);gap:10px;align-items:center}
#seriesPanel .ss-book select{width:100%}
#seriesPanel .ss-book-main{display:flex;align-items:flex-start;gap:12px;min-width:0}
#seriesPanel .ss-book-info{flex:1;min-width:0;overflow-wrap:anywhere}
#seriesPanel .ss-cover{width:62px;height:92px;flex:0 0 62px;border-radius:7px;border:1px solid #bca985;object-fit:cover;background:#dbe2d0}
#seriesPanel .ss-cover-placeholder{width:62px;height:92px;flex:0 0 62px;display:flex;align-items:center;justify-content:center;border-radius:7px;border:1px solid #bca985;background:linear-gradient(150deg,#d7dfc7,#e9d9b7);font-size:27px}
#seriesPanel .ss-cover-tools{grid-column:1/-1;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#seriesPanel .ss-cover-tools button{font-size:12px;padding:6px 9px}
#seriesPanel .ss-cover-tools .ss-muted{font-size:11px}
#seriesPanel .ss-number{display:flex;align-items:center;gap:7px;grid-column:1/-1;flex-wrap:wrap}
#seriesPanel .ss-number label{font-size:12px;color:#46614e}
#seriesPanel .ss-detail .ss-number input{width:90px;max-width:90px;padding:7px}
#seriesPanel .ss-wish .ss-cover,#seriesPanel .ss-wish .ss-cover-placeholder{width:48px;height:72px;flex-basis:48px}

#seriesPanel .ss-book textarea{grid-column:1/-1;width:100%;min-height:60px}
#seriesPanel .ss-detail{margin-top:13px;border-top:1px solid #d2c4a8;padding-top:12px}
#seriesPanel .ss-detail label{display:block;font-size:12px;margin:8px 0 4px}
#seriesPanel .ss-detail input,#seriesPanel .ss-detail select{width:100%}
#seriesPanel .ss-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
#seriesPanel .ss-wishlist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0 26px}
#seriesPanel .ss-wish{background:#f3e8d4;color:#30493b;border:1px solid #c7b58d;border-radius:12px;padding:14px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px}
#seriesPanel .ss-wish strong{font:normal 19px Georgia,serif;color:#284637}
#seriesPanel .ss-wish .ss-muted{color:#647266}
#seriesPanel .ss-ownership{display:flex;align-items:center;gap:8px;grid-column:1/-1;flex-wrap:wrap}
#seriesPanel .ss-ownership label{font-size:12px;margin:0;color:#46614e}
#seriesPanel .ss-ownership select{flex:1;min-width:140px;max-width:220px}
#seriesPanel .ss-preorder{display:inline-block;background:#d7e5d1;color:#28533b;border-radius:14px;padding:3px 8px;font-size:12px;margin:5px 0}
#seriesPanel .ss-release-toggle{grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#seriesPanel .ss-release-toggle button{font-size:12px;padding:6px 10px}
#seriesPanel .ss-release-fields{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
#seriesPanel .ss-release-fields label{font-size:12px;color:#46614e;margin:0}
#seriesPanel .ss-release-fields input,#seriesPanel .ss-release-fields select{width:100%;margin-top:5px}
#seriesPanel .ss-release-summary{grid-column:1/-1;font-size:12px;color:#46614e}
#seriesPanel .ss-upcoming{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0 25px}
#seriesPanel .ss-upcoming-card{background:#f3e8d4;color:#284637;border:1px solid #c7b58d;border-radius:12px;padding:13px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
#seriesPanel .ss-upcoming-card .ss-muted{color:#566b5b}
#seriesPanel .ss-upcoming-card button{margin-left:auto}
#seriesPanel .ss-reminder{grid-column:1/-1;border:1px solid #b6a16f;background:#e8d9b5;color:#294637;border-radius:10px;padding:10px}
#seriesPanel .ss-empty{padding:25px;text-align:center;border:1px dashed #b49c6a;border-radius:14px}
@media(max-width:760px){#seriesPanel .ss-upcoming{grid-template-columns:1fr}#seriesPanel .ss-wishlist{grid-template-columns:1fr}#seriesPanel .ss-grid{grid-template-columns:1fr}#seriesPanel .ss-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;document.head.appendChild(styles);
let search='',filter='all',expanded='';
const releaseEditorOpen=new Set();
const store=()=>{if(!state.seriesSanctuary||typeof state.seriesSanctuary!=='object')state.seriesSanctuary={series:[]};if(!Array.isArray(state.seriesSanctuary.series))state.seriesSanctuary.series=[];return state.seriesSanctuary.series};
const slug=s=>String(s||'').trim().toLowerCase();
const library=()=>Array.isArray(state.books)?state.books:[];
const groups=()=>{const map=new Map();for(const b of library()){if(!slug(b.series))continue;const k=slug(b.series);if(!map.has(k))map.set(k,{name:b.series,author:b.author||'',books:[]});map.get(k).books.push(b)}return map};
const entries=()=>{const out=[...store()];for(const [key,g] of groups())if(!out.some(x=>slug(x.name)===key))out.push({id:'auto:'+key,name:g.name,author:g.author,kind:'Interconnected Standalones',publication:'Unknown',personal:'Exploring',books:[]});return out.sort((a,b)=>a.name.localeCompare(b.name))};
const linked=s=>groups().get(slug(s.name))?.books||[];
const shelfBook=b=>b.key?.startsWith('library:')?library().find(x=>'library:'+x.id===b.key):null;
const coverOf=b=>{const x=shelfBook(b);return x?.cover||b.cover||''};
const safeCover=url=>{if(typeof url!=='string')return '';const v=url.trim();if(/^data:image\/(?:png|jpeg|jpg|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(v))return v;try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)?v:''}catch{return ''}};
const coverHtml=b=>{const url=safeCover(coverOf(b));return url?'<img class="ss-cover" loading="lazy" src="'+E(url)+'" alt="Cover of '+E(b.title)+'" onerror="this.style.display=\'none\';this.insertAdjacentHTML(\'afterend\',\'<span class=&quot;ss-cover-placeholder&quot;>📚</span>\')">':'<span class="ss-cover-placeholder" aria-label="Cover not selected">📚</span>'};

const bookKey=(s,b)=>b.key||('extra:'+slug(b.title));
const inBookshelf=(s,b)=>library().some(x=>slug(x.title)===slug(b.title)&&slug(x.author||s.author)===slug(s.author));
const allBooks=s=>{const items=new Map();for(const b of linked(s))items.set('library:'+b.id,{key:'library:'+b.id,title:b.title||'Untitled',number:b.bookNumber||'',status:b.status==='Read'?'Read':b.status==='Currently Reading'?'Currently Reading':b.status==='DNF'?'DNF':'Want to Read',linked:true});for(const b of s.books||[]){const k=b.key||('extra:'+slug(b.title));if(!items.has(k)){const linkedEntry=[...items.values()].find(x=>x.linked&&slug(x.title)===slug(b.title));if(linkedEntry){items.set(linkedEntry.key,{...linkedEntry,...b,key:linkedEntry.key,linked:true});}else items.set(k,{...b,key:k,linked:false})}else items.set(k,{...items.get(k),...b,key:k})}return [...items.values()].sort((a,b)=>(Number(a.number)||999)-(Number(b.number)||999))};
const active=b=>!['Skip','Maybe Someday','DNF'].includes(b.status);
const finished=b=>b.status==='Read';
function editable(s){let saved=store().find(x=>x.id===s.id);if(saved)return saved;const obj={id:s.id,name:s.name,author:s.author||'',kind:s.kind||'Interconnected Standalones',publication:s.publication||'Unknown',personal:s.personal||'Exploring',books:[]};store().push(obj);return obj}
async function persist(){saveLocal();render();try{if(session)await sync()}catch(e){console.error('Series Sanctuary cloud save failed',e)}}
let calendarOpen=false,calendarFilter='All',calendarSelected='';
const calendarNow=new Date();
let calendarYear=calendarNow.getFullYear(),calendarMonth=calendarNow.getMonth();
const calendarKey=(y,m,d)=>y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
const calendarItems=all=>all.flatMap(s=>allBooks(s).filter(b=>releaseDate(b)).map(b=>({s,b})));
function calendarMarkup(all){
 const items=calendarItems(all),monthItems=items.filter(x=>releaseDate(x.b).slice(0,7)===calendarKey(calendarYear,calendarMonth,1).slice(0,7)&& (calendarFilter==='All'||releaseKind(x.b)===calendarFilter));
 const monthTitle=new Date(calendarYear,calendarMonth,1).toLocaleDateString(undefined,{month:'long',year:'numeric'});
 const first=new Date(calendarYear,calendarMonth,1).getDay(),length=new Date(calendarYear,calendarMonth+1,0).getDate();
 const selectedItems=monthItems.filter(x=>releaseDate(x.b)===calendarSelected);
 const tba=all.flatMap(s=>allBooks(s).filter(b=>b.status==='Waiting for Release'&&!releaseDate(b)).map(b=>({s,b})));
 let html='<section class="ss-calendar"><div class="ss-calendar-heading"><div><h3>📅 Your Release Calendar</h3><div class="ss-muted">Every new story has its moment.</div></div><button id="ssCalendarToggle" type="button" aria-expanded="'+calendarOpen+'">'+(calendarOpen?'▴ Collapse calendar':'▾ Open calendar')+'</button></div>';
 if(!calendarOpen)return html+'</section>';
 html+='<div class="ss-calendar-inner"><div class="ss-calendar-nav"><button id="ssCalPrev" type="button" aria-label="Previous month">‹</button><strong>'+E(monthTitle)+'</strong><button id="ssCalNext" type="button" aria-label="Next month">›</button><button id="ssCalToday" type="button">Today</button></div><div class="ss-calendar-filter"><label for="ssCalFilter">Show</label>'+select(calendarFilter,['All','Confirmed','Tentative'],'id="ssCalFilter"')+'</div><div class="ss-calendar-grid">';
 for(const day of ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'])html+='<div class="ss-calendar-weekday">'+day+'</div>';
 for(let i=0;i<first;i++)html+='<div class="ss-calendar-blank"></div>';
 for(let d=1;d<=length;d++){const date=calendarKey(calendarYear,calendarMonth,d),events=monthItems.filter(x=>releaseDate(x.b)===date),confirmed=events.some(x=>releaseKind(x.b)==='Confirmed'),tentative=events.some(x=>releaseKind(x.b)==='Tentative');html+='<button type="button" class="ss-calendar-day'+(date===calendarSelected?' selected':'')+'" data-cal-day="'+date+'" aria-label="'+E(date)+(events.length?' '+events.length+' releases':'')+'"><span>'+d+'</span>'+(events.length?'<small>'+events.length+' 📖</small>':'')+(confirmed?'<i class="ss-dot-confirmed"></i>':'')+(tentative?'<i class="ss-dot-tentative"></i>':'')+'</button>'}
 html+='</div><div class="ss-calendar-legend"><span>● Confirmed</span><span>◇ Tentative</span></div>';
 if(calendarSelected){html+='<div class="ss-calendar-selected"><h4>'+E(new Date(calendarSelected+'T12:00:00').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'}))+'</h4>'+(selectedItems.length?selectedItems.map(({s,b})=>calendarBookCard(s,b)).join(''):'<div class="ss-muted">No releases for this date with the selected filter.</div>')+'</div>'}
 html+='<div class="ss-calendar-tba"><h4>🕯️ Waiting for a Date (TBA)</h4>'+(tba.length?tba.map(({s,b})=>calendarBookCard(s,b)).join(''):'<div class="ss-muted">No undated waiting-for-release books.</div>')+'</div></div></section>';
 return html;
}
function calendarBookCard(s,b){return '<div class="ss-calendar-book">'+coverHtml(b)+'<div class="ss-calendar-book-text"><strong>'+E(b.title)+'</strong><div class="ss-muted">'+E(s.name)+'</div><div>'+E(releaseDate(b)?releaseKind(b)+' · '+dateLabel(b):'Date TBA')+'</div><span class="ss-pill">'+E(ownershipOf(b))+'</span></div>'+(duePreorder(b)?'<button type="button" data-received="'+E(s.id)+'" data-key="'+E(b.key)+'">📦 Received it?</button>':'')+'</div>'}
const filterOptions=[['all','All series'],['Exploring','Exploring'],['Reading','Reading'],['Waiting for Completion','Waiting for Completion'],['Finished','Marked Finished']];
const filterSelect=()=>'<select id="ssFilter" aria-label="Filter series">'+filterOptions.map(([value,label])=>'<option value="'+E(value)+'" '+(value===filter?'selected':'')+'>'+E(label)+'</option>').join('')+'</select>';
const select=(value,choices,attr)=>'<select '+attr+'>'+choices.map(x=>'<option value="'+E(x)+'" '+(x===value?'selected':'')+'>'+E(x)+'</option>').join('')+'</select>';
function render(){
const all=entries(),list=all.filter(s=>(s.name+' '+s.author).toLowerCase().includes(search)&& (filter==='all'||s.personal===filter||filter==='waiting'&&s.personal==='Waiting for Completion'||filter==='completed'&&s.personal==='Finished'));
const waiting=all.filter(s=>s.personal==='Waiting for Completion').length;
const complete=all.filter(s=>s.personal==='Finished'&&allBooks(s).filter(active).length>0&&allBooks(s).filter(active).every(finished)).length;
const releaseBooks=all.flatMap(s=>allBooks(s).filter(b=>awaiting(b)||duePreorder(b)).map(b=>({s,b}))).sort((a,b)=>(releaseDate(a.b)||'9999').localeCompare(releaseDate(b.b)||'9999'));
const upcoming=all.flatMap(s=>allBooks(s).filter(awaiting)).length;
const wishlist=all.flatMap(s=>allBooks(s).filter(b=>!b.linked&&['Want to Read','Waiting for Release'].includes(b.status)).map(b=>({s,b})));
panel.innerHTML='<div class="ss-hero"><small style="letter-spacing:.2em;color:#d9bc87">THE FOREST LIBRARY AFTER DARK</small><h2>🌙 Series Sanctuary</h2><p>Every story deserves its ending. You choose which stories are yours.</p></div>'+
'<div class="ss-metrics"><div class="ss-metric"><strong>'+all.length+'</strong><small>Series tracked</small></div><div class="ss-metric"><strong>'+waiting+'</strong><small>Waiting room</small></div><div class="ss-metric"><strong>'+complete+'</strong><small>Confirmed paths complete</small></div><div class="ss-metric"><strong>'+upcoming+'</strong><small>Awaiting release</small></div></div>'+
'<h3>💚 Want to Read from My Series</h3><div class="ss-muted">Your series-only reading wishlist. Adding a book to your Bookshelf is always your choice.</div>'+
(wishlist.length?'<div class="ss-wishlist">'+wishlist.map(({s,b})=>'<div class="ss-wish"><div style="display:flex;gap:10px;align-items:center">'+coverHtml(b)+'<div><strong>'+E(b.title)+'</strong><div class="ss-muted">'+E(s.name)+(s.author?' · '+E(s.author):'')+'</div><span class="ss-pill">'+E(b.status)+'</span>'+(ownershipOf(b)==='Preordered'?'<span class="ss-preorder">✓ Already preordered</span>':'')+'</div></div><button data-to-shelf="'+E(s.id)+'" data-key="'+E(b.key)+'">+ Add to My Bookshelf</button></div>').join('')+'</div>':'<div class="ss-muted" style="margin:12px 0 24px">No series-only books on your reading wishlist yet. Add a book to a series and mark it Want to Read or Waiting for Release.</div>')+
'<h3>🌿 Your Series Collection</h3><div class="ss-muted">Series already named in your bookshelf appear automatically. Add missing books without creating duplicate bookshelf records.</div>'+
'<div class="ss-toolbar"><input id="ssSearch" type="search" placeholder="Search series or author…" value="'+E(search)+'">'+filterSelect()+'<button id="ssAdd">+ Add Series</button></div>'+
(list.length?'<div class="ss-grid">'+list.map(s=>card(s)).join('')+'</div>':'<div class="ss-empty">No matching series yet. Add a series to begin your collection. 🌱</div>')+
'<h3 style="margin-top:25px">📅 Upcoming Releases & Preorders</h3><div class="ss-muted">Dates are entered by you. Tentative dates are not guaranteed. Preorders stay preordered until you confirm receipt.</div>'+(releaseBooks.length?'<div class="ss-upcoming">'+releaseBooks.map(({s,b})=>'<div class="ss-upcoming-card">'+coverHtml(b)+'<div style="flex:1;min-width:120px"><strong>'+E(b.title)+'</strong><div class="ss-muted">'+E(s.name)+'</div><div>'+E(releaseKind(b)==='Unknown'?'Date TBA':releaseKind(b)+' · '+dateLabel(b))+'</div>'+(countdown(b)?'<div>'+E(countdown(b))+'</div>':'')+(ownershipOf(b)==='Preordered'?'<span class="ss-preorder">Preordered</span>':'')+'</div>'+(duePreorder(b)?'<button data-received="'+E(s.id)+'" data-key="'+E(b.key)+'">📦 Received it?</button>':'')+'</div>').join('')+'</div>':'<div class="ss-muted" style="margin:12px 0 25px">No upcoming releases or outstanding preorders yet.</div>');
panel.querySelector('#ssSearch').addEventListener('input',e=>{search=e.target.value;const start=e.target.selectionStart;render();const field=panel.querySelector('#ssSearch');field.focus();field.setSelectionRange(start,start)});
panel.querySelector('#ssFilter').addEventListener('change',e=>{filter=e.target.value;render()});
panel.querySelector('#ssAdd').addEventListener('click',()=>{const name=prompt('Series name?');if(!name?.trim())return;const existing=entries().find(s=>slug(s.name)===slug(name));if(existing){expanded=existing.id;render();return}const author=prompt('Author (optional)?')||'';const obj={id:crypto.randomUUID(),name:name.trim(),author:author.trim(),kind:'Interconnected Standalones',publication:'Unknown',personal:'Exploring',books:[]};store().push(obj);expanded=obj.id;persist()});
panel.querySelectorAll('[data-open]').forEach(btn=>btn.addEventListener('click',()=>{expanded=expanded===btn.dataset.open?'':btn.dataset.open;render()}));
panel.querySelectorAll('[data-meta]').forEach(el=>el.addEventListener('change',()=>{const s=entries().find(x=>x.id===el.dataset.meta);if(!s)return;const obj=editable(s);obj[el.dataset.field]=el.value;persist()}));
panel.querySelectorAll('[data-book-status]').forEach(el=>el.addEventListener('change',()=>{const s=entries().find(x=>x.id===el.dataset.bookStatus);if(!s)return;const obj=editable(s),key=el.dataset.key;let b=obj.books.find(x=>x.key===key);if(!b){const orig=allBooks(s).find(x=>x.key===key);b={...orig};obj.books.push(b)}b.status=el.value;persist()}));
panel.querySelectorAll('[data-book-note]').forEach(el=>el.addEventListener('change',()=>{const s=entries().find(x=>x.id===el.dataset.bookNote);if(!s)return;const obj=editable(s),key=el.dataset.key;let b=obj.books.find(x=>x.key===key);if(!b){b={...allBooks(s).find(x=>x.key===key)};obj.books.push(b)}b.skipReason=el.value;persist()}));
panel.querySelectorAll('[data-to-shelf]').forEach(btn=>btn.addEventListener('click',()=>{const s=entries().find(x=>x.id===btn.dataset.toShelf);if(!s)return;const b=allBooks(s).find(x=>x.key===btn.dataset.key);if(!b)return;if(inBookshelf(s,b)){alert('This book is already in your Bookshelf. No duplicate was added.');return}if(typeof window.addBook!=='function'){alert('The Bookshelf editor is unavailable right now.');return}window.addBook({title:b.title,author:s.author||'',series:s.name,bookNumber:b.number||'',status:'Unread'});}));
panel.querySelectorAll('[data-ownership]').forEach(el=>el.addEventListener('change',()=>{const s=entries().find(x=>x.id===el.dataset.ownership);if(!s)return;const obj=editable(s),key=el.dataset.key;let b=obj.books.find(x=>x.key===key);if(!b){const orig=allBooks(s).find(x=>x.key===key);if(!orig)return;b={...orig};obj.books.push(b)}b.ownership=el.value;b.preordered=el.value==='Preordered';persist()}));
panel.querySelectorAll('[data-toggle-release]').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.toggleRelease+'|'+btn.dataset.key;if(releaseEditorOpen.has(key))releaseEditorOpen.delete(key);else releaseEditorOpen.add(key);render()}));
panel.querySelectorAll('[data-release-kind],[data-release-date]').forEach(el=>el.addEventListener('change',()=>{const s=entries().find(x=>x.id===(el.dataset.releaseKind||el.dataset.releaseDate));if(!s)return;const orig=allBooks(s).find(x=>x.key===el.dataset.key);if(!orig)return;const obj=editable(s);let b=obj.books.find(x=>x.key===orig.key);if(!b){b={...orig};obj.books.push(b)}if(el.dataset.releaseKind)b.releaseKind=el.value;else b.releaseDate=el.value;persist()}));
panel.querySelectorAll('[data-received]').forEach(btn=>btn.addEventListener('click',()=>{const s=entries().find(x=>x.id===btn.dataset.received);if(!s)return;const orig=allBooks(s).find(x=>x.key===btn.dataset.key);if(!orig||!confirm('Have you received '+orig.title+'? This changes its ownership to Owned.'))return;const obj=editable(s);let b=obj.books.find(x=>x.key===orig.key);if(!b){b={...orig};obj.books.push(b)}b.ownership='Owned';b.preordered=false;persist()}));
panel.querySelectorAll('[data-cover-search]').forEach(btn=>btn.addEventListener('click',()=>{const s=entries().find(x=>x.id===btn.dataset.coverSearch);const b=s&&allBooks(s).find(x=>x.key===btn.dataset.key);if(!b)return;const q=[b.title,s.author,'book cover'].filter(Boolean).join(' ');window.open('https://www.google.com/search?tbm=isch&q='+encodeURIComponent(q),'_blank','noopener,noreferrer')}));
panel.querySelectorAll('[data-cover-url]').forEach(btn=>btn.addEventListener('click',()=>{const s=entries().find(x=>x.id===btn.dataset.coverUrl);if(!s)return;const b=allBooks(s).find(x=>x.key===btn.dataset.key);if(!b)return;const url=prompt('Paste the direct image address for '+b.title+' (https://...jpg/png/webp):',b.cover||'');if(url===null)return;const trimmed=url.trim();if(trimmed&&!/^https?:\/\//i.test(trimmed)){alert('Please use a direct http:// or https:// image URL.');return}const obj=editable(s);let saved=obj.books.find(x=>x.key===b.key);if(!saved){saved={...b};obj.books.push(saved)}saved.cover=trimmed;persist()}));
panel.querySelectorAll('[data-number]').forEach(el=>el.addEventListener('change',()=>{const s=entries().find(x=>x.id===el.dataset.number);if(!s)return;const b=allBooks(s).find(x=>x.key===el.dataset.key);if(!b)return;const obj=editable(s);let saved=obj.books.find(x=>x.key===b.key);if(!saved){saved={...b};obj.books.push(saved)}saved.number=el.value.trim();persist()}));
panel.querySelectorAll('[data-add-book]').forEach(btn=>btn.addEventListener('click',()=>{const s=entries().find(x=>x.id===btn.dataset.addBook);if(!s)return;const title=prompt('Book title?');if(!title?.trim())return;const number=prompt('Book number (optional)?')||'';const obj=editable(s);obj.books.push({key:'extra:'+crypto.randomUUID(),title:title.trim(),number:number.trim(),status:'Want to Read',ownership:'Not Owned',skipReason:''});expanded=obj.id;persist()}));
}
function card(s){const books=allBooks(s),path=books.filter(active),read=path.filter(finished).length,pct=path.length?Math.round(read/path.length*100):0,open=expanded===s.id;return '<section class="ss-card"><h4>'+E(s.name)+'</h4><div class="ss-muted">'+E(s.author||'Author not specified')+'</div><span class="ss-pill">'+E(s.kind||'Interconnected Standalones')+'</span><span class="ss-pill">'+E(s.personal||'Exploring')+'</span><div style="font-size:13px;margin-top:8px">'+read+' of '+path.length+' on your reading path · '+books.filter(b=>b.status==='Skip').length+' skipped</div><div class="ss-progress"><span style="width:'+pct+'%"></span></div><button data-open="'+E(s.id)+'">'+(open?'Close details':'View reading path')+'</button>'+(open?'<div class="ss-detail"><label>Your series status</label>'+select(s.personal||'Exploring',['Exploring','Reading','Waiting for Completion','Finished'],'data-meta="'+E(s.id)+'" data-field="personal"')+'<label>Reading order</label>'+select(s.kind||'Interconnected Standalones',['Interconnected Standalones','Sequential Series','Flexible / Recommended Order'],'data-meta="'+E(s.id)+'" data-field="kind"')+'<label>Publication status</label>'+select(s.publication||'Unknown',['Unknown','Ongoing','Complete','Hiatus'],'data-meta="'+E(s.id)+'" data-field="publication"')+'<h4 style="margin-top:18px">Books in this series</h4>'+(books.length?books.map(b=>'<div class="ss-book"><div class="ss-book-main">'+coverHtml(b)+'<div class="ss-book-info"><strong>'+E(b.number?('#'+b.number+' · '):'')+E(b.title)+'</strong><div class="ss-muted">'+(b.linked?'Linked to My Bookshelf':'Series-only entry')+'</div></div></div>'+select(b.status||'Want to Read',statuses,'data-book-status="'+E(s.id)+'" data-key="'+E(b.key)+'"')+'<div class="ss-number"><label>Reading order #</label><input data-number="'+E(s.id)+'" data-key="'+E(b.key)+'" type="text" value="'+E(b.number||'')+'" placeholder="e.g. 2.5" aria-label="Reading order for '+E(b.title)+'"></div><div class="ss-cover-tools"><button type="button" data-cover-search="'+E(s.id)+'" data-key="'+E(b.key)+'">🔎 Find Cover</button>'+(b.linked?'<span class="ss-muted">Uses your Bookshelf cover when available</span>':'<button type="button" data-cover-url="'+E(s.id)+'" data-key="'+E(b.key)+'">'+(b.cover?'Change / Remove Cover':'Paste Cover URL')+'</button>')+'</div><div class="ss-ownership"><label>Ownership</label>'+select(ownershipOf(b),ownerships,'data-ownership="'+E(s.id)+'" data-key="'+E(b.key)+'"')+(ownershipOf(b)==='Preordered'?'<span class="ss-preorder">✓ Already preordered</span>':'')+'</div>'+(ownershipOf(b)!=='Preordered'?'<div class="ss-release-toggle"><button type="button" data-toggle-release="'+E(s.id)+'" data-key="'+E(b.key)+'">'+(releaseEditorOpen.has(s.id+'|'+b.key)?'▾ Hide Release Details':'📅 Track Release')+'</button>'+(releaseDate(b)?'<span class="ss-muted">'+E(releaseKind(b)+' · '+dateLabel(b))+'</span>':'')+'</div>':'')+((ownershipOf(b)==='Preordered'||releaseEditorOpen.has(s.id+'|'+b.key))?'<div class="ss-release-fields"><label>Release date status'+select(releaseKind(b),releaseKinds,'data-release-kind="'+E(s.id)+'" data-key="'+E(b.key)+'"')+'</label><label>Release date<input type="date" data-release-date="'+E(s.id)+'" data-key="'+E(b.key)+'" value="'+E(releaseDate(b))+'"></label></div><div class="ss-release-summary">'+E(releaseKind(b)==='Unknown'?'Date not confirmed':releaseKind(b)+' · '+dateLabel(b))+(countdown(b)?' · '+E(countdown(b)):'')+'</div>':'')+(duePreorder(b)?'<div class="ss-reminder">📦 This preorder has reached its confirmed release date. Have you received it? <button data-received="'+E(s.id)+'" data-key="'+E(b.key)+'">Yes, mark Owned</button></div>':'')+(b.status==='Skip'?'<textarea data-book-note="'+E(s.id)+'" data-key="'+E(b.key)+'" placeholder="Why did I skip this book?">'+E(b.skipReason||'')+'</textarea>':'')+'</div>').join(''):'<p class="ss-muted">No books linked yet.</p>')+'<div class="ss-actions"><button data-add-book="'+E(s.id)+'">+ Add a book to this series</button></div></div>':'')+'</section>'}
window.renderSeriesSanctuary=render;
})();
