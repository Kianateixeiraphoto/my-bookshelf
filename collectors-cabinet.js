(() => {
'use strict';
const panel=document.getElementById('collectorPanel');if(!panel)return;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const types=['Deluxe','Signed','Limited','Kickstarter','Retailer Exclusive','Special Omnibus','Other'];
const statuses=['Wishlist','Preordered','Owned','Sold / Gifted'];
const features=['Sprayed Edges','Foil Stamping','Signed','Numbered','Illustrated Endpapers','Bonus Content','Exclusive Artwork','Slipcase','Other'];
let query='',filter='All',editing='',open=false,notice='';
const rows=()=>{if(!Array.isArray(state.collectorEditions))state.collectorEditions=[];return state.collectorEditions};
const books=()=>Array.isArray(state.books)?state.books:[];
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
const safe=s=>{try{const u=new URL(String(s));return ['https:','http:'].includes(u.protocol)?String(s):''}catch{return ''}};
const opts=(arr,v)=>arr.map(x=>'<option value="'+E(x)+'"'+(x===v?' selected':'')+'>'+E(x)+'</option>').join('');
const field=(label,name,v,type='text')=>'<label>'+label+'<input name="'+name+'" type="'+type+'" value="'+E(v??'')+'"'+(type==='number'?' min="0" step="0.01"':'')+'></label>';
const styles=document.createElement('style');
styles.textContent='#collectorPanel{background:linear-gradient(145deg,#10271e,#284a39);color:#f4ead8;border:1px solid #a99569;border-radius:20px;padding:clamp(15px,3vw,28px)}#collectorPanel .cc-hero{text-align:center;padding:24px 10px;border-bottom:1px solid #98835d}#collectorPanel h2,#collectorPanel h3{font-family:Georgia,serif;font-weight:normal}#collectorPanel h2{font-size:clamp(30px,5vw,45px);color:#f4e5c8}#collectorPanel .cc-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}#collectorPanel .cc-stat{background:#2b4939;border:1px solid #807c5d;border-radius:12px;text-align:center;padding:15px}#collectorPanel .cc-stat strong{display:block;font:normal 26px Georgia,serif;color:#f1d7a4}#collectorPanel .cc-stat small{color:#e3d5bd}#collectorPanel .cc-toolbar{display:flex;flex-wrap:wrap;gap:9px;margin:18px 0}#collectorPanel button{cursor:pointer;border:1px solid #b9a478;border-radius:9px;background:#e9d7b3;color:#284637;padding:9px 12px}#collectorPanel button:hover{background:#fff0cf}#collectorPanel input,#collectorPanel select,#collectorPanel textarea{background:#fff9ed;color:#284637;border:1px solid #b9a478;border-radius:9px;padding:9px;max-width:100%}#collectorPanel #ccSearch{flex:1;min-width:180px}#collectorPanel .cc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}#collectorPanel .cc-card,#collectorPanel .cc-editor{background:#f3e8d4;color:#284637;border:1px solid #c8b58e;border-radius:14px;overflow:hidden}#collectorPanel .cc-cover{height:360px;background:#e9dec9;display:flex;align-items:center;justify-content:center;font-size:56px;padding:16px}#collectorPanel .cc-cover img{display:block;width:100%;height:100%;object-fit:contain;object-position:center}#collectorPanel .cc-body,#collectorPanel .cc-editor{padding:20px}#collectorPanel .cc-body h3{margin:0 0 7px;font-size:25px;line-height:1.2}#collectorPanel .cc-muted{color:#687c6c;font-size:12px}#collectorPanel .cc-pill{display:inline-block;background:#d9e4d2;border-radius:20px;padding:4px 9px;margin:6px 5px 6px 0;font-size:12px}#collectorPanel .cc-editor{margin:16px 0}#collectorPanel .cc-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#collectorPanel .cc-form label{display:flex;flex-direction:column;gap:5px;font-size:13px;min-width:0}#collectorPanel .cc-form label input,#collectorPanel .cc-form label select,#collectorPanel .cc-form label textarea{width:100%}#collectorPanel .cc-wide{grid-column:1/-1}#collectorPanel .cc-checks{display:flex;gap:9px;flex-wrap:wrap}#collectorPanel .cc-checks label{display:inline-flex;flex-direction:row;align-items:center}#collectorPanel .cc-checks input{width:auto!important}#collectorPanel .cc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#collectorPanel .cc-notice{padding:10px;border:1px solid #c8b58e;border-radius:10px;margin:10px 0}#collectorPanel .cc-empty{text-align:center;padding:28px;border:1px dashed #aa966d;border-radius:12px}@media(max-width:850px){#collectorPanel .cc-cover{height:300px}}@media(max-width:600px){#collectorPanel .cc-grid,#collectorPanel .cc-form{grid-template-columns:1fr}#collectorPanel .cc-cover{height:340px}#collectorPanel .cc-stats{grid-template-columns:repeat(2,1fr)}#collectorPanel .cc-wide{grid-column:auto}}';
styles.textContent+='#collectorPanel .cc-card{display:flex;flex-direction:column}#collectorPanel .cc-body{display:flex;flex-direction:column;gap:15px;flex:1;padding:23px}#collectorPanel .cc-identity{border-bottom:1px solid #d3c19f;padding-bottom:14px}#collectorPanel .cc-body h3{font-size:clamp(24px,2.6vw,30px);margin:0 0 8px;color:#1e4233;overflow-wrap:anywhere}#collectorPanel .cc-author{font-size:15px;color:#526a58;margin:0 0 12px}#collectorPanel .cc-edition{font:normal 19px Georgia,serif;color:#3b6045}#collectorPanel .cc-badges{display:flex;flex-wrap:wrap;gap:8px}#collectorPanel .cc-pill{margin:0;padding:7px 12px;font-size:13px;font-weight:600;background:#e3e5d4;color:#31533d;border:1px solid #c8d1b8}#collectorPanel .cc-status{background:#d2e4d5;border-color:#acc5ae}#collectorPanel .cc-info-block{padding:14px;background:#fbf5e9;border:1px solid #ddcbaa;border-radius:11px}#collectorPanel .cc-info-block h4{font:normal 17px Georgia,serif;color:#31543d;margin:0 0 11px}#collectorPanel .cc-feature-list{display:flex;flex-wrap:wrap;gap:7px}#collectorPanel .cc-feature{font-size:13px;color:#36583f;background:#e7ebdf;border-radius:7px;padding:6px 9px;line-height:1.3}#collectorPanel .cc-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}#collectorPanel .cc-detail{display:flex;flex-direction:column;gap:4px;overflow-wrap:anywhere}#collectorPanel .cc-detail span{font-size:12px;color:#677b68}#collectorPanel .cc-detail strong{font-size:15px;color:#254937;font-weight:600}#collectorPanel .cc-linked{font-size:13px;color:#355e42;background:#e4eadb;padding:10px 12px;border-radius:9px}#collectorPanel .cc-notes{font-size:14px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;margin:0}#collectorPanel .cc-actions{margin-top:auto;padding-top:14px;border-top:1px solid #d3c19f}#collectorPanel .cc-actions button{font-size:13px;padding:9px 13px}@media(max-width:600px){#collectorPanel .cc-body{padding:17px}#collectorPanel .cc-details{grid-template-columns:1fr}}';
document.head.appendChild(styles);
function form(b={}){
return '<div class="cc-editor"><h3>'+(b.id?'Edit Edition':'✦ Add Special Edition')+'</h3><form id="ccForm"><div class="cc-form">'+
field('Book title *','title',b.title)+field('Author *','author',b.author)+field('Edition name *','edition',b.edition)+
'<label>Edition type<select name="type">'+opts(types,b.type||'Deluxe')+'</select></label>'+
'<label>Collection status<select name="status">'+opts(statuses,b.status||'Wishlist')+'</select></label>'+
'<label>Link to Bookshelf (optional)<select name="bookId"><option value="">Standalone collectible</option>'+books().map(x=>'<option value="'+E(x.id)+'"'+(String(x.id)===String(b.bookId||'')?' selected':'')+'>'+E(x.title+' — '+(x.author||''))+'</option>').join('')+'</select></label>'+
field('Publisher / seller','seller',b.seller)+field('Price paid (USD)','pricePaid',b.pricePaid,'number')+
field('Purchase date','purchaseDate',b.purchaseDate,'date')+field('Expected arrival','arrivalDate',b.arrivalDate,'date')+
field('Cover image URL','cover',b.cover,'url')+
'<label>Upload cover (optional, 5 MB max)<input name="coverFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label>'+
'<div class="cc-wide"><p>Special features</p><div class="cc-checks">'+features.map(x=>'<label><input type="checkbox" name="features" value="'+E(x)+'"'+((b.features||[]).includes(x)?' checked':'')+'>'+E(x)+'</label>').join('')+'</div></div>'+
'<label class="cc-wide">Notes<textarea name="notes" rows="3">'+E(b.notes||'')+'</textarea></label></div>'+
'<div class="cc-actions"><button type="submit" id="ccSave">Save Edition</button><button type="button" id="ccCancel">Cancel</button></div><p id="ccMessage" role="status"></p></form></div>';
}
function card(b){
const url=safe(b.cover);
const tags=(b.features||[]).map(x=>'<span class="cc-feature">'+E(x)+'</span>').join('');
const details=[
b.seller?'<div class="cc-detail"><span>Seller</span><strong>'+E(b.seller)+'</strong></div>':'',
b.pricePaid!==null&&b.pricePaid!==undefined&&b.pricePaid!==''?'<div class="cc-detail"><span>Price paid</span><strong>'+money(b.pricePaid)+'</strong></div>':'',
b.purchaseDate?'<div class="cc-detail"><span>Purchased</span><strong>'+E(b.purchaseDate)+'</strong></div>':'',
b.arrivalDate?'<div class="cc-detail"><span>Expected arrival</span><strong>'+E(b.arrivalDate)+'</strong></div>':''
].filter(Boolean).join('');
return '<article class="cc-card"><div class="cc-cover">'+(url?'<img src="'+E(url)+'" alt="Cover of '+E(b.title)+'" loading="lazy">':'📚')+'</div>'+
'<div class="cc-body"><div class="cc-identity"><h3>'+E(b.title)+'</h3><p class="cc-author">by '+E(b.author)+'</p><div class="cc-edition">'+E(b.edition)+'</div></div>'+
'<div class="cc-badges"><span class="cc-pill cc-status">'+E(b.status)+'</span><span class="cc-pill">'+E(b.type||'Other')+'</span></div>'+
(tags?'<div class="cc-info-block"><h4>✦ Special features</h4><div class="cc-feature-list">'+tags+'</div></div>':'')+
(details?'<div class="cc-info-block"><h4>Purchase details</h4><div class="cc-details">'+details+'</div></div>':'')+
(b.bookId?'<div class="cc-linked">✓ Linked to My Bookshelf</div>':'')+
(b.notes?'<div class="cc-info-block"><h4>Collector’s notes</h4><p class="cc-notes">'+E(b.notes)+'</p></div>':'')+
'<div class="cc-actions"><button data-edit="'+E(b.id)+'">Edit edition</button><button data-delete="'+E(b.id)+'">Delete</button></div></div></article>';
}
function render(){
const all=rows(),shown=all.filter(b=>(filter==='All'||b.status===filter)&&[b.title,b.author,b.edition].join(' ').toLowerCase().includes(query.toLowerCase()));
const stats=[['Owned editions',all.filter(b=>b.status==='Owned').length],['Preorders',all.filter(b=>b.status==='Preordered').length],['Wishlist',all.filter(b=>b.status==='Wishlist').length],['Recorded spending',money(all.filter(b=>b.status!=='Wishlist').reduce((sum,b)=>sum+(Number(b.pricePaid)||0),0))]];
panel.innerHTML='<div class="cc-hero"><small>THE FOREST LIBRARY AFTER DARK</small><h2>✦ Collector’s Cabinet ✦</h2><p>For the stories worth collecting twice.</p></div>'+
'<div class="cc-stats">'+stats.map(([name,value])=>'<div class="cc-stat"><strong>'+value+'</strong><small>'+name+'</small></div>').join('')+'</div>'+
(notice?'<div class="cc-notice" role="status">'+E(notice)+'</div>':'')+
'<div class="cc-toolbar"><button id="ccAdd">+ Add Special Edition</button><input id="ccSearch" type="search" placeholder="Search title, author, edition…" value="'+E(query)+'"><select id="ccFilter">'+opts(['All','Owned','Preordered','Wishlist','Sold / Gifted'],filter)+'</select></div>'+
(open?form(rows().find(b=>b.id===editing)||{}):'')+
(shown.length?'<div class="cc-grid">'+shown.map(card).join('')+'</div>':'<div class="cc-empty">No special editions here yet. Add your first collectible! ✨</div>');
panel.querySelector('#ccAdd').addEventListener('click',()=>{editing='';open=!open;notice='';render()});
panel.querySelector('#ccSearch').addEventListener('input',e=>{query=e.target.value;const p=e.target.selectionStart;render();const el=panel.querySelector('#ccSearch');el.focus();el.setSelectionRange(p,p)});
panel.querySelector('#ccFilter').addEventListener('change',e=>{filter=e.target.value;render()});
panel.querySelector('#ccCancel')?.addEventListener('click',()=>{open=false;editing='';render()});
panel.querySelector('#ccForm')?.addEventListener('submit',save);
panel.querySelectorAll('[data-edit]').forEach(btn=>btn.addEventListener('click',()=>{editing=btn.dataset.edit;open=true;notice='';render()}));
panel.querySelectorAll('[data-delete]').forEach(btn=>btn.addEventListener('click',async()=>{const b=rows().find(x=>x.id===btn.dataset.delete);if(!b||!confirm('Delete this collectible edition? Your Bookshelf book will not be deleted.'))return;state.collectorEditions=rows().filter(x=>x.id!==b.id);saveLocal();notice='Edition deleted locally.';render();try{if(session){await sync();notice='Edition deleted and synced.'}else notice='Edition deleted locally. Sign in to sync.'}catch(err){notice='Saved locally; cloud sync failed: '+(err.message||err)}render()}));
}
async function save(event){
event.preventDefault();const form=event.currentTarget,fd=new FormData(form),msg=form.querySelector('#ccMessage'),button=form.querySelector('#ccSave');
const title=String(fd.get('title')||'').trim(),author=String(fd.get('author')||'').trim(),edition=String(fd.get('edition')||'').trim();
if(!title||!author||!edition){msg.textContent='Title, author and edition name are required.';return}
const raw=String(fd.get('pricePaid')||'').trim(),pricePaid=raw===''?null:Number(raw);
if(pricePaid!==null&&(!Number.isFinite(pricePaid)||pricePaid<0)){msg.textContent='Price must be a nonnegative number.';return}
let cover=String(fd.get('cover')||'').trim();
if(cover&&!safe(cover)){msg.textContent='Please enter an http or https cover URL.';return}
button.disabled=true;msg.textContent='Saving…';
try{
const file=form.querySelector('[name=coverFile]').files[0];
if(file){
if(!session?.user?.id)throw Error('Sign in before uploading a cover, or use a cover URL.');
if(file.size>5*1024*1024)throw Error('Cover must be 5 MB or smaller.');
const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'})[file.type];
if(!ext)throw Error('Please upload JPG, PNG, WebP or GIF.');
const path=session.user.id+'/collector-'+crypto.randomUUID()+'.'+ext;
const upload=await bookshelfSupabase.storage.from('book-covers').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
if(upload.error)throw upload.error;
cover=bookshelfSupabase.storage.from('book-covers').getPublicUrl(upload.data.path)?.data?.publicUrl||'';
if(!cover)throw Error('Upload succeeded but no cover URL was returned.');
}
const prior=rows().find(b=>b.id===editing);
const item={...prior,id:prior?.id||crypto.randomUUID(),title,author,edition,type:String(fd.get('type')),status:String(fd.get('status')),bookId:String(fd.get('bookId')||''),seller:String(fd.get('seller')||'').trim(),pricePaid,purchaseDate:String(fd.get('purchaseDate')||''),arrivalDate:String(fd.get('arrivalDate')||''),cover,features:fd.getAll('features').map(String),notes:String(fd.get('notes')||'').trim(),updatedAt:new Date().toISOString()};
if(prior)state.collectorEditions=rows().map(b=>b.id===prior.id?item:b);else rows().push(item);
saveLocal();open=false;editing='';notice='Edition saved locally.';render();
try{if(session){await sync();notice='Edition saved and synced to cloud.'}else notice='Edition saved locally. Sign in to sync across devices.'}catch(err){notice='Saved locally, but cloud sync failed: '+(err.message||err)}render();
}catch(err){msg.textContent='Could not save: '+(err.message||err);button.disabled=false}
}
window.renderCollectorCabinet=render;
})();