(() => {
  'use strict';

  function cleanFanfictionUI() {
    const root = document.getElementById('fanfictionPanel');
    if (!root) return;

    // Keep the single combined Fanfiction Insights panel we designed.
    const keep = document.getElementById('ffInsights');

    // The original Fanfiction renderer creates a duplicate summary stats row.
    root.querySelectorAll('.stats').forEach(el => {
      if (keep && keep.contains(el)) return;
      el.style.setProperty('display', 'none', 'important');
    });

    // The original renderer also creates a duplicate four-box insights grid.
    root.querySelectorAll('.reading-grid').forEach(el => {
      if (keep && keep.contains(el)) return;
      const text = (el.textContent || '').replace(/\s+/g, ' ');
      if (/Top Ratings/i.test(text) && /Top Categories/i.test(text) && /Top Fandoms/i.test(text) && /Top Relationships/i.test(text)) {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    // The original renderer has a second insights grid with the same four
    // statistics, but it uses .fic-insights instead of .reading-grid.
    // Remove/hide that duplicate while leaving the actual AO3 work cards alone.
    root.querySelectorAll('.fic-insights').forEach(el => {
      if (keep && keep.contains(el)) return;
      el.style.setProperty('display', 'none', 'important');
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
