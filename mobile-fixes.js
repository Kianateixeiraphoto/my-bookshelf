/* My Bookshelf — mobile UI polish */
(() => {
  'use strict';

  function install() {
    if (document.getElementById('mobileUiFixes')) return;

    const style = document.createElement('style');
    style.id = 'mobileUiFixes';
    style.textContent = `
      html, body { width: 100%; max-width: 100%; overflow-x: hidden; }
      body { -webkit-text-size-adjust: 100%; }
      .app { width: 100%; max-width: 1250px; }
      img { max-width: 100%; }

      @media (max-width: 700px) {
        .app { padding: 14px 10px 36px; }
        header { gap: 12px; margin-bottom: 16px; }
        h1 { font-size: 30px; line-height: 1.05; }
        .subtitle { font-size: 12px; }
        header .actions, #cloudBar .actions { width: 100%; }
        header .actions .btn, #cloudBar .actions .btn { flex: 1 1 auto; min-height: 42px; }

        nav {
          flex-wrap: nowrap;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 2px 1px 6px;
          margin-bottom: 12px;
        }
        nav::-webkit-scrollbar { display: none; }
        .tab { flex: 0 0 auto; min-height: 42px; white-space: nowrap; }

        .stats { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 8px; margin-bottom: 12px; }
        .stat { min-width: 0; padding: 12px 10px; border-radius: 15px; }
        .stat b { font-size: 20px; overflow-wrap: anywhere; }
        .stat span { font-size: 11px; }

        .toolbar { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .toolbar .search { grid-column: 1 / -1; min-width: 0; width: 100%; }
        .toolbar select { width: 100%; min-width: 0; }

        .shelf { grid-template-columns: 1fr !important; gap: 10px; }
        .book { grid-template-columns: 88px minmax(0, 1fr); min-width: 0; }
        .cover { height: 138px; min-height: 138px; }
        .book-body { padding: 11px 10px; min-width: 0; }
        .book-title { font-size: 16px; overflow-wrap: anywhere; }
        .author, .meta { overflow-wrap: anywhere; }
        .book-actions .btn { min-height: 36px; }

        /* All long forms scroll at the overlay level on iPhone. This avoids
           nested-scroll traps where the AO3 Save/Confirm button becomes unreachable. */
        .modal {
          align-items: flex-start;
          padding: 8px;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          touch-action: pan-y;
        }
        .modal-card {
          width: min(100%, 620px);
          max-width: 100%;
          max-height: none;
          overflow: visible;
          flex: 0 0 auto;
          margin: 0 auto 18px;
          padding: 16px 14px 22px;
          border-radius: 20px;
        }
        .modal-card .row { position: sticky; top: -16px; z-index: 8; background: #fffafa; padding: 2px 0 10px; }
        .modal-card h2 { font-size: 22px; margin: 0; }
        .form-grid { grid-template-columns: 1fr !important; gap: 9px; }
        .wide { grid-column: auto !important; }
        .modal-card input, .modal-card select, .modal-card textarea { width: 100%; max-width: 100%; font-size: 16px; }
        .modal-card textarea { min-height: 150px; resize: vertical; }
        .modal-card label { font-size: 12px; }

        /* AO3 metadata forms specifically: keep the final action row reachable and
           give it breathing room above the iPhone home indicator. */
        #ao3Form { padding-bottom: 18px; }
        #ao3Form .actions:last-child,
        #ao3Form button[type="submit"],
        #ao3Form .ao3-save,
        #ao3Form .ao3-confirm { min-height: 46px; }
        #ao3Form .actions:last-child { margin-top: 14px; padding-bottom: 10px; }

        .tag-picker { padding: 9px; }
        .tag-picker-head { gap: 8px; }
        .tag-sections { grid-template-columns: 1fr !important; max-height: none; overflow: visible; padding: 0; }
        .tag-section { padding: 9px; }
        .tag-options { gap: 6px; }
        .tag-option { min-height: 36px; padding: 7px 9px; font-size: 12px; }
        .tag-option input { width: 17px; height: 17px; }

        #bookForm .editor-cover-tools { padding: 10px; }
        #bookForm .editor-cover-head { align-items: stretch !important; }
        #bookForm .editor-cover-head .btn { width: 100%; min-height: 42px; }
        #bookForm .editor-cover-choices { margin-inline: -2px; padding-bottom: 6px; }
        #bookForm .cover-choice { flex-basis: 86px; width: 86px; }
        #bookForm .cover-choice img { width: 74px; height: 102px; }

        #bookForm textarea[name="notes"], #bookForm textarea[name="review"] { min-height: 170px; width: 100%; }

        .panel { border-radius: 18px; padding: 13px; }
        .ff-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 8px; }
        .ff-stat-card { min-width: 0; padding: 11px; }
        .ff-stat-card b { font-size: 18px; overflow-wrap: anywhere; }
        .ff-insight-grid { grid-template-columns: 1fr !important; gap: 9px; }
        .ff-insight-box { min-width: 0; padding: 11px; }
        .ff-rank { grid-template-columns: minmax(0, 1fr) 32px; }
        .ff-rank-name { white-space: normal; overflow-wrap: anywhere; }
        .ff-refresh { align-items: stretch; }
        .ff-refresh .btn { width: 100%; min-height: 42px; }

        .reading-grid, .buy-grid { grid-template-columns: 1fr !important; }
        .reading-card, .buy-card { min-width: 0; }
        .buy-card a { overflow-wrap: anywhere; }

        button, .btn, select { touch-action: manipulation; }
      }

      @media (max-width: 390px) {
        .app { padding-inline: 8px; }
        h1 { font-size: 27px; }
        .stats { gap: 6px; }
        .stat { padding: 10px 8px; }
        .stat b { font-size: 18px; }
        .book { grid-template-columns: 78px minmax(0, 1fr); }
        .cover { height: 126px; min-height: 126px; }
        .book-title { font-size: 15px; }
        .ff-stat-card b { font-size: 17px; }
      }
    `;
    document.head.appendChild(style);

    const observer = new MutationObserver(() => {
      const modal = document.getElementById('modal');
      if (modal?.classList.contains('show')) {
        const card = modal.querySelector('.modal-card');
        if (card && !card.dataset.mobileReset) {
          card.dataset.mobileReset = '1';
          requestAnimationFrame(() => { card.scrollTop = 0; modal.scrollTop = 0; });
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
