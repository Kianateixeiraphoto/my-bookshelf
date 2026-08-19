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

/* TAG-CATEGORIES-V4 — organized tag picker; spice remains a separate book-info field */
(() => {
  const TAG_SECTIONS = {
    'Pairing': ['MM','MF','FF','Poly','Why Choose','Reverse Harem'],
    'Orientation': ['Gay','Lesbian','Bisexual','Pansexual','Queer','Asexual','Demisexual'],
    'Romance Tropes': ['Enemies to Lovers','Friends to Lovers','Friends with Benefits','Fake Dating','Forced Proximity','Only One Bed','Grumpy x Sunshine','Second Chance','Forbidden Romance','Forbidden Love','Age Gap','Opposites Attract','Mutual Pining','Slow Burn','Workplace Romance','Small Town Romance','Sports Romance','College Romance','Road Trip'],
    'Relationship & Dynamics': ['Possessive','Protective','Jealousy','Betrayal','Hurt/Comfort','High Angst','Fluff','Found Family','Established Relationship','Secret Relationship','Open Relationship','Touch Her/Him and Die','Morally Gray'],
    'Kinks & Intimacy': ['Praise Kink','Size Difference','Power Exchange','Dom/Sub','Bondage','Breeding Kink','Marking','Exhibitionism','Voyeurism'],
    'Vibes & Tone': ['Sweet','Cozy','Dark Romance','Dark','Angsty','Emotional','Funny','RomCom','Heartwarming','Bittersweet'],
    'Fantasy & Paranormal': ['Shifters','Vampires','Werewolves','Omegaverse','Mpreg','Witches','Fae','Demons','Monsters','Magic','Supernatural','Paranormal','Fantasy','Sci-Fi'],
    'Genre & Setting': ['Contemporary','Historical','Mystery','Thriller','Horror','Mafia','Billionaire','Military','Law Enforcement','Cowboys','Academia','High School','College','Workplace','Small Town'],
    'Content Warnings': ['Dark Themes','Violence','Death','Grief','Trauma','Abuse','Toxic Relationship','Dubious Consent','Non-Consent','Cheating']
  };

  const SPICE_TAGS = new Set(['Spicy','Very Spicy','1 chili','2 chilis','3 chilis','4 chilis','5 chilis']);
  const escTag = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function renderTags(book) {
    const picker = document.querySelector('#bookTags');
    if (!picker) return;
    const selected = Array.isArray(book?.tags) ? book.tags : [];
    const known = new Set(Object.values(TAG_SECTIONS).flat());
    const legacy = selected.filter(tag => !known.has(tag) && !SPICE_TAGS.has(tag));
    const sections = Object.entries(TAG_SECTIONS).map(([section, options]) => `
      <section class="tag-section">
        <h4>${escTag(section)}</h4>
        <div class="tag-options">
          ${options.map(tag => `<label class="tag-option"><input type="checkbox" value="${escTag(tag)}" ${selected.includes(tag) ? 'checked' : ''}><span>${escTag(tag)}</span></label>`).join('')}
        </div>
      </section>`).join('');
    const legacySection = legacy.length ? `
      <section class="tag-section">
        <h4>Existing Tags</h4>
        <div class="tag-options">
          ${legacy.map(tag => `<label class="tag-option"><input type="checkbox" value="${escTag(tag)}" checked><span>${escTag(tag)}</span></label>`).join('')}
        </div>
      </section>` : '';

    picker.querySelector('.tag-sections').innerHTML = sections + legacySection;
    picker.querySelector('.status').textContent = 'Choose as many as you like. Spice is tracked separately above.';
    const clear = picker.querySelector('#clearBookTags');
    if (clear) clear.onclick = () => picker.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = false; });
  }

  function start() {
    const original = window.addBook;
    if (typeof original !== 'function' || original.__tagCategoriesV4) return;
    const wrapped = function(book = {}) {
      original.call(this, book);
      requestAnimationFrame(() => renderTags(book));
      setTimeout(() => renderTags(book), 0);
    };
    wrapped.__tagCategoriesV4 = true;
    window.addBook = wrapped;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
