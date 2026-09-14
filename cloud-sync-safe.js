/* CLOUD-SYNC-SAFE-V3.1 */
(function(){
  if(globalThis.__cloudSyncSafeV31Installed)return;
  globalThis.__cloudSyncSafeV31Installed=true;
  const STORE='my-bookshelf-data-v6',BASE='my-bookshelf-sync-base-v3:',SESSION='my-bookshelf-session-v1';
  const cp=v=>JSON.parse(JSON.stringify(v)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),key=x=>String(x?.title||x?.name||'').trim().toLowerCase()+'|'+String(x?.author||'').trim().toLowerCase();
  const local=()=>JSON.parse(localStorage.getItem(STORE)||'{}'),sess=()=>JSON.parse(localStorage.getItem(SESSION)||'null'),base=u=>JSON.parse(localStorage.getItem(BASE+u)||'null');
  const put=x=>{localStorage.setItem(STORE,JSON.stringify(cp(x)));if(typeof globalThis.loadLocal==='function')globalThis.loadLocal();};
  const saveBase=(u,x)=>localStorage.setItem(BASE+u,JSON.stringify(cp(x)));
  function arr(l,c,b){const L=new Map((l||[]).map(x=>[key(x),x])),C=new Map((c||[]).map(x=>[key(x),x])),B=new Map((b||[]).map(x=>[key(x),x])),o=[];for(const k of new Set([...L.keys(),...C.keys(),...B.keys()])){const x=L.get(k),y=C.get(k),z=B.get(k);if(x===undefined&&y!==undefined){o.push(cp(y));continue}if(y===undefined&&x!==undefined){o.push(cp(x));continue}if(x===undefined)continue;if(eq(x,y)||!z){o.push(cp(x));continue}if(eq(x,z)){o.push(cp(y));continue}if(eq(y,z)){o.push(cp(x));continue}o.push({...cp(y),...cp(x)})}return o}
  function merge(l,c,b){const o={...cp(c||{})};for(const n of ['books','fanfiction','booksToBuy'])o[n]=arr(l?.[n],c?.[n],b?.[n]);return o}
  async function cloud(s){const u=encodeURIComponent(s.user.id);const r=await globalThis.api('/rest/v1/books?select=data,updated_at&user_id=eq.'+u+'&id=eq.library');return r?.[0]||null}
  async function save(s,data){const u=encodeURIComponent(s.user.id),f='user_id=eq.'+u+'&id=eq.library';const r=await globalThis.api('/rest/v1/books?select=id&'+f),now=new Date().toISOString();if(r?.length)await globalThis.api('/rest/v1/books?'+f,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({data:data,updated_at:now})});else await globalThis.api('/rest/v1/books',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({id:'library',user_id:s.user.id,data:data,updated_at:now})});return cloud(s)}
  async function run(manual){const s=sess();if(!s?.user?.id){if(typeof globalThis.openAuth==='function')globalThis.openAuth('login');return}try{const r=await cloud(s),c=cp(r?.data||{}),l=local(),b=base(s.user.id),m=b?merge(l,c,b):merge(l,c,{});put(m);if(typeof globalThis.render==='function')globalThis.render();const v=eq(m,c)?r:await save(s,m);if(!v?.data)throw Error('Cloud save could not be verified.');put(v.data);if(typeof globalThis.render==='function')globalThis.render();saveBase(s.user.id,v.data);if(globalThis.$&&globalThis.$('cloudStatus'))globalThis.$('cloudStatus').textContent='Synced across devices 💕'}catch(e){console.error(e);if(globalThis.$&&globalThis.$('cloudStatus'))globalThis.$('cloudStatus').textContent='Sync failed — your local data is safe';if(manual)alert('Cloud sync could not be verified. Your local bookshelf was not replaced.\n\n'+(e.message||e))}}
  globalThis.cloudLoad=()=>run(false);globalThis.sync=()=>run(true);
})();
