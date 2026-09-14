/* CLOUD-SYNC-SAFE-V3 — three-way, change-aware sync for My Bookshelf */
(function(){
  if(globalThis.__cloudSyncSafeV3Installed)return;
  globalThis.__cloudSyncSafeV3Installed=true;
  const BASE='my-bookshelf-sync-base-v3:', STORE='my-bookshelf-data-v6', SESSION='my-bookshelf-session-v1';
  let busy=false;
  const clone=v=>{try{return JSON.parse(JSON.stringify(v));}catch(_){return v;}};
  const equal=(a,b)=>{try{return JSON.stringify(a,Object.keys(a||{}).sort())===JSON.stringify(b,Object.keys(b||{}).sort());}catch(_){return String(a)===String(b);}};
  const key=x=>String(x?.title||x?.name||'').trim().toLowerCase()+'|'+String(x?.author||'').trim().toLowerCase()+'|'+String(x?.url||x?.link||'').trim().toLowerCase();
  const local=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch(_){return {};}};
  const session=()=>{try{return JSON.parse(localStorage.getItem(SESSION)||'null');}catch(_){return null;}};
  function apply(x){localStorage.setItem(STORE,JSON.stringify(clone(x)));if(typeof globalThis.loadLocal==='function')globalThis.loadLocal();}
  const base=uid=>{try{return JSON.parse(localStorage.getItem(BASE+uid)||'null');}catch(_){return null;}};
  const saveBase=(uid,x)=>localStorage.setItem(BASE+uid,JSON.stringify(clone(x)));
  function collection(l,c,b){
    const L=new Map((Array.isArray(l)?l:[]).map(x=>[key(x),x])),C=new Map((Array.isArray(c)?c:[]).map(x=>[key(x),x])),B=new Map((Array.isArray(b)?b:[]).map(x=>[key(x),x])),out=[];
    for(const k of new Set([...L.keys(),...C.keys(),...B.keys()])){
      const x=L.get(k),y=C.get(k),z=B.get(k);
      if(x===undefined&&y===undefined)continue;
      if(x===undefined){if(z!==undefined&&equal(y,z))continue;if(y!==undefined)out.push(clone(y));continue;}
      if(y===undefined){if(z!==undefined&&equal(x,z))continue;if(x!==undefined)out.push(clone(x));continue;}
      if(equal(x,y)){out.push(clone(x));continue;}
      if(z===undefined){out.push(clone(y));if(!equal(x,y))out.push(clone(x));continue;}
      const lx=!equal(x,z),cy=!equal(y,z);
      if(lx&&!cy)out.push(clone(x));else if(cy&&!lx)out.push(clone(y));else if(!lx&&!cy)out.push(clone(y));else out.push({...clone(y),...clone(x)});
    }
    return out;
  }
  function first(l,c){const out={...clone(c||{})};for(const n of ['books','fanfiction','booksToBuy']){const L=Array.isArray(l?.[n])?l[n]:[],C=Array.isArray(c?.[n])?c[n]:[],m=new Map(C.map(x=>[key(x),x]));out[n]=[...C,...L.filter(x=>!m.has(key(x))).map(clone)];}return out;}
  function merge(l,c,b){const out={...clone(c||{})},names=['books','fanfiction','booksToBuy'];names.forEach(n=>out[n]=collection(l[n],c[n],b[n]));for(const k of new Set([...Object.keys(l||{}),...Object.keys(c||{}),...Object.keys(b||{})])){if(names.includes(k))continue;const x=l?.[k],y=c?.[k],z=b?.[k];if(equal(x,y))out[k]=clone(x);else if(equal(x,z))out[k]=clone(y);else if(equal(y,z))out[k]=clone(x);else if(x===undefined)out[k]=clone(y);else if(y===undefined)out[k]=clone(x);else out[k]=clone(x);}return out;}
  async function cloud(s){const u=s.user.id,n='library:'+u;let r=await globalThis.api('/rest/v1/books?select=data,updated_at&user_id=eq.'+encodeURIComponent(u)+'&id=eq.'+encodeURIComponent(n));if(!r?.length)r=await globalThis.api('/rest/v1/books?select=data,updated_at&user_id=eq.'+encodeURIComponent(u)+'&id=eq.library');return r?.[0]||null;}
  async function saveCloud(s,data){const u=s.user.id,n='library:'+u,now=new Date().toISOString();let r=await globalThis.api('/rest/v1/books?select=id&user_id=eq.'+encodeURIComponent(u)+'&id=eq.'+encodeURIComponent(n));if(r?.length){await globalThis.api('/rest/v1/books?id='+encodeURIComponent(n)+'&user_id='+encodeURIComponent(u),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({data,updated_at:now})});}else{r=await globalThis.api('/rest/v1/books?select=id&user_id=eq.'+encodeURIComponent(u)+'&id=eq.library');if(r?.length)await globalThis.api('/rest/v1/books?id=eq.library&user_id='+encodeURIComponent(u),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({data,updated_at:now})});else await globalThis.api('/rest/v1/books',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({id:n,user_id:u,data,updated_at:now})});}return cloud(s);}
  async function reconcile(reason){if(busy)return;busy=true;try{const s=session();if(!s?.user?.id){if(typeof globalThis.openAuth==='function')globalThis.openAuth('login');return;}const row=await cloud(s),c=clone(row?.data||{}),l=clone(local()),b=base(s.user.id),m=b?merge(l,c,b):first(l,c);apply(m);if(typeof globalThis.render==='function')globalThis.render();if(!equal(m,c)||!row?.data){const v=await saveCloud(s,m);if(!v?.data)throw new Error('Cloud save could not be verified.');for(const n of ['books','fanfiction','booksToBuy'])if((v.data[n]?.length||0)<(m[n]?.length||0))throw new Error('Cloud verification found fewer '+n+' than expected.');apply(v.data);if(typeof globalThis.render==='function')globalThis.render();}saveBase(s.user.id,local());if(typeof globalThis.$==='function'&&globalThis.$('cloudStatus'))globalThis.$('cloudStatus').textContent='Synced across devices 💕';}catch(e){console.error('V3 sync failed',e);if(typeof globalThis.$==='function'&&globalThis.$('cloudStatus'))globalThis.$('cloudStatus').textContent='Sync failed — your local data is safe';if(reason==='manual')alert('Cloud sync could not be verified. Your local bookshelf was not replaced.\n\n'+(e.message||e));}finally{busy=false;}}
  globalThis.cloudLoad=()=>reconcile('load');
  globalThis.sync=()=>reconcile('manual');
})();