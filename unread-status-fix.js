/* Bookshelf — make Unread a selectable book status */
(() => {
  const UNREAD = 'Unread';
  function addOption(select, value = UNREAD) {
    if (!select || select.name !== 'status') return;
    if (![...select.options].some(o => String(o.value || o.textContent).trim().toLowerCase() === value.toLowerCase())) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    }
  }
  function patchForm() {
    addOption(document.querySelector('#bookForm select[name="status"]'));
    const filter = document.getElementById('statusFilter');
    if (filter && ![...filter.options].some(o => String(o.value || o.textContent).trim().toLowerCase() === UNREAD.toLowerCase())) {
      const option = document.createElement('option');
      option.value = UNREAD;
      option.textContent = UNREAD;
      filter.appendChild(option);
    }
  }
  const observer = new MutationObserver(patchForm);
  function start() {
    patchForm();
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
