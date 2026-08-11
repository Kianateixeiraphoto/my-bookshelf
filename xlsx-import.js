/* Excel / Google Sheets / CSV importer for My Bookshelf. */
(function(){
  window.stars = function(r){
    const n=Number(r); if(!Number.isFinite(n)||n<=0)return '—';
    const filled=Math.min(5,Math.max(0,Math.round(n)));
    return '★'.repeat(filled)+'☆'.repeat(5-filled);
  };
  const fileInput=document.getElementById('fileInput'), importBtn=document.getElementById('importBtn');
  if(!fileInput||!importBtn)return;
  fileInput.accept='.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/json,.json';
  importBtn.onclick=()=>fileInput.click();
  const clean=v=>String(v??'').trim();
  const norm=v=>clean(v).toLowerCase().replace(/[\n\r]+/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
  const num=v=>{const n=Number(clean(v).replace(/,/g,'').replace(/[^0-9.\-]/g,''));return Number.isFinite(n)?n:0;};
  const tags=v=>clean(v).split(/[,;|]/).map(x=>x.trim()).filter(Boolean);
  function headerIndex(headers,names){const wanted=names.map(norm);return headers.findIndex(h=>{const x=norm(h);return wanted.some(w=>x===w);});}
  function pick(row,headers,names){const i=headerIndex(headers,names);return i>=0?row[i]:'';}
  function findHeaderRow(rows){
    let best=-1,bestScore=-1;
    rows.slice(0,30).forEach((row,i)=>{
      const h=row.map(norm);
      const score=['book title','status','pages','author','rating'].reduce((n,k)=>n+(h.includes(k)?1:0),0);
      if(score>bestScore){bestScore=score;best=i;}
    });
    return bestScore>=2?best:-1;
  }
  function statusOf(v){
    const s=clean(v).toLowerCase();
    if(/currently|in progress|reading now/.test(s))return 'Currently Reading';
    if(/dnf|did not finish|abandon/.test(s))return 'DNF';
    if(/want|tbr|wishlist|to read/.test(s))return 'Want to Read';
    if(/read|finished/.test(s))return 'Read';
    return clean(v)||'Read';
  }
  function convertRows(rows){
    const hi=findHeaderRow(rows); if(hi<0)throw new Error('I could not find the book-title headers in this spreadsheet.');
    const headers=rows[hi].map(clean), imported=[];
    for(const row of rows.slice(hi+1)){
      const title=clean(pick(row,headers,['BOOK TITLE','TITLE','NAME']));
      const author=clean(pick(row,headers,['AUTHOR','BOOK AUTHOR','WRITER']));
      const pages=num(pick(row,headers,['PAGES','PAGE COUNT','NUMBER OF PAGES']));
      const rawStatus=clean(pick(row,headers,['STATUS','READING STATUS','BOOK STATUS']));
      // Ignore blank/formatted spreadsheet rows. A real book must have a title and
      // at least one other identifying/data field.
      if(!title || (!author && !pages && !rawStatus)) continue;
      const genre=clean(pick(row,headers,['GENRE','GENRES','TAGS','TROPES','GENRE TAGS']));
      const series=clean(pick(row,headers,['SERIES TITLE & NUMBER','SERIES TITLE','SERIES']));
      const t=tags(genre); if(series)t.push(series);
      imported.push({
        id:crypto.randomUUID(),title,author,status:statusOf(rawStatus),
        rating:num(pick(row,headers,['RATING','STAR RATING','STARS','MY RATING'])),pages,tags:t,
        notes:clean(pick(row,headers,['NOTES','REVIEW','COMMENTS'])),
        cover:clean(pick(row,headers,['COVER','COVER URL','COVER IMAGE','IMAGE URL'])),
        favorite:/^(yes|true|1|y)$/i.test(clean(pick(row,headers,['FAVORITE','FAVORITES']))),
        series,startDate:clean(pick(row,headers,['START DATE','DATE STARTED'])),
        finishDate:clean(pick(row,headers,['FINISH DATE','DATE FINISHED'])),
        pubYear:clean(pick(row,headers,['PUB YEAR','PUBLICATION YEAR','YEAR'])),
        format:clean(pick(row,headers,['FORMAT','BOOK FORMAT'])),length:clean(pick(row,headers,['LENGTH','BOOK LENGTH'])),
        readership:clean(pick(row,headers,['READERSHIP CATEGORY','READERSHIP'])),
        published:clean(pick(row,headers,['PUBLISHED','PUBLISHING'])),ku:clean(pick(row,headers,['KU','KINDLE UNLIMITED'])),country:clean(pick(row,headers,['COUNTRY']))
      });
    }
    if(!imported.length)throw new Error('I found the headers, but no actual book rows underneath them.');
    return imported;
  }
  async function importFile(file){
    const ext=file.name.toLowerCase().split('.').pop();
    if(ext==='json'){
      const incoming=JSON.parse(await file.text());
      if(!incoming||!Array.isArray(incoming.books))throw new Error('That JSON backup does not contain a books list.');
      return incoming.books;
    }
    if(typeof XLSX==='undefined')throw new Error('Spreadsheet support did not load. Please refresh and try again.');
    const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});
    // Prefer the first sheet containing our real book headers; do not select a
    // worksheet merely because it has many formatted/empty rows.
    let rows=null;
    for(const name of wb.SheetNames){
      const candidate=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:'',raw:false});
      if(findHeaderRow(candidate)>=0){rows=candidate;break;}
    }
    if(!rows)throw new Error('The workbook could not be read as a bookshelf spreadsheet.');
    return convertRows(rows);
  }
  fileInput.onchange=async e=>{
    const f=e.target.files[0];if(!f)return;
    try{
      const imported=await importFile(f), existing=Array.isArray(state.books)?state.books:[];
      // If a previous broken import created hundreds of bogus rows, replace that
      // bad bulk import with the real spreadsheet instead of merging into it.
      const badBulk=existing.length>500 && imported.length<500;
      let added=0,updated=0;
      if(badBulk){state.books=imported;added=imported.length;updated=0;}
      else{
        const byKey=new Map(existing.map(b=>[norm(b.title)+'|'+norm(b.author),b]));
        for(const book of imported){
          const key=norm(book.title)+'|'+norm(book.author),old=byKey.get(key);
          if(old){Object.assign(old,book,{id:old.id,cover:old.cover||book.cover||'',favorite:!!old.favorite});updated++;}
          else{existing.push(book);byKey.set(key,book);added++;}
        }
        state.books=existing;
      }
      saveLocal();render();if(typeof sync==='function'&&session)await sync();
      alert('Spreadsheet imported!\n\nAdded: '+added+'\nUpdated: '+updated+(badBulk?'\n\nI also removed the accidental bulk-imported placeholder rows.':''));
    }catch(err){console.error('Import failed:',err);alert('I could not import that file.\n\n'+(err.message||err));}
    finally{e.target.value='';}
  };
})();