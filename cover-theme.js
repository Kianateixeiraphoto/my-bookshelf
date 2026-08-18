/* My Bookshelf — cover-inspired book card theming */
(() => {
  const STYLE_ID = 'cover-theme-styles';
  const FALLBACK = { r: 244, g: 228, b: 236 };
  function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0,s=0,l=(max+min)/2;if(d){s=l>.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}h/=6;}return{h:h*360,s:s*100,l:l*100};}
  function usableColor(r,g,b){const {h,s,l}=rgbToHsl(r,g,b);return{h,s:Math.max(32,Math.min(78,s)),l:l<42?Math.max(64,Math.min(76,l+30)):Math.max(62,Math.min(80,l+9))};}
  function setTheme(card,rgb){const c=usableColor(rgb.r,rgb.g,rgb.b);card.style.setProperty('--cover-h',c.h.toFixed(1));card.style.setProperty('--cover-s',c.s.toFixed(1)+'%');card.style.setProperty('--cover-l',c.l.toFixed(1)+'%');card.dataset.coverThemeReady='1';}
  function sampleImage(img,cb){const work=document.createElement('canvas');work.width=32;work.height=32;const ctx=work.getContext('2d',{willReadFrequently:true});if(!ctx)return cb(FALLBACK);try{ctx.drawImage(img,0,0,32,32);const data=ctx.getImageData(0,0,32,32).data;let r=0,g=0,b=0,count=0;for(let i=0;i<data.length;i+=4){if(data[i+3]<150)continue;const rr=data[i],gg=data[i+1],bb=data[i+2];if(rr>245&&gg>245&&bb>245)continue;r+=rr;g+=gg;b+=bb;count++;}cb(count?{r:r/count,g:g/count,b:b/count}:FALLBACK);}catch(_){cb(FALLBACK);}}
  function themeCard(card){if(!card||card.dataset.coverThemePending==='1')return;const img=card.querySelector('.cover img');if(!img)return;card.dataset.coverThemePending='1';const finish=()=>{const sampler=new Image();sampler.crossOrigin='anonymous';sampler.onload=()=>sampleImage(sampler,rgb=>setTheme(card,rgb));sampler.onerror=()=>setTheme(card,FALLBACK);sampler.src=img.currentSrc||img.src;};if(img.complete&&img.naturalWidth)finish();else img.addEventListener('load',finish,{once:true});}
  function installStyles(){if(document.getElementById(STYLE_ID))return;const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
    /* Match the successful Books to Buy visual treatment: cover first, compact text below. */
    .book{display:flex;flex-direction:column;min-height:0;border-radius:20px;overflow:hidden;background:rgba(255,253,253,.94);box-shadow:var(--shadow)}
    .book[data-cover-theme-ready="1"]{background:linear-gradient(135deg,hsl(var(--cover-h),var(--cover-s),var(--cover-l)),hsl(var(--cover-h),calc(var(--cover-s)*.76),calc(var(--cover-l) + 7%)) 72%);border-color:hsl(var(--cover-h),calc(var(--cover-s)*.72),calc(var(--cover-l) - 15%));box-shadow:0 10px 30px hsla(var(--cover-h),58%,42%,.24)}
    .book[data-cover-theme-ready="1"] .book-body{background:linear-gradient(90deg,hsla(var(--cover-h),var(--cover-s),var(--cover-l),.24),hsla(var(--cover-h),calc(var(--cover-s)*.82),calc(var(--cover-l) + 4%),.10) 70%,transparent);color:#000}
    .book[data-cover-theme-ready="1"] .book-title,.book[data-cover-theme-ready="1"] .author,.book[data-cover-theme-ready="1"] .meta{color:#000}
    .book[data-cover-theme-ready="1"] .chips .chip{background:hsl(var(--cover-h),calc(var(--cover-s)*.92),calc(var(--cover-l) - 2%));color:#000;border-color:hsla(var(--cover-h),58%,42%,.25)}
    .book[data-cover-theme-ready="1"] .book-actions .btn:not(.primary){background:hsla(var(--cover-h),calc(var(--cover-s)*.72),96%,.92);border-color:hsl(var(--cover-h),calc(var(--cover-s)*.72),calc(var(--cover-l) - 15%));color:#000}
    .book[data-cover-theme-ready="1"] .cover{background:linear-gradient(145deg,hsl(var(--cover-h),calc(var(--cover-s)*.92),calc(var(--cover-l) - 1%)),hsl(var(--cover-h),calc(var(--cover-s)*.72),calc(var(--cover-l) + 9%)))}
    .book[data-cover-theme-ready="1"] .heart{border-color:hsl(var(--cover-h),calc(var(--cover-s)*.72),calc(var(--cover-l) - 15%));color:#000;background:hsla(var(--cover-h),60%,96%,.78)}
    .book .cover{height:310px;min-height:310px}
    .book .cover img{width:100%;height:100%;min-height:0;object-fit:cover}
    .book .book-body{padding:15px;min-width:0}
    .book .book-title{font-size:19px;line-height:1.2}
    .book .author{font-size:13px;margin-top:4px}
    .book .chips{margin:9px 0}
    .book .meta{font-size:11px;line-height:1.6}
    .book .book-actions{display:flex;gap:7px;margin-top:12px;flex-wrap:wrap}
    .book .book-actions .btn{padding:7px 10px;font-size:11px}
    @media(max-width:900px){.shelf{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}
    @media(max-width:600px){.book .cover{height:240px;min-height:240px}.book .book-body{padding:11px}.book .book-title{font-size:16px}.book .book-actions .btn{padding:6px 8px}.shelf{grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}}
  `;document.head.appendChild(style);}
  function loadFloralVines(){if(document.getElementById('floral-vines-styles'))return;const link=document.createElement('link');link.id='floral-vines-styles';link.rel='stylesheet';link.href='floral-vines.css?v=forest-photo-20260818';document.head.appendChild(link);}
  function apply(){installStyles();document.querySelectorAll('.book').forEach(themeCard);}
  function loadBooksToBuy(){if(document.getElementById('books-to-buy-script'))return;const script=document.createElement('script');script.id='books-to-buy-script';script.src='books-to-buy.js';script.defer=true;document.head.appendChild(script);}
  function start(){loadFloralVines();apply();loadBooksToBuy();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
