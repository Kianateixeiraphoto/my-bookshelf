/* Excel / CSV importer for My Bookshelf. Uses the SheetJS global loaded by index.html. */
(function(){
  const fileInput = document.getElementById('fileInput');
  const importBtn = document.getElementById('importBtn');
  if(!fileInput || !importBtn) return;

  fileInput.accept = '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/json,.json';
  importBtn.onclick = function(){ fileInput.click(); };

  const norm = v => String(v ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
  const pick = (row,names) => {
    for(const name of names){
      const key = Object.keys(row).find(k => norm(k) === norm(name));
      if(key && row[key] !== '' && row[key] != null) return row[key];
    }
    return '';
  };
  const num = v => {
    const n = Number(String(v ?? '').replace(/[^0-9.\-]/g,''));
    return Number.isFinite(n) ? n : 0;
  };
  const tags = v => String(v ?? '').split(/[,;|]/).map(x=>x.trim()).filter(Boolean);

  fileInput.onchange = async function(e){
    const f = e.target.files[0];
    if(!f) return;
    try{
      const ext = f.name.toLowerCase().split('.').pop();
      if(ext === 'json'){
        const incoming = JSON.parse(await f.text());
        state = {...state,...incoming};
      } else {
        if(typeof XLSX === 'undefined') throw new Error('Spreadsheet support is still loading. Please try again in a moment.');
        const wb = XLSX.read(await f.arrayBuffer(), {type:'array', cellDates:true});
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, {defval:'', raw:false});
        if(!rows.length) throw new Error('The spreadsheet appears to be empty.');

        const imported = rows.map((r,i)=>{
          const title = pick(r,['Title','Book Title','Name']);
          const author = pick(r,['Author','Book Author','Writer']);
          const rawStatus = String(pick(r,['Status','Reading Status','Book Status']) || '').trim().toLowerCase();
          let status = 'Read';
          if(/currently|reading|in progress|reading now/.test(rawStatus)) status='Currently Reading';
          else if(/dnf|did not finish|abandon/.test(rawStatus)) status='DNF';
          else if(/want|tbr|wishlist|to read/.test(rawStatus)) status='Want to Read';
          return {
            id: crypto.randomUUID(),
            title: String(title || ('Imported Book '+(i+1))),
            author: String(author || ''),
            status,
            rating: num(pick(r,['Rating','Star Rating','Stars','My Rating'])),
            pages: num(pick(r,['Pages','Page Count','Number of Pages'])),
            tags: tags(pick(r,['Tags','Tropes','Genre','Genres','Genre Tags'])),
            notes: String(pick(r,['Notes','Review','Comments'])),
            cover: String(pick(r,['Cover','Cover URL','Cover Image','Image URL'])),
            favorite: /^(yes|true|1|y)$/i.test(String(pick(r,['Favorite','Favorites'])))
          };
        }).filter(b=>b.title);

        const existing = new Map((state.books||[]).map(b=>[norm(b.title)+'|'+norm(b.author), b]));
        let added=0, updated=0;
        for(const book of imported){
          const key = norm(book.title)+'|'+norm(book.author);
          if(existing.has(key)){
            const old = existing.get(key);
            Object.assign(old, {...book, id:old.id});
            updated++;
          } else {
            (state.books||[]).push(book);
            added++;
          }
        }
        saveLocal();
        render();
        if(typeof sync === 'function') await sync();
        alert('Spreadsheet imported! Added '+added+' books and updated '+updated+'.');
      }
      saveLocal();
      render();
      if(ext === 'json' && typeof sync === 'function') await sync();
    } catch(err){
      console.error(err);
      alert('I could not import that file. '+(err.message || err));
    } finally {
      e.target.value='';
    }
  };
})();
