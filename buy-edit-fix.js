/* My Bookshelf — reliable Books to Buy edit controls */
(() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getState = () => (typeof state !== 'undefined' ? state : window.state);
  function addButtons(){
    const panel=document.getElementById('buyPanel');
    const st=getState();
    if(!panel || !st || !Array.isArray(st.buy)) return;
    panel.querySelectorAll('.buy-card').forEach((card,index)=>{
      if(card.querySelector('[data-buy-edit]')) return;
      const wrap=document.createElement('div');
      wrap.className='book-actions buy-entry-actions';
      wrap.style.cssText='display:flex;gap:7px;margin-top:10px;flex-wrap:wrap';
      const edit=document.createElement('button');
      edit.type='button'; edit.className='btn'; edit.dataset.buyEdit='1'; edit.textContent='✏️ Edit';
      edit.onclick=()=>openEdit(index);
      wrap.appendChild(edit); card.appendChild(wrap);
    });
  }
  function openEdit(index){
    const st=getState(); if(!st?.buy?.[index]) return;
    const b=st.buy[index];
    openModal(`<div class="row"><h2>✏️ Edit Buy List Entry</h2><button class="btn" type="button" id="buyEditCancel">Cancel</button></div><form id="buyEditForm" class="form-grid"><label>Book title<input name="title" value="${esc(b.title)}" required style="width:100%;margin-top:5px"></label><label>Author<input name="author" value="${esc(b.author)}" required style="width:100%;margin-top:5px"></label><label>Price<input name="price" type="number" min="0" step="0.01" value="${b.price!==''&&b.price!=null?esc(b.price):''}" placeholder="e.g. 14.99" style="width:100%;margin-top:5px"></label><label>Book cover<input name="cover" type="url" value="${esc(b.cover)}" placeholder="Cover image URL" style="width:100%;margin-top:5px"></label><div id="buyEditPreview" class="wide" style="display:none"></div><input class="wide" name="link" value="${esc(b.link)}" placeholder="Book/store link (optional)"><textarea class="wide" name="summary" placeholder="Summary (optional)">${esc(b.summary)}</textarea><div class="actions wide" style="justify-content:flex-end"><button class="btn" type="button" id="buyEditCancel2">Cancel</button><button class="btn primary" type="submit">Save Changes</button></div></form>`);
    const form=document.getElementById('buyEditForm'), preview=document.getElementById('buyEditPreview');
    const show=()=>{const url=form.elements.cover.value.trim();if(!url){preview.style.display='none';preview.innerHTML='';return}preview.style.display='block';preview.innerHTML=`<div class="buy-cover-preview"><img src="${esc(url)}" alt="Book cover preview"><span>Cover preview</span></div>`};
    form.elements.cover.addEventListener('input',show); show();
    const close=()=>closeModal(); document.getElementById('buyEditCancel').onclick=close;document.getElementById('buyEditCancel2').onclick=close;
    form.onsubmit=e=>{e.preventDefault();const x=Object.fromEntries(new FormData(form).entries());x.price=x.price?Number(x.price):'';st.buy[index]=x;saveLocal();closeModal();render();sync();setTimeout(addButtons,0)};
  }
  function start(){
    addButtons();
    const panel=document.getElementById('buyPanel');
    if(panel && !panel.dataset.buyEditObserver){panel.dataset.buyEditObserver='1';new MutationObserver(addButtons).observe(panel,{childList:true,subtree:true});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,50),{once:true});else setTimeout(start,50);
  window.addEventListener('buy-search-ready',start);
})();
