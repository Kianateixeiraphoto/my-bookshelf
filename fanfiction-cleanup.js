(() => {
  'use strict';

  function cleanFanfictionUI() {
    const root = document.getElementById('fanfictionPanel');
    if (!root) return;

    // Keep the combined Fanfiction Insights panel we designed.
    const keep = document.getElementById('ffInsights');

    // The original Fanfiction renderer creates its own summary stats row.
    // Hide that row, but never touch the combined panel above.
    root.querySelectorAll('.stats').forEach(el => {
      if (keep && keep.contains(el)) return;
      el.style.setProperty('display', 'none', 'important');
    });

    // The original renderer also creates a second four-box insights grid.
    // Hide it while leaving the actual fic cards alone.
    root.querySelectorAll('.reading-grid').forEach(el => {
      if (keep && keep.contains(el)) return;
      const text = (el.textContent || '').replace(/\s+/g, ' ');
      if (/Top Ratings/i.test(text) && /Top Categories/i.test(text) && /Top Fandoms/i.test(text) && /Top Relationships/i.test(text)) {
        el.style.setProperty('display', 'none', 'important');
      }
    });
  }

  const start = () => {
    cleanFanfictionUI();
    const root = document.getElementById('fanfictionPanel');
    if (!root || root.dataset.finalFanfictionCleanup) return;
    root.dataset.finalFanfictionCleanup = 'true';
    new MutationObserver(cleanFanfictionUI).observe(root, { childList: true, subtree: true });
  };

  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    start();
    if (document.getElementById('fanfictionPanel') || tries > 150) clearInterval(timer);
  }, 100);
})();
