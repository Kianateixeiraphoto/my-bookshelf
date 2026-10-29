/* Reading Chronicles — unified, read-only presentation of existing Stats and Wrapped.
   The original renderers remain untouched as fallbacks. */
(() => {
'use strict';
const panel=document.getElementById('chroniclesPanel');
if(!panel)return;
let selectedYear=new Date().getFullYear();
const css=document.createElement('style');
css.textContent=`
#chroniclesPanel{background:linear-gradient(155deg,#12392d,#1d4837);border:1px solid #b49c6a;border-radius:20px;padding:clamp(14px,3vw,28px);color:#f4e9d7}
#chroniclesPanel .chron-hero{text-align:center;padding:36px 16px 42px;border-bottom:1px solid #aa946c;background:radial-gradient(ellipse at 50% 5%,rgba(102,132,101,.48) 0%,rgba(67,105,83,.24) 38%,transparent 75%);border-radius:18px 18px 0 0}
#chroniclesPanel .chron-hero small{letter-spacing:.2em;color:#d9b77c}
#chroniclesPanel .chron-hero h2{font:normal clamp(34px,5vw,50px) Georgia,serif;color:#f5e7cb;margin:12px 0}
#chroniclesPanel .chron-hero p{font-style:italic;color:#e5d3bc}
#chroniclesPanel .chron-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:20px 0;color:#f4e9d7}
#chroniclesPanel .chron-toolbar select{background:#fff7e9;color:#264a39;border:1px solid #c6a87a;border-radius:10px;padding:9px}
#chroniclesPanel .chron-block{margin-top:18px}
#chroniclesPanel .chron-block>h3{font:normal 26px Georgia,serif;color:#f1d4a0;margin:24px 0 12px}
#chroniclesPanel .reading-grid,#chroniclesPanel .wrap-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:12px}
#chroniclesPanel .reading-card,#chroniclesPanel .wrap-stat{background:#f6ead9;color:#315342;border:1px solid #d7b7a4;border-radius:14px;padding:18px;box-shadow:0 5px 16px #091d181f}
#chroniclesPanel .reading-card b,#chroniclesPanel .wrap-stat strong{font:700 30px Georgia,serif;color:#9c5b72;display:block}
#chroniclesPanel .reading-card span,#chroniclesPanel .wrap-stat span{color:#52675a;font-size:13px}
#chroniclesPanel .chron-cards{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:20px;align-items:start}\n#chroniclesPanel .chron-cards>.panel,#chroniclesPanel .chron-cards>.wrap-section{width:100%;min-width:0;height:auto;min-height:300px}\n#chroniclesPanel .stats-book-strip{overflow-x:auto;max-width:100%}\n#chroniclesPanel .stats-feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}\n#chroniclesPanel .stats-feature-grid>.panel{min-width:0}\n#chroniclesPanel .stats-calendar-full{grid-column:1/-1}\n#chroniclesPanel .stats-month-bars{min-height:170px}
#chroniclesPanel .panel,#chroniclesPanel .wrap-section{margin:0!important;background:#f6ead9;color:#2c4a39;border:1px solid #cdb9a0;border-radius:16px;padding:20px;min-width:0}
#chroniclesPanel .panel h3,#chroniclesPanel .wrap-section h3{font:normal 23px Georgia,serif;color:#315342;margin:0 0 13px}
#chroniclesPanel .stats-legend-row{color:#315342}
#chroniclesPanel .stats-pie-wrap{display:flex;gap:15px;flex-wrap:wrap;align-items:center}
#chroniclesPanel .stats-pie{width:140px;height:140px;flex:0 0 140px}
#chroniclesPanel .stats-legend{min-width:0;flex:1}
#chroniclesPanel .calendar-day{background:#fff9ef;border-color:#e4c8c7}
#chroniclesPanel .calendar-day>b{color:#995b73}
#chroniclesPanel .wrap-bar{background:linear-gradient(#c87d9a,#3d7056)}
#chroniclesPanel .wrap-line b{color:#995b73}
#chroniclesPanel .chron-note{color:#e4d2b5;font-size:12px;margin:18px 0}

/* Forest Library After Dark: match Romance DNA's emerald, parchment and gold palette. */
#chroniclesPanel{background:linear-gradient(150deg,#10251f,#234436 58%,#142b25);border-color:#7a7653;box-shadow:0 15px 40px #10281d40}
#chroniclesPanel .chron-hero{background:radial-gradient(ellipse at top,#3a5743 0%,transparent 70%);border-bottom-color:#8f865966}
#chroniclesPanel .chron-hero small,#chroniclesPanel .chron-block>h3{color:#d8bf87}
#chroniclesPanel .chron-hero h2{color:#f3e5c6}
#chroniclesPanel .chron-hero p{color:#d6decf}
#chroniclesPanel .chron-toolbar select{background:#274737;color:#f3e7ce;border-color:#a99a70}
#chroniclesPanel .reading-card,#chroniclesPanel .wrap-stat{background:#294639;color:#f2e7d1;border-color:#9b926b88;box-shadow:none}
#chroniclesPanel .reading-card b,#chroniclesPanel .wrap-stat strong{color:#e3c992}
#chroniclesPanel .reading-card span,#chroniclesPanel .wrap-stat span{color:#d8dfd0}
#chroniclesPanel .panel,#chroniclesPanel .wrap-section{background:#f3e8d4;color:#30493b;border-color:#d2c39f}
#chroniclesPanel .panel h3,#chroniclesPanel .wrap-section h3{color:#284637}
#chroniclesPanel .panel h3,#chroniclesPanel .wrap-section h3{background:#fff9ef;border-color:#c9b68b;box-shadow:none}
#chroniclesPanel .wrap-stat strong,#chroniclesPanel .wrap-line b{color:#e3c992}
#chroniclesPanel .wrap-bar{background:linear-gradient(90deg,#385d47,#a07e87)}
#chroniclesPanel .stats-month-bar,#chroniclesPanel .stats-bar-fill,#chroniclesPanel .stats-tag-fill{background:#53745b!important}
#chroniclesPanel .calendar-day{background:#fffaf0;border-color:#d7c9a8}
#chroniclesPanel .calendar-day>b{color:#526d51}
#chroniclesPanel .chron-note{color:#d8dfd0}

@media(max-width:760px){#chroniclesPanel .chron-cards,#chroniclesPanel .stats-feature-grid{grid-template-columns:1fr!important}}\n@media(max-width:580px){#chroniclesPanel .chron-cards{grid-template-columns:1fr}#chroniclesPanel .reading-calendar{gap:2px}#chroniclesPanel .calendar-day{min-height:58px;padding:3px}#chroniclesPanel .calendar-covers img{width:22px;height:30px}}
`;
document.head.appendChild(css);
function clone(node){return node?node.cloneNode(true):null}
function section(title,nodes){
 const block=document.createElement('section');block.className='chron-block';
 const h=document.createElement('h3');h.textContent=title;block.appendChild(h);
 const grid=document.createElement('div');grid.className='chron-cards';grid.style.setProperty('display','grid','important');grid.style.setProperty('grid-template-columns','repeat(2, minmax(0, 1fr))','important');if(window.matchMedia('(max-width:760px)').matches)grid.style.setProperty('grid-template-columns','minmax(0, 1fr)','important');
 nodes.filter(Boolean).forEach(n=>{const card=clone(n);card.style.setProperty('grid-column','auto','important');card.style.setProperty('width','100%','important');card.style.setProperty('max-width','none','important');grid.appendChild(card)});block.appendChild(grid);return block;
}
function render(){
 if(typeof window.renderStats==='function')window.renderStats();
 if(typeof window.renderReadingWrappedPreview==='function')window.renderReadingWrappedPreview();
 const stats=document.getElementById('statsPanel'),wrapped=document.getElementById('wrappedPanel');
 if(!stats||!wrapped)return;
 const sourceYear=wrapped.querySelector('#wrappedYear');
 if(sourceYear&&Number(sourceYear.value)!==selectedYear&&[...sourceYear.options].some(o=>Number(o.value)===selectedYear)){
   sourceYear.value=String(selectedYear);sourceYear.dispatchEvent(new Event('change',{bubbles:true}));
 }
 selectedYear=Number(wrapped.querySelector('#wrappedYear')?.value)||selectedYear;
 panel.replaceChildren();
 const hero=document.createElement('header');hero.className='chron-hero';hero.innerHTML='<small>✦ A YEAR AMONG THE PAGES ✦</small><h2>📖 Reading Chronicles</h2><p>Every chapter leaves a little magic behind.</p>';panel.appendChild(hero);
 const toolbar=document.createElement('div');toolbar.className='chron-toolbar';
 const label=document.createElement('label');label.htmlFor='chronYear';label.textContent='Reading year';
 const select=document.createElement('select');select.id='chronYear';
 [...(wrapped.querySelector('#wrappedYear')?.options||[])].forEach(o=>select.appendChild(o.cloneNode(true)));
 select.value=String(selectedYear);
 select.addEventListener('change',()=>{selectedYear=Number(select.value);render()});
 toolbar.append(label,select);panel.appendChild(toolbar);
 const overview=document.createElement('section');overview.className='chron-block';overview.innerHTML='<h3>🌿 Your Library at a Glance</h3>';
 const statsGrid=clone(stats.querySelector('.reading-grid'));if(statsGrid)overview.appendChild(statsGrid);
 panel.appendChild(overview);
 const annual=document.createElement('section');annual.className='chron-block';annual.innerHTML='<h3>🌹 '+selectedYear+' Reading Highlights</h3>';
 const annualGrid=clone(wrapped.querySelector('.wrap-grid'));if(annualGrid)annual.appendChild(annualGrid);
 panel.appendChild(annual);
 const wrappedSections=[...wrapped.querySelectorAll('.wrap-section')];
 const byHeading=term=>wrappedSections.find(x=>x.querySelector('h3')?.textContent.trim().toLowerCase()===term);
 panel.appendChild(section('📅 Monthly Reading & Calendar',[byHeading('monthly reading'),stats.querySelector('.stats-calendar-panel')]));
 panel.appendChild(section('📚 Reading Highlights',[byHeading('favorite authors'),byHeading('highest-rated reads')]));
 const statsPanels=[...stats.querySelectorAll('.panel')].filter(x=>!x.classList.contains('stats-calendar-panel'));
 panel.appendChild(section('🌿 Library Status & Tag Collections',statsPanels));
 const note=document.createElement('p');note.className='chron-note';note.textContent='Annual highlights count books with valid finish dates. Overall statistics and tag collections cover your library. This dashboard does not change or duplicate book records.';panel.appendChild(note);
}
window.renderReadingChronicles=render;
})();
