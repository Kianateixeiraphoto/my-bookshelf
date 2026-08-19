/* My Bookshelf — Unread section */
(() => {
  const UNREAD_STATUSES = new Set(['unread','want to read','to read','tbr','not started']);
  const section = () => document.getElementById('unreadSection');
  const norm = b => String(b?.status || '').trim().toLowerCase();
  const isUnread = b => UNREAD_STATUSES.has(norm(b));
  function cardList(items){
    return items.length ? '<div class="shelf">' + items.map(bookCard).join('') + '</div>' : '<div class="panel empty">No unread books yet. 📚✨</div>';
  }
  function renderUnread(){
    const el = section();
    if(!el || typeof bookCard !== 'function') return;
    const books = (typeof state !== 'undefined' && Array.isArray(state.books)) ? state.books : [];
    const q = (document.getElementById('bookSearch')?.value || '').toLowerCase();
    const sf = String(document.getElementById('statusFilter')?.value || '').trim().toLowerCase();
    const rf = Number(document.getElementById('ratingFilter')?.value || 0);
    const filtered = books.filter(b => {
      const searchable = JSON.stringify(b).toLowerCase();
      return (!q || searchable.includes(q)) && (!sf || norm(b) === sf) && (!rf || Number(b.rating) >= rf);
    });
    el.innerHTML = '<div class="section-title">📚 Unread</div><div class="section-sub">Books you haven’t started yet. 🌿</div>' + cardList(filtered.filter(isUnread));
  }
  function patchRender(){
    if(typeof window.render !== 'function' || window.render.__unreadPatched) return;
    const original = window.render;
    function wrappedRender(){ original(); renderUnread(); }
    wrappedRender.__unreadPatched = true;
    window.render = wrappedRender;
    wrappedRender();
  }
  function addSection(){
    const parent = document.getElementById('bookshelfPanel');
    if(!parent || section()) return;
    const el = document.createElement('div');
    el.id = 'unreadSection';
    el.className = 'section';
    parent.appendChild(el);
  }
  function installStyles(){
    if(document.getElementById('unread-section-styles')) return;
    const style=document.createElement('style'); style.id='unread-section-styles';
    style.textContent=`
      #unreadSection{order:4}
      #dnfSection{order:5}
      #archivedSection{order:6}
      #unreadSection .section-title{color:#315f40}
      #unreadSection .section-sub{color:#657a60}
      #unreadSection .panel{background:rgba(255,248,232,.88);border-color:#d0bf86}
      #unreadSection .chip{background:#e3edca;color:#42633d}
    `;
    document.head.appendChild(style);
  }
  function start(){ addSection(); installStyles(); patchRender(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
