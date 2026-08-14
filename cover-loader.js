/* My Bookshelf — legacy cover lookup intentionally disabled.
 * Covers on the bookshelf are now chosen manually in the book editor.
 * This compatibility shim stays in place because the current index still
 * references cover-loader.js; it does not fetch, inject, observe, or modify covers.
 */
(() => {
  // Intentionally no-op.
})();
