/* CLOUD-SYNC-SAFE-V2 — merge-first cloud sync with persisted Supabase session */
(() => {
  if (window.__cloudSyncSafeInstalled) return;
  window.__cloudSyncSafeInstalled = true;

  const originalCloudLoad = window.cloudLoad;
  const key = b => ((b?.title || b?.name || '') + '|' + (b?.author || '')).trim().toLowerCase();
  const SUPABASE_URL = 'https://ctnsusnfzclqnaloimzu.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_awbAAru2iWbHsjabVF83Gw_FhpiSG0z';

  // Always use Supabase's persisted auth session as the source of truth.
  // window.session can briefly be null/stale while auth is restoring, especially after an edit/save.
  let authClient = null;
  function getAuthClient() {
    if (authClient) return authClient;
    if (window.supabase?.createClient) {
      authClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage, storageKey: 'my-bookshelf-supabase-auth' }
      });
    }
    return authClient;
  }

  async function ensureSession() {
    if (window.session?.user?.id && (!window.session.expires_at || window.session.expires_at * 1000 > Date.now() + 30000)) {
      return window.session;
    }
    try {
      const client = getAuthClient();
      if (client) {
        const result = await client.auth.getSession();
        const s = result?.data?.session;
        if (s?.user?.id) {
          window.session = s;
          if (typeof window.setSession === 'function') window.setSession(s);
          return s;
        }
      }
    } catch (e) {
      console.warn('Could not restore persisted Supabase session', e);
    }
    return null;
  }

  async function getCloud(session) {
    if (!session || typeof window.api !== 'function') return null;
    const uid = session.user.id;
    const newId = 'library:' + uid;
    let rows = await window.api('/rest/v1/books?select=data,updated_at&user_id=eq.' + encodeURIComponent(uid) + '&id=eq.' + encodeURIComponent(newId));
    if (!rows?.length) rows = await window.api('/rest/v1/books?select=data,updated_at&user_id=eq.' + encodeURIComponent(uid) + '&id=eq.library');
    return rows?.[0] || null;
  }

  function mergeState(local, cloud) {
    const localBooks = Array.isArray(local?.books) ? local.books : [];
    const cloudBooks = Array.isArray(cloud?.books) ? cloud.books : [];
    const merged = new Map();
    cloudBooks.forEach(b => merged.set(key(b), b));
    localBooks.forEach(b => merged.set(key(b), { ...(merged.get(key(b)) || {}), ...b }));
    const mergeArray = name => {
      const a = Array.isArray(local?.[name]) ? local[name] : [];
      const b = Array.isArray(cloud?.[name]) ? cloud[name] : [];
      if (name === 'books') return Array.from(merged.values());
      return [...b, ...a.filter(x => JSON.stringify(b).indexOf(JSON.stringify(x)) === -1)];
    };
    return {...(cloud || {}), ...(local || {}), books: mergeArray('books'), fanfiction: mergeArray('fanfiction'), booksToBuy: mergeArray('booksToBuy')};
  }

  async function safeCloudLoad() {
    const s = await ensureSession();
    if (!s) return;
    try {
      const row = await getCloud(s);
      if (!row?.data) { if (typeof window.render === 'function') window.render(); return; }
      const merged = mergeState(window.state || {}, row.data || {});
      window.state = merged;
      if (typeof window.saveLocal === 'function') window.saveLocal();
      if (typeof window.render === 'function') window.render();
      const cloudBookCount = Array.isArray(row.data?.books) ? row.data.books.length : 0;
      const mergedBookCount = Array.isArray(merged.books) ? merged.books.length : 0;
      const needsUpload = mergedBookCount > cloudBookCount ||
        (Array.isArray(merged.fanfiction) && merged.fanfiction.length > (Array.isArray(row.data?.fanfiction) ? row.data.fanfiction.length : 0)) ||
        (Array.isArray(merged.booksToBuy) && merged.booksToBuy.length > (Array.isArray(row.data?.booksToBuy) ? row.data.booksToBuy.length : 0));
      if (needsUpload) await safeSync();
      if (window.$ && $('cloudStatus')) $('cloudStatus').textContent = 'Synced from cloud 💕';
    } catch (e) {
      console.warn('Safe cloud load failed', e);
      if (window.$ && $('cloudStatus')) $('cloudStatus').textContent = 'Cloud sync unavailable';
      if (typeof originalCloudLoad === 'function') await originalCloudLoad();
    }
  }

  async function safeSync() {
    const s = await ensureSession();
    if (!s) { if (typeof window.openAuth === 'function') window.openAuth('login'); return; }
    try {
      const cloudRow = await getCloud(s);
      const merged = mergeState(window.state || {}, cloudRow?.data || {});
      const uid = s.user.id, newId = 'library:' + uid, now = new Date().toISOString(), payload = {...merged};
      let rows = await window.api('/rest/v1/books?select=id&user_id=eq.' + encodeURIComponent(uid) + '&id=eq.' + encodeURIComponent(newId));
      if (rows?.length) {
        await window.api('/rest/v1/books?id=eq.' + encodeURIComponent(newId) + '&user_id=eq.' + encodeURIComponent(uid), {method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({data:payload,updated_at:now})});
      } else {
        rows = await window.api('/rest/v1/books?select=id&user_id=eq.' + encodeURIComponent(uid) + '&id=eq.library');
        if (rows?.length) await window.api('/rest/v1/books?id=eq.library&user_id=eq.' + encodeURIComponent(uid), {method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({data:payload,updated_at:now})});
        else await window.api('/rest/v1/books', {method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({id:newId,user_id:uid,data:payload,updated_at:now})});
      }
      const verify = await getCloud(s);
      const savedBooks = Array.isArray(verify?.data?.books) ? verify.data.books : [];
      const savedFics = Array.isArray(verify?.data?.fanfiction) ? verify.data.fanfiction : [];
      const savedBuy = Array.isArray(verify?.data?.booksToBuy) ? verify.data.booksToBuy : [];
      if (savedBooks.length < (Array.isArray(payload.books) ? payload.books.length : 0) || savedFics.length < (Array.isArray(payload.fanfiction) ? payload.fanfiction.length : 0) || savedBuy.length < (Array.isArray(payload.booksToBuy) ? payload.booksToBuy.length : 0)) throw new Error('Cloud verification found fewer records than expected. Local data was not replaced.');
      window.state = merged;
      if (typeof window.saveLocal === 'function') window.saveLocal();
      if (typeof window.render === 'function') window.render();
      if (window.$ && $('cloudStatus')) $('cloudStatus').textContent = 'Synced & verified 💕';
    } catch (e) {
      console.error('Safe cloud sync failed', e);
      if (window.$ && $('cloudStatus')) $('cloudStatus').textContent = 'Sync failed — your local data is safe';
      alert('Cloud sync could not be verified. Your local bookshelf was not replaced.\n\n' + (e.message || e));
    }
  }

  window.cloudLoad = safeCloudLoad;
  window.sync = safeSync;
})();
