/* Fix: preserve the stored spicy-rating value when reopening the book editor. */
(() => {
  const VALUE_MAP = {
    '1 chili': '🌶️ 1 chili',
    '2 chilis': '🌶️🌶️ 2 chilis',
    '3 chilis': '🌶️🌶️🌶️ 3 chilis',
    '4 chilis': '🌶️🌶️🌶️🌶️ 4 chilis',
    '5 chilis': '🌶️🌶️🌶️🌶️🌶️ 5 chilis'
  };
  const normalize = value => VALUE_MAP[value] || value || 'Not rated';

  function fix(book) {
    const select = document.querySelector('#bookForm select[name="spice"]');
    if (!select) return;
    const stored = normalize(book?.spice);
    if ([...select.options].some(option => option.value === stored)) select.value = stored;
  }

  function start() {
    const original = window.addBook;
    if (typeof original !== 'function') return;
    window.addBook = function(book = {}) {
      original.call(this, book);
      requestAnimationFrame(() => fix(book));
      setTimeout(() => fix(book), 0);
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
