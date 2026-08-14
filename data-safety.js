/* Data safety layer — validates local app data without changing the UI. */
(() => {
  const keys = ['books', 'my-bookshelf-books-to-buy-v1', 'my-bookshelf-fanfiction'];
  const looksLikeObject = value => value && typeof value === 'object' && !Array.isArray(value);
  const safeString = value => typeof value === 'string' ? value : '';

  function sanitizeBook(book) {
    if (!looksLikeObject(book)) return null;
    const out = {...book};
    ['id','title','author','cover','price','notes','status','rating','description'].forEach(k => {
      if (k in out) out[k] = safeString(out[k]);
    });
    return out;
  }

  function sanitizeArray(raw) {
    if (!Array.isArray(raw)) return null;
    return raw.map(sanitizeBook).filter(Boolean);
  }

  function protect(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return;
      const parsed = JSON.parse(raw);
      const clean = sanitizeArray(parsed);
      if (clean) localStorage.setItem(key, JSON.stringify(clean));
    } catch (error) {
      console.warn(`[data-safety] Preserved existing data for ${key}; it could not be safely normalized.`, error);
    }
  }

  function init() { keys.forEach(protect); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
