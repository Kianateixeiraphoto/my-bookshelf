/* Romance DNA Phase 2: read-only personality and comparison sections */
(() => {
'use strict';
const defs=[
['🥀','The Devotion Menace',['Possessive','Protective','Jealousy','Obsessive Love','Touch Them and Die'],'You saw the red flags and asked whether they came in a matching set.'],
['💌','The Groveling Enthusiast',['Groveling','Chasing / Pursuit','Second Chance','Betrayal','Hurt / Comfort'],'An apology is cute. Have you tried suffering for twelve chapters?'],
['🖤','The Morally Gray Collector',['Dark Romance','Dark','Morally Gray','Power Imbalance','Forbidden Romance'],'You can fix him. You just do not particularly want to.'],
['🌙','The Yearning Professional',['Slow Burn','Mutual Pining','Unrequited Love','Friends to Lovers','Emotional Angst'],'Two hundred pages of meaningful eye contact? Five stars.'],
['🐉','The Supernatural Disaster',['Omegaverse','Monsters','Shifters','Vampires','Fae','Werewolves','Supernatural'],'Human men had their chance.'],
['⚔️','The Banter Addict',['Enemies to Lovers','Rivals to Lovers','Grumpy x Sunshine','Opposites Attract','Funny'],'If they are not verbally sparring, are they even flirting?'],
['🌷','The Soft-Hearted Menace',['Sweet','Cozy','Fluffy','Wholesome','Found Family','Heartwarming'],'You contain multitudes. Some of them just want a hug.'],
['🌶️','The Heat Seeker',['High Spice','Extremely Spicy','BDSM','Dom/Sub','Sexual Tension'],'You came for the plot. The plot has excellent stamina.'],
['✨','The Fantasy Romantic',['Fantasy Romance','Romantasy','Magic','Fae','Royalty','Soulmates'],'Why settle for butterflies when the love interest could have wings?']
];
const aliases={'MM':'M/M','MF':'M/F','FF':'F/F','Forbidden Love':'Forbidden Romance','Hurt/Comfort':'Hurt / Comfort'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tags=b=>[...new Set((Array.isArray(b.tags)?b.tags:[]).map(t=>aliases[t]||t))];
const status=b=>String(b.status||'').trim().toLowerCase();
const read=b=>['read','finished','complete','completed'].includes(status(b));
const wish=b=>['want to read','unread','to read','tbr'].includes(status(b));
const known=new Set(defs.flatMap(d=>d[2]));
const style=document.createElement('style');
style.textContent='#romanceDnaPanel .dna-phase2{display:grid;gap:20px;margin-top:22px}#romanceDnaPanel .dna-phase2 section{border:1px solid #9d926b88;border-radius:17px;background:#f2e7d2;color:#2d4939;padding:clamp(16px,3vw,26px)}#romanceDnaPanel .dna-phase2 h3{font:normal 26px Georgia,serif;margin:8px 0 15px}#romanceDnaPanel .dna-phase2 small{color:#897047;letter-spacing:.08em}#romanceDnaPanel .dna-archetypes{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}#romanceDnaPanel .dna-archetype{border-radius:13px;background:#244536;color:#f3e9d4;padding:20px}#romanceDnaPanel .dna-archetype h4{font:normal 25px Georgia,serif;margin:10px 0;color:#e6c88c}#romanceDnaPanel .dna-archetype small{color:#d7c79d}#romanceDnaPanel .dna-muted{color:#687565;line-height:1.6}#romanceDnaPanel .dna-paradox-row,#romanceDnaPanel .dna-obsession{padding:12px 0;border-top:1px solid #cfc4a9;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px}#romanceDnaPanel .dna-paradox-row em{width:100%;color:#7a6750;font-size:12px}';
document.head.appendChild(style);
function draw(){
 const panel=document.getElementById('romanceDnaPanel');
 if(!panel||!panel.querySelector('.dna-shell'))return;
 const previous=panel.querySelector('.dna-phase2');if(previous)previous.remove();
 const footer=panel.querySelector('.dna-next');if(footer)footer.remove();
 let all=[];try{all=Array.isArray(state.books)?state.books:[]}catch(e){}
 const mode=panel.querySelector('[data-dna-mode].selected')?.dataset.dnaMode||'reading';
 const genre=panel.querySelector('#dnaGenre')?.value||'all';
 const filtered=all.filter(b=>genre==='all'||tags(b).includes(genre));
 const books=filtered.filter(mode==='reading'?read:wish), tagged=books.filter(b=>tags(b).length);
 const scored=defs.map(([icon,name,traits,quip])=>{const evidence=traits.map(t=>[t,tagged.filter(b=>tags(b).includes(t)).length]).filter(x=>x[1]);return {icon,name,quip,evidence,hits:tagged.filter(b=>traits.some(t=>tags(b).includes(t))).length}}).filter(x=>tagged.length>=3&&x.hits>=2&&x.evidence.length>=2).sort((a,b)=>b.hits-a.hits||b.evidence.length-a.evidence.length||a.name.localeCompare(b.name));
 const archetypes=scored.length?scored.slice(0,2).map((p,i)=>'<article class="dna-archetype"><small>'+(i?'SECONDARY':'PRIMARY')+' ARCHETYPE</small><h4>'+p.icon+' '+esc(p.name)+'</h4><p>“'+esc(p.quip)+'”</p><small>'+p.hits+'/'+tagged.length+' tagged books · '+p.evidence.slice(0,4).map(x=>esc(x[0])+' ('+x[1]+')').join(', ')+'</small></article>').join(''):'<p class="dna-muted">Your archetype is still being written. Tag at least three books with overlapping traits to unlock it.</p>';
 const r=filtered.filter(read).filter(b=>tags(b).some(t=>known.has(t))),w=filtered.filter(wish).filter(b=>tags(b).some(t=>known.has(t)));
 const choices=[...new Set([...r,...w].flatMap(tags))].filter(t=>known.has(t)).map(t=>{const rc=r.filter(b=>tags(b).includes(t)).length,wc=w.filter(b=>tags(b).includes(t)).length;return {t,rc,wc,diff:Math.abs(rc/Math.max(1,r.length)-wc/Math.max(1,w.length))}}).filter(x=>x.rc+x.wc>=2).sort((a,b)=>b.diff-a.diff||a.t.localeCompare(b.t)).slice(0,4);
 const paradox=r.length>=3&&w.length>=3&&choices.length?'<p class="dna-muted">Comparing '+r.length+' tagged finished books and '+w.length+' tagged want-to-read books.</p>'+choices.map(x=>'<div class="dna-paradox-row"><b>'+esc(x.t)+'</b><span>📖 '+x.rc+'/'+r.length+' ('+Math.round(x.rc/r.length*100)+'%) · 💌 '+x.wc+'/'+w.length+' ('+Math.round(x.wc/w.length*100)+'%)</span><em>'+(x.wc/w.length>x.rc/r.length?'Your wishlist is making eyes at this one.':'Your finished shelf has been keeping receipts.')+'</em></div>').join(''):'<p class="dna-muted">Not enough evidence to gossip yet. We need at least three books with recognized archetype tags in each mode for this genre.</p>';
 const combos=new Map();books.forEach(b=>{const t=tags(b).filter(x=>known.has(x));for(let i=0;i<t.length;i++)for(let j=i+1;j<t.length;j++){const key=[t[i],t[j]].sort().join(' + ');combos.set(key,(combos.get(key)||0)+1)}});
 const top=[...combos].filter(x=>x[1]>=2).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,5);
 const div=document.createElement('div');div.className='dna-phase2';
 div.innerHTML='<section><small>✦ THE MIDNIGHT REVEAL</small><h3>Your Reader Archetypes</h3><div class="dna-archetypes">'+archetypes+'</div></section><section><small>✦ THE TASTE PARADOX</small><h3>What you read vs. what tempts you</h3>'+paradox+'</section><section><small>✦ THE OBSESSION FILES</small><h3>Your favorite double trouble</h3>'+(top.length?top.map(([t,n])=>'<div class="dna-obsession"><span>'+esc(t)+'</span><b>'+n+' books</b></div>').join(''):'<p class="dna-muted">No repeated combinations yet. Your bookshelf is still collecting evidence.</p>')+'</section>';
 panel.querySelector('.dna-shell').appendChild(div);
}
const original=window.renderRomanceDNA;
if(typeof original==='function')window.renderRomanceDNA=function(){original();draw()};
document.getElementById('romanceDnaPanel')?.addEventListener('click',e=>{if(e.target.closest('[data-dna-mode]'))queueMicrotask(draw)});
document.getElementById('romanceDnaPanel')?.addEventListener('change',e=>{if(e.target.id==='dnaGenre')queueMicrotask(draw)});
})();
