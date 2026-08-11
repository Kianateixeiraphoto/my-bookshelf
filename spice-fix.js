/* My Bookshelf — Spice rating reliability fix
 * Keeps the Spice field consistent, saves changes immediately to local data,
 * and shows the selected spice level on book cards.
 */
(() => {
  const labels = ['Not rated','🌶️ 1 chili','🌶️🌶️ 2 chilis','🌶️🌶️🌶️ 3 chilis','🌶️🌶️🌶️🌶️ 4 chilis','🌶️🌶️🌶️🌶️🌶️ 5 chilis'];

  function canonical(value) {
    const s = String(value ?? '').trim().toLowerCase();
    if (!s || s === 'not rated' || s === '0' || s === '0 chilis') return 'Not rated';
    const m = s.match(/([1-5])/);
    if (!m) return 'Not rated';
    const n = Number(m[1]);
    return labels[n];
  }

  function currentBookForForm(form) {
    if (typeof state === 'undefined' || !Array.isArray(state.books)) return null;
    const title = form.querySelector('[name="title"]')?.value?.trim().toLowerCase();
    const author = form.querySelector('[name="author"]')?.value?.trim().toLowerCase();
    if (!title || !author) return null;
    return state.books.find(b => String(b.title || '').trim().toLowerCase() === title && String(b.author || '').trim().toLowerCase() === author) || null;
  }

  function repairSelect(form) {
    let select = form.querySelector('select[name="spice"]');
    if (!select) return null;
    const value = canonical(select.value);
    select.innerHTML = labels.map(x => `<option value="${x === 'Not rated' ? 'Not rated' : x}" ${x === value ? 'selected' : ''}>${x}</option>`).join('');
    select.value = value;
    select.dataset.spiceFixInstalled = '1';
    return select;
  }

  function installForm(form) {
    if (!form || form.dataset.spiceFixInstalled === '1') return;
    const select = repairSelect(form);
    if (!select) return;
    form.dataset.spiceFixInstalled = '1';

    const book = currentBookForForm(form);
    if (book) select.value = canonical(book.spice || book.spiceRating || book.spice_level || 'Not rated');

    select.addEventListener('change', () => {
      const value = canonical(select.value);
      select.value = value;
      const b = currentBookForForm(form);
      if (b) {
        b.spice = value;
        delete b.spiceRating;
        delete b.spice_level;
        try { if (typeof saveLocal === 'function') saveLocal(); } catch (e) { console.warn('Spice local save failed', e); }
      }
      const status = form.querySelector('.spice-save-status');
      if (status) status.textContent = value === 'Not rated' ? '' : `✓ ${value} selected`;
    });

    const label = [...form.querySelectorAll('label')].find(l => /spice/i.test(l.textContent || ''));
    if (label && !label.querySelector('.spice-save-status')) {
      const note = document.createElement('span');
      note.className = 'spice-save-status status';
      note.style.cssText = 'display:block;margin-top:4px;font-size:10px;';
      if (select.value !== 'Not rated') note.textContent = `✓ ${select.value} selected`;
      label.appendChild(note);
    }
  }

  function spiceFromBook(book) {
    return canonical(book?.spice || book?.spiceRating || book?.spice_level || 'Not rated');
  }

  function addCardSpice() {
    if (typeof state === 'undefined' || !Array.isArray(state.books)) return;
    document.querySelectorAll('.book').forEach(card => {
      if (card.querySelector('.spice-chip')) return;
      const title = card.querySelector('.book-title')?.textContent?.trim().toLowerCase();
      const author = card.querySelector('.author')?.textContent?.trim().toLowerCase();
      if (!title) return;
      const book = state.books.find(b => String(b.title || '').trim().toLowerCase() === title && (!author || String(b.author || '').trim().toLowerCase() === author));
      const spice = spiceFromBook(book);
      if (!book || spice === 'Not rated') return;
      const chip = document.createElement('span');
      chip.className = 'chip spice-chip';
      chip.textContent = spice;
      chip.title = 'Spice rating';
      chip.style.cssText = 'background:#ffe6ec;color:#a34a64;font-weight:600;';
      const chips = card.querySelector('.chips');
      if (chips) chips.appendChild(chip);
    });
  }

  function start() {
    const form = document.getElementById('bookForm');
    if (form) installForm(form);
    addCardSpice();
  }

  document.addEventListener('change', e => {
    if (e.target?.matches?.('#bookForm select[name="spice"]')) installForm(e.target.form);
  }, true);

  const observer = new MutationObserver(() => start());
  observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  setInterval(addCardSpice, 700);
})();
