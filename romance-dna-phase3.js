/* Romance DNA Phase 3 — read-only calling card and native PNG export */
(() => {
'use strict';
const css=`
#romanceDnaPanel .dna-card-section{margin-top:22px;background:#f3e8d4;border:1px solid #bda77e;border-radius:18px;padding:clamp(18px,3vw,28px);color:#294737}
#romanceDnaPanel .dna-card-section h3{font:normal 27px Georgia,serif;margin:8px 0 15px}
#romanceDnaPanel .dna-card-options{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin:12px 0 18px}
#romanceDnaPanel .dna-card-options button{background:#315342;color:#f6ead3}
#romanceDnaPanel .dna-card-options button[aria-pressed=true]{background:#d6bb81;color:#1d3d2d;border-color:#89704b}
#romanceDnaPanel .dna-card-options .dna-export{margin-left:auto;background:#254938;color:#fff1d7}
#romanceDnaPanel .dna-calling-card{max-width:490px;margin:0 auto;padding:30px 28px;border-radius:15px;text-align:center;box-shadow:0 8px 26px #142b252a;position:relative;overflow:hidden}
#romanceDnaPanel .dna-calling-card.botanical{background:#eae4cf;color:#234b37;border:8px double #66815e}
#romanceDnaPanel .dna-calling-card.midnight{background:#132d25;color:#f3e6cc;border:8px double #ba9d65}
#romanceDnaPanel .dna-calling-card.parchment{background:#f8ebd2;color:#61452e;border:8px double #b59a72}
#romanceDnaPanel .dna-card-ornament{font-size:26px;letter-spacing:7px}
#romanceDnaPanel .dna-card-kicker{font-size:11px;letter-spacing:.18em;margin-top:15px}
#romanceDnaPanel .dna-card-title{font:normal clamp(26px,5vw,36px) Georgia,serif;margin:15px 0}
#romanceDnaPanel .dna-card-traits{font-size:14px;line-height:1.8;margin:18px 0}
#romanceDnaPanel .dna-card-quip{font:italic 17px Georgia,serif;line-height:1.5;margin:15px 0}
#romanceDnaPanel .dna-card-bottom{font-size:11px;letter-spacing:.12em;margin-top:24px}
#romanceDnaPanel .dna-card-note{font-size:12px;color:#6a745e;line-height:1.5;margin-top:15px}
@media(max-width:600px){#romanceDnaPanel .dna-card-options .dna-export{margin-left:0;width:100%}}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canon=t=>({'MM':'M/M','MF':'M/F','FF':'F/F','Forbidden Love':'Forbidden Romance','Hurt/Comfort':'Hurt / Comfort'}[t]||t);
const tags=b=>[...new Set((Array.isArray(b.tags)?b.tags:[]).map(canon))];
const read=b=>['read','finished','complete','completed'].includes(String(b.status||'').toLowerCase().trim());
const wish=b=>['want to read','unread','to read','tbr'].includes(String(b.status||'').toLowerCase().trim());
const themes={botanical:{bg:'#eae4cf',fg:'#234b37',accent:'#66815e'},midnight:{bg:'#132d25',fg:'#f3e6cc',accent:'#ba9d65'},parchment:{bg:'#f8ebd2',fg:'#61452e',accent:'#b59a72'}};
let theme='midnight';
function getData(panel){
 const snapshot=typeof window.getRomanceDNASnapshot==='function'?window.getRomanceDNASnapshot():{books:[],mode:'reading',genre:'all'};
 const all=snapshot.books,mode=snapshot.mode,genre=snapshot.genre;
 const books=all.filter(b=>(mode==='reading'?read(b):wish(b))&&(genre==='all'||tags(b).includes(genre)));
 const archetype=panel.querySelector('.dna-archetype h4')?.textContent?.trim()||'The Unwritten Chapter';
 const quip=panel.querySelector('.dna-archetype p')?.textContent?.replace(/[“”]/g,'').trim()||'Your story is still being written.';
 const counts=new Map();books.forEach(b=>tags(b).forEach(t=>counts.set(t,(counts.get(t)||0)+1)));
 const romanceTraits=['Enemies to Lovers','Friends to Lovers','Rivals to Lovers','Second Chance','Forbidden Romance','Slow Burn','Forced Proximity','Groveling','Chasing / Pursuit','Possessive','Protective','Jealousy','Obsessive Love','Touch Them and Die','Mutual Pining','Hurt / Comfort','Power Imbalance','Grumpy x Sunshine','Opposites Attract','Secret Relationship','Betrayal','Fake Dating','Sports Romance','Dark Romance','BDSM','Breeding Kink','Sexual Tension'];
 const top=[...counts].filter(([t])=>romanceTraits.includes(t)).sort((a,b)=>b[1]-a[1]||romanceTraits.indexOf(a[0])-romanceTraits.indexOf(b[0])).slice(0,3).map(x=>x[0]);
 const pair=['M/M','M/F','F/F','M/M/F','M/F/F'].map(t=>[t,counts.get(t)||0]).sort((a,b)=>b[1]-a[1])[0];
 return {mode,genre,books,archetype,quip,top,pair:pair&&pair[1]?pair[0]:'Not yet known'};
}
function render(){
 const panel=document.getElementById('romanceDnaPanel');if(!panel||!panel.querySelector('.dna-shell'))return;
 panel.querySelector('.dna-card-section')?.remove();
 const d=getData(panel),section=document.createElement('section');section.className='dna-card-section';
 // Export is available for every displayed card, including a work-in-progress profile.
 section.innerHTML='<small>✦ THE READER’S CALLING CARD</small><h3>A little portrait of your fictional weaknesses</h3><div class="dna-card-options" role="group" aria-label="Calling card style">'+Object.keys(themes).map(t=>'<button type="button" data-card-theme="'+t+'" aria-pressed="'+(t===theme)+'">'+t[0].toUpperCase()+t.slice(1)+'</button>').join('')+'<button type="button" class="dna-export" id="dnaExportCard">↓ Save as PNG</button></div><div class="dna-calling-card '+theme+'" id="dnaCallingCard"><div class="dna-card-ornament">✦ ☾ ✦</div><div class="dna-card-kicker">MY ROMANCE DNA · '+(d.mode==='reading'?'READING':'ATTRACTION')+'</div><div class="dna-card-title">'+esc(d.archetype)+'</div><div class="dna-card-traits">'+esc(d.top.length?d.top.join(' · '):'Your story is still being written')+'</div><div class="dna-card-quip">“'+esc(d.quip)+'”</div><div class="dna-card-bottom">TOP PAIRING · '+esc(d.pair)+'<br>MY BOOKSHELF · FOREST LIBRARY AFTER DARK</div></div><p class="dna-card-note">'+'Choose a style and save your card as a PNG image. Only the displayed profile is exported—no account details or book records.'+'</p>';
 panel.querySelector('.dna-shell').appendChild(section);
 section.querySelectorAll('[data-card-theme]').forEach(btn=>btn.addEventListener('click',()=>{theme=btn.dataset.cardTheme;render()}));
 section.querySelector('#dnaExportCard').addEventListener('click',()=>exportCard(d));
}
function exportCard(d){
 const t=themes[theme],canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1250;
 const ctx=canvas.getContext('2d');if(!ctx){alert('Your browser could not create the image. Please try another browser.');return;}
 ctx.fillStyle=t.bg;ctx.fillRect(0,0,1000,1250);
 ctx.strokeStyle=t.accent;ctx.lineWidth=8;ctx.strokeRect(35,35,930,1180);ctx.lineWidth=2;ctx.strokeRect(52,52,896,1146);
 ctx.textAlign='center';ctx.fillStyle=t.accent;ctx.font='44px Georgia';ctx.fillText('✦   ☾   ✦',500,170);
 ctx.fillStyle=t.fg;ctx.font='23px Georgia';ctx.fillText('MY ROMANCE DNA  ·  '+(d.mode==='reading'?'READING':'ATTRACTION'),500,265);
 function lines(text,y,font,maxWidth,lineHeight,maxLines){
  ctx.font=font;const words=String(text).split(/\s+/);let line='',out=[];
  for(const word of words){const trial=line?line+' '+word:word;if(ctx.measureText(trial).width>maxWidth&&line){out.push(line);line=word}else line=trial}
  if(line)out.push(line);out.slice(0,maxLines).forEach((l,i)=>ctx.fillText(l,500,y+i*lineHeight));
  return y+Math.min(out.length,maxLines)*lineHeight;
 }
 ctx.font='bold 52px Georgia';lines(d.archetype,395,'bold 52px Georgia',800,68,3);
 ctx.strokeStyle=t.accent;ctx.beginPath();ctx.moveTo(230,565);ctx.lineTo(770,565);ctx.stroke();
 lines(d.top.join('  ·  ')||'Your story is still being written',650,'27px Georgia',800,42,3);
 lines('“'+d.quip+'”',825,'italic 30px Georgia',800,48,4);
 ctx.fillStyle=t.accent;ctx.font='25px Georgia';ctx.fillText('TOP PAIRING  ·  '+d.pair,500,1070);
 ctx.font='20px Georgia';ctx.fillText('MY BOOKSHELF  ·  FOREST LIBRARY AFTER DARK',500,1150);
 canvas.toBlob(blob=>{if(!blob){alert('Unable to export this card. Please try again.');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='my-romance-dna-'+d.mode+'.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)},'image/png');
}
const previous=window.renderRomanceDNA;
if(typeof previous==='function')window.renderRomanceDNA=function(){previous();render()};
const panel=document.getElementById('romanceDnaPanel');
panel?.addEventListener('click',e=>{if(e.target.closest('[data-dna-mode]'))queueMicrotask(render)});
panel?.addEventListener('change',e=>{if(e.target.id==='dnaGenre')queueMicrotask(render)});
})();
