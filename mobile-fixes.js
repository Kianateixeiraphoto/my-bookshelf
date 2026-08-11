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

        /* iPhone repair: the AO3 importer is a long fixed modal. The overlay itself
           must be the ONLY scroll container. A fixed-height card or nested overflow
           trap makes the lower Save/Confirm button unreachable after OCR fills the form. */
        html.ao3-modal-open, body.ao3-modal-open { overflow: hidden !important; height: 100%; }
        .modal.show {
          display: block !important;
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100dvh !important;
          max-height: 100dvh !important;
          padding: 8px !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          overscroll-behavior-y: contain !important;
          touch-action: pan-y !important;
        }
        .modal.show > .modal-card {
          display: block !important;
          width: min(100%, 620px) !important;
          max-width: 100% !important;
          height: auto !important;
          min-height: calc(100dvh - 16px) !important;
          max-height: none !important;
          margin: 0 auto 18px !important;
          padding: 16px 14px 34px !important;
          overflow: visible !important;
          position: relative !important;
          flex: none !important;
        }
        .modal.show > .modal-card > form {
          display: block !important;
          height: auto !important;
          max-height: none !important;
          min-height: 0 !important;
          overflow: visible !important;
        }
        .modal.show .modal-card .row {
          position: sticky !important;
          top: -16px !important;
          z-index: 20 !important;
          background: #fffafa !important;
          padding: 2px 0 10px !important;
        }
        .modal.show .modal-card h2 { font-size: 22px; margin: 0; }
        .form-grid { grid-template-columns: 1fr !important; gap: 9px; }
        .wide { grid-column: auto !important; }
        .modal-card input, .modal-card select, .modal-card textarea { width: 100%; max-width: 100%; font-size: 16px; }
        .modal-card textarea { min-height: 150px; resize: vertical; }
        .modal-card label { font-size: 12px; }

        /* AO3 screenshot form: make the bottom action row impossible to lose. */
        #ao3Form, #ficForm { padding-bottom: 30px !important; margin-bottom: 0 !important; }
        #ao3Form .actions:last-child, #ficForm .actions:last-child {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 8px !important;
          margin-top: 18px !important;
          padding: 12px 0 28px !important;
          background: #fffafa !important;
        }
        #ao3Form button[type="submit"], #ficForm button[type="submit"],
        #ao3Form .ao3-save, #ao3Form .ao3-confirm,
        #ficForm .ao3-save, #ficForm .ao3-confirm {
          min-height: 48px !important;
          position: sticky !important;
          bottom: 8px !important;
          z-index: 25 !important;
        }

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

    function syncModalScrollState() {
      const modal = document.getElementById('modal');
      const open = !!modal?.classList.contains('show');
      const ao3 = !!modal?.querySelector('#ficForm, #ao3Form, #ao3ScreenshotFile');
      document.documentElement.classList.toggle('ao3-modal-open', open && ao3);
      document.body.classList.toggle('ao3-modal-open', open && ao3);
      if (open && ao3) {
        modal.style.overflowY = 'auto';
        modal.style.height = '100dvh';
        modal.style.maxHeight = '100dvh';
        modal.style.display = 'block';
      }
    }

    const observer = new MutationObserver(() => {
      syncModalScrollState();
      const modal = document.getElementById('modal');
      if (modal?.classList.contains('show')) {
        const card = modal.querySelector('.modal-card');
        if (card && !card.dataset.mobileReset) {
          card.dataset.mobileReset = '1';
          requestAnimationFrame(() => { modal.scrollTop = 0; card.scrollTop = 0; });
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    syncModalScrollState();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
