/* CLOUD-SYNC-SAFE-V7 — unique item IDs + deletion-aware three-way merge */
(function(){
  if(globalThis.__cloudSyncSafeV7Installed)return;
  globalThis.__cloudSyncSafeV7Installed=true;
  const BASE='my-bookshelf-sync-base-v7:';
  const SUPA='https://ctnsusnfzclqnaloimzu.supabase.co';
  const KEY='sb_publishable_awbAAru2iWbHsjabVF83Gw_FhpiSG0z';
  const cp=v=>{try{return JSON.parse(JSON.stringify(v));}catch(_){return v;}};
  const eq=(a,b)=>{try{return JSON.stringify(a)===JSON.stringify(b);}catch(_){return String(a)===String(b);}};
  const fallbackKey=x=>String(x?.title||x?.name||'').trim().toLowerCase()+'|'+String(x?.author||'').trim().toLowerCase()+'|'+String(x?.url||x?.link||'').trim().toLowerCase();
  const key=x=>{const id=String(x?.id||'').trim();return id?'id:'+id.toLowerCase():'legacy:'+fallbackKey(x);};
  const freshId=()=>crypto.randomUUID?crypto.randomUUID():'book-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  function normalizeCollection(arr){
    const seen=new Set();
    return (Array.isArray(arr)?arr:[]).map(item=>{
      const x=cp(item)||{};let id=String(x.id||'').trim();
      if(!id||seen.has(id.toLowerCase())){do{id=freshId();}while(seen.has(id.toLowerCase()));x.id=id;}
      seen.add(id.toLowerCase());return x;
    });
  }
  function normalizeState(x){const out=cp(x||{});out.books=normalizeCollection(out.books);out.fanfiction=normalizeCollection(out.fanfiction);out.booksToBuy=normalizeCollection(out.booksToBuy);return out;}
  const readBase=u=>{try{const v7=localStorage.getItem(BASE+u);if(v7)return JSON.parse(v7);const old=localStorage.getItem('my-bookshelf-sync-base-v6:'+u)||localStorage.getItem('my-bookshelf-sync-base-v5:'+u);return old?JSON.parse(old):null;}catch(_){return null;}};
  const saveBase=(u,x)=>{try{localStorage.setItem(BASE+u,JSON.stringify(cp(x)));}catch(_) {}};
  let busy=false;

  function getState(){try{if(typeof state!=='undefined')return normalizeState(state);}catch(_){}return normalizeState({});}
  function setState(x){const n=normalizeState(x);try{if(typeof state!=='undefined')state=n;}catch(_){}try{if(typeof saveLocal==='function')saveLocal();}catch(_){}try{if(typeof render==='function')render();}catch(_){} }
  function setStatus(text){try{if(typeof $==='function'&&$('cloudStatus'))$('cloudStatus').textContent=text;}catch(_){} }

  function findStoredSession(){
    const preferred=['my-bookshelf-supabase-auth'];const keys=[];try{for(let i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));}catch(_){}
    for(const k of [...preferred,...keys.filter(k=>k&&k!==preferred[0])]){if(!k)continue;if(k!==preferred[0]&&!/supabase|sb-.*auth|auth\.token/i.test(k))continue;try{const raw=localStorage.getItem(k);if(!raw)continue;const obj=JSON.parse(raw);const s=obj?.currentSession||obj?.session||obj;if(s?.access_token&&s?.user?.id)return s;}catch(_){} }return null;
  }
  async function getSession(){
    try{if(typeof session!=='undefined'&&session?.user?.id&&session?.access_token)return session;}catch(_){}
    try{const stored=findStoredSession();if(stored){try{if(typeof session!=='undefined')session=stored;}catch(_){}try{if(typeof setSession==='function')setSession(stored);}catch(_){}return stored;}}catch(_){}
    try{if(globalThis.supabase?.createClient){if(!getSession.client)getSession.client=globalThis.supabase.createClient(SUPA,KEY,{auth:{persistSession:true,autoRefreshToken:true,storage:localStorage,storageKey:'my-bookshelf-supabase-auth'}});const r=await getSession.client.auth.getSession(),s=r?.data?.session;if(s?.user?.id&&s?.access_token){try{if(typeof session!=='undefined')session=s;}catch(_){}try{if(typeof setSession==='function')setSession(s);}catch(_){}return s;}}}catch(e){console.warn('Could not restore Supabase session',e);}return null;
  }
  async function refreshSession(s){if(s?.access_token)return s;if(!s?.refresh_token)return s;try{const r=await fetch(SUPA+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});if(!r.ok)return s;const n=await r.json();if(n?.access_token&&n?.user?.id){try{if(typeof session!=='undefined')session=n;}catch(_){}try{if(typeof setSession==='function')setSession(n);}catch(_){}return n;}}catch(_){}return s;}
  async function rest(s,path,opts){let r=await fetch(SUPA+path,{...opts,headers:{apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',...(opts?.headers||{})}});if(r.status===401&&s.refresh_token){const fresh=await refreshSession({...s,access_token:null});if(fresh?.access_token&&fresh.access_token!==s.access_token){s.access_token=fresh.access_token;s.refresh_token=fresh.refresh_token||s.refresh_token;r=await fetch(SUPA+path,{...opts,headers:{apikey:KEY,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json',...(opts?.headers||{})}});}}const text=await r.text();if(!r.ok)throw new Error('Supabase '+r.status+': '+text.slice(0,300));if(!text)return null;try{return JSON.parse(text);}catch(_){return text;}}
  async function getCloud(s){const u=encodeURIComponent(s.user.id);const r=await rest(s,'/rest/v1/books?select=data,updated_at&user_id=eq.'+u+'&id=eq.library');return Array.isArray(r)?(r[0]||null):null;}
  async function writeCloud(s,data){const u=encodeURIComponent(s.user.id),f='user_id=eq.'+u+'&id=eq.library',now=new Date().toISOString();const existing=await rest(s,'/rest/v1/books?select=id&'+f);if(Array.isArray(existing)&&existing.length)await rest(s,'/rest/v1/books?'+f,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({data,updated_at:now})});else await rest(s,'/rest/v1/books',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({id:'library',user_id:s.user.id,data,updated_at:now})});return getCloud(s);}
  function mergeCollection(local,cloud,base){const L=new Map((Array.isArray(local)?local:[]).map(x=>[key(x),x])),C=new Map((Array.isArray(cloud)?cloud:[]).map(x=>[key(x),x])),B=new Map((Array.isArray(base)?base:[]).map(x=>[key(x),x])),out=[];for(const k of new Set([...L.keys(),...C.keys(),...B.keys()])){const l=L.get(k),c=C.get(k),b=B.get(k);if(l===undefined&&c===undefined)continue;if(l===undefined){if(b!==undefined&&eq(c,b))continue;out.push(cp(c));continue;}if(c===undefined){if(b!==undefined&&eq(l,b))continue;out.push(cp(l));continue;}if(eq(l,c)){out.push(cp(l));continue;}if(b===undefined){out.push({...cp(c),...cp(l)});continue;}const localChanged=!eq(l,b),cloudChanged=!eq(c,b);if(localChanged&&!cloudChanged)out.push(cp(l));else if(cloudChanged&&!localChanged)out.push(cp(c));else if(!localChanged&&!cloudChanged)out.push(cp(c));else out.push({...cp(c),...cp(l)});}return normalizeCollection(out);}
  function merge(local,cloud,base){const L=normalizeState(local),C=normalizeState(cloud),B=normalizeState(base),out={...cp(C)};for(const n of ['books','fanfiction','booksToBuy'])out[n]=mergeCollection(L[n],C[n],B[n]);for(const k of new Set([...Object.keys(L),...Object.keys(C),...Object.keys(B)])){if(['books','fanfiction','booksToBuy'].includes(k))continue;const l=L[k],c=C[k],b=B[k];if(eq(l,c))out[k]=cp(l);else if(eq(l,b))out[k]=cp(c);else if(eq(c,b))out[k]=cp(l);else if(l!==undefined&&c!==undefined)out[k]=cp(l);else out[k]=cp(l!==undefined?l:c);}return normalizeState(out);}
  async function run(manual){if(busy)return;busy=true;try{setStatus('Syncing across devices…');let s=await getSession();if(!s?.user?.id){if(typeof openAuth==='function')openAuth('login');return;}s=await refreshSession(s);if(!s?.access_token)throw new Error('Your sign-in session could not be restored.');const row=await getCloud(s),cloud=normalizeState(row?.data||{}),local=getState(),base=readBase(s.user.id),next=base?merge(local,cloud,base):merge(local,cloud,{});if(!eq(next,cloud)||!row?.data){const saved=await writeCloud(s,next);if(!saved?.data)throw new Error('Cloud save could not be verified.');for(const n of ['books','fanfiction','booksToBuy'])if((saved.data[n]?.length||0)<(next[n]?.length||0))throw new Error('Cloud verification found fewer '+n+' than expected.');setState(saved.data);saveBase(s.user.id,saved.data);}else{setState(cloud);saveBase(s.user.id,cloud);}setStatus('Synced across devices 💕');}catch(e){console.error('V7 sync failed',e);setStatus('Sync failed — your local data is safe');if(manual)alert('Cloud sync could not be completed. Your local bookshelf was not replaced.\n\n'+(e.message||e));}finally{busy=false;}}
  globalThis.cloudLoad=()=>run(false);globalThis.sync=()=>run(true);
  function bindSyncButton(){document.addEventListener('click',function(e){const el=e.target?.closest?.('button,a');if(!el)return;const t=(el.textContent||'').trim().replace(/\s+/g,' ').toLowerCase();if(t==='sync now'||t.includes('sync now')){e.preventDefault();e.stopImmediatePropagation();run(true);}},true);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindSyncButton,{once:true});else bindSyncButton();
})();
