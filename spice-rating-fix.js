/* Fix: preserve the stored spicy-rating value when reopening the book editor. */
(() => {
  const VALUE_MAP = {
    '1 chili': '🌶️ 1 chili',
    '2 chilis': '🌶️🌶️ 2 chilis',
    '3 chilis': '🌶️🌶️🌶️ 3 chilis',
    '4 chilis': '🌶️🌶️🌶️🌶️ 4 chilis',
    '5 chilis': '🌶️🌶️🌶️🌶️🌶️ 5 chilis'
  };

  function fix() {
    const select = document.querySelector('#bookForm select[name="spice"]');
    if (!select) return;
    const raw = select.value.trim();
    if (VALUE_MAP[raw]) select.value = VALUE_MAP[raw];
  }

  function start() {
    const original = window.addBook;
    if (typeof original !== 'function') return;
    window.addBook = function(book = {}) {
      original.call(this, book);
      requestAnimationFrame(fix);
      setTimeout(fix, 0);
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
