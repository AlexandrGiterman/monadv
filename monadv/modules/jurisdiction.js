// jurisdiction.js — Подсудность + Конструктор иска (AK GITTER MANN)
// ES-модуль под ваш загрузчик вкладок: export default async function(el, { cdn, store })
// Визуальный стиль: светлая карточная тема. Печать: шапка справа, заголовок по центру, текст слева.

export default async function render(el, { cdn, store } = {}){
  // ---------- Helpers ----------
  const $  = (sel,root=el)=> root.querySelector(sel);
  const $$ = (sel,root=el)=> Array.from(root.querySelectorAll(sel));
  const S  = (k,v)=> v===undefined ? (store?.getItem(k)||'') : store?.setItem(k,v);
  const K  = (id)=> `monadv.j.${id}`;

  // ---------- Template ----------
  el.innerHTML = `
  <style>
    .monadv-j{
      --bg:#F8FAFC; --card:#FFFFFF; --muted:#6B7280; --text:#111827;
      --accent:#B08250; --ok:#22C55E; --danger:#EF4444;
      --radius:18px; --border:1px solid rgba(0,0,0,.10); --input:#FFFFFF;
      display:grid; gap:12px;
    }
    .monadv-j .row{display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:end}
    .monadv-j .row > .col{min-width:0}
    @media (max-width:900px){ .monadv-j .row{grid-template-columns:1fr} }
    .monadv-j .box{background:var(--card); border:var(--border); border-radius:var(--radius); padding:12px}
    .monadv-j label{display:block; font-size:13px; color:var(--muted)}
    .monadv-j select,.monadv-j input,.monadv-j textarea{
      width:100%; background:var(--input); color:var(--text);
      border:var(--border); border-radius:12px; padding:10px 12px; outline:none;
    }
    .monadv-j textarea{min-height:110px; resize:vertical}
    .monadv-j .muted{color:var(--muted); font-size:12px}
    .monadv-j .actions{display:flex; gap:10px; flex-wrap:wrap}
    .monadv-j button{
      background:var(--accent); border:none; color:#111; border-radius:12px;
      padding:10px 14px; font-weight:800; cursor:pointer
    }
    .monadv-j button.secondary{background:transparent; color:var(--text); border:1px solid rgba(0,0,0,.18)}
    .monadv-j .right{ white-space:pre-wrap; text-align:right }

    /* Печать: шапка справа, заголовок по центру, текст слева */
    @media print{
      body{background:#fff}
      .monadv-j{background:#fff; color:#000}
      .monadv-j .box, .monadv-j .actions{display:none}
      .print-sheet{display:block!important; color:#000; font:14pt/1.35 "Times New Roman",Times,serif; margin:0 auto; max-width:210mm; padding:20mm}
      .print-top{display:flex; align-items:flex-start; gap:20px; margin-bottom:14px}
      .print-left{flex:1 1 60%}
      .print-right{flex:0 0 40%; margin-left:auto; text-align:right}
      .print-title{font-weight:700; text-align:center; margin:14px 0 10px}
      .print-body{white-space:pre-wrap}
      .print-divider{border-bottom:2px solid #000; margin:8px 0 12px}
    }
  </style>

  <div class="monadv-j">
    <!-- Подсудность -->
    <div class="box">
      <div class="row">
        <div class="col">
          <label>Регион</label>
          <select id="region">
            <option value="">— выберите регион —</option>
          </select>
        </div>
        <div class="col">
          <label>Категория суда</label>
          <select id="category" disabled>
            <option value="">— выберите категорию —</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <label>Суд (из списка)</label>
          <select id="courtList" disabled>
            <option value="">— выберите суд —</option>
          </select>
        </div>
        <div class="col">
          <label>Суд (вручную, если нет в списке)</label>
          <input id="court" placeholder="например: Специализированный межрайонный суд по делам несовершеннолетних ВКО"/>
        </div>
      </div>
      <div class="muted">Если суд выбран из списка, он подставится в поле «Суд (вручную)» автоматически — вы можете откорректировать формулировку.</div>
    </div>

    <!-- Стороны и реквизиты -->
    <div class="box">
      <div class="row">
        <div class="col">
          <label>Истец</label>
          <input id="plaintiff" placeholder="ФИО / Наименование, адрес, контакты"/>
        </div>
        <div class="col">
          <label>Ответчик</label>
          <input id="defendant" placeholder="ФИО / Наименование, адрес, контакты"/>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <label>Цена иска (тг)</label>
          <input id="claim" type="number" min="0" step="1" placeholder="0"/>
        </div>
        <div class="col">
          <label>Госпошлина (тг)</label>
          <input id="fee" type="number" min="0" step="1" placeholder="0"/>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <label>Тип документа</label>
          <select id="doctype">
            <option value="Исковое заявление">Иск</option>
            <option value="Заявление">Заявление</option>
            <option value="Жалоба">Жалоба</option>
            <option value="Ходатайство">Ходатайство</option>
          </select>
        </div>
        <div class="col">
          <label>О чём заявление (после «о»)</label>
          <input id="subject" placeholder="взыскании суммы долга; расторжении брака; признании права собственности"/>
        </div>
      </div>
    </div>

    <!-- Полный конструктор -->
    <div class="box">
      <div class="row">
        <div class="col" style="grid-column:1/-1">
          <label>Обстоятельства дела</label>
          <textarea id="facts" placeholder="Когда, где, что произошло; ссылки на документы и участников"></textarea>
        </div>
      </div>
      <div class="row">
        <div class="col" style="grid-column:1/-1">
          <label>Правовое обоснование (нормы права)</label>
          <textarea id="law" placeholder="Например: ст. 9, 917 ГК РК; нормы ГПК РК о подсудности и доказательствах"></textarea>
        </div>
      </div>
      <div class="row">
        <div class="col" style="grid-column:1/-1">
          <label>Подсудность (мотивировка, при необходимости)</label>
          <textarea id="juris" placeholder="Почему выбран данный суд (территориальная/родовая подсудность)"></textarea>
        </div>
      </div>
      <div class="row">
        <div class="col" style="grid-column:1/-1">
          <label>Требования (просительная часть — по пунктам)</label>
          <textarea id="claimsList" placeholder="1) Взыскать ...; 2) Обязать ...; 3) Вынести частное определение ..."></textarea>
        </div>
      </div>
      <div class="row">
        <div class="col" style="grid-column:1/-1">
          <label>Доказательства (по пунктам)</label>
          <textarea id="evidence" placeholder="1) Договор №... от ...; 2) Переписка; 3) Заключение эксперта ..."></textarea>
        </div>
      </div>
      <div class="row">
        <div class="col" style="grid-column:1/-1">
          <label>Приложения (копии по числу участников)</label>
          <textarea id="attachments" placeholder="Квитанция об уплате госпошлины; копия иска; доверенность ..."></textarea>
        </div>
      </div>
    </div>

    <!-- Действия и предпросмотр -->
    <div class="box">
      <div class="actions">
        <button id="gen">Сформировать «шапку»</button>
        <button id="genFull">Сформировать полный текст</button>
        <button id="copy" class="secondary">Копировать</button>
        <button id="print" class="secondary">Печать</button>
      </div>
      <pre id="out" class="right"></pre>
    </div>

    <!-- Печатный холст -->
    <div id="printArea" class="print-sheet" style="display:none">
      <div class="print-top">
        <div class="print-left"><div id="printCourtLeft" class="line"></div></div>
        <div class="print-right">
          <div class="line" id="printPlaintiff"></div>
          <div class="line" id="printDefendant"></div>
          <div class="line" id="printPrice"></div>
          <div class="line" id="printFee"></div>
        </div>
      </div>
      <div class="print-divider"></div>
      <div class="print-title" id="printTitle">ИСКОВОЕ ЗАЯВЛЕНИЕ</div>
      <div class="print-body" id="printBody"></div>
    </div>
  </div>
  `;

  // ---------- Elements ----------
  const region    = $('#region');
  const category  = $('#category');
  const courtList = $('#courtList');
  const court     = $('#court');

  const plaintiff = $('#plaintiff');
  const defendant = $('#defendant');
  const claim     = $('#claim');
  const fee       = $('#fee');
  const doctype   = $('#doctype');
  const subject   = $('#subject');

  const facts     = $('#facts');
  const law       = $('#law');
  const juris     = $('#juris');
  const claimsList= $('#claimsList');
  const evidence  = $('#evidence');
  const attachments=$('#attachments');

  const out       = $('#out');

  // ---------- Autosave ----------
  const autos = [region, category, courtList, court, plaintiff, defendant, claim, fee, doctype, subject, facts, law, juris, claimsList, evidence, attachments];
  autos.forEach(inp=>{
    if(!inp) return;
    const key = K(inp.id);
    const val = S(key);
    if(val){
      if(inp.tagName==='SELECT'){
        Array.from(inp.options).some(o=> (o.value===val) && (inp.value=val, true));
      }else{
        inp.value = val;
      }
    }
    inp.addEventListener('input', ()=> S(key, inp.value||''));
  });

  // ---------- Courts loader ----------
  let COURTS = null;
  try{
    if(typeof cdn === 'function'){
      const url = cdn('data/courts.json');
      const res = await fetch(url, {cache:'no-store'});
      if(res.ok) COURTS = await res.json();
    }
  }catch(e){ /* ignore, fallback to manual court input */ }

  function fillRegions(){
    if(!COURTS) return;
    const opts = ['<option value="">— выберите регион —</option>']
      .concat(Object.keys(COURTS).sort().map(r=>`<option>${r}</option>`));
    region.innerHTML = opts.join('');
    if(S(K('region'))) region.value = S(K('region'));
  }
  function fillCategories(r){
    category.innerHTML = '<option value="">— выберите категорию —</option>';
    category.disabled = true;
    courtList.innerHTML = '<option value="">— выберите суд —</option>';
    courtList.disabled = true;
    if(!COURTS || !r || !COURTS[r]) return;
    const cats = Object.keys(COURTS[r]).sort();
    category.innerHTML = ['<option value="">— выберите категорию —</option>']
      .concat(cats.map(c=>`<option>${c}</option>`)).join('');
    category.disabled = false;
    if(S(K('category'))) category.value = S(K('category'));
  }
  function fillCourts(r,c){
    courtList.innerHTML = '<option value="">— выберите суд —</option>';
    courtList.disabled = true;
    if(!COURTS || !r || !c || !COURTS[r] || !COURTS[r][c]) return;
    const items = COURTS[r][c];
    courtList.innerHTML = ['<option value="">— выберите суд —</option>']
      .concat(items.map(n=>`<option>${n}</option>`)).join('');
    courtList.disabled = false;
    if(S(K('courtList'))) courtList.value = S(K('courtList'));
  }

  if(COURTS){
    fillRegions();
    region.addEventListener('change', ()=>{
      S(K('region'), region.value||'');
      fillCategories(region.value);
      S(K('category'), '');
      S(K('courtList'), '');
      courtList.value=''; category.value='';
    });
    category.addEventListener('change', ()=>{
      S(K('category'), category.value||'');
      fillCourts(region.value, category.value);
      S(K('courtList'), '');
      courtList.value='';
    });
    courtList.addEventListener('change', ()=>{
      S(K('courtList'), courtList.value||'');
      if(courtList.value) court.value = courtList.value;
    });

    if(region.value) fillCategories(region.value);
    if(region.value && category.value) fillCourts(region.value, category.value);
    if(courtList.value) court.value = courtList.value;
  }else{
    region.disabled = category.disabled = courtList.disabled = true;
  }

  // ---------- Generators ----------
  function money(n){
    if(n==null || n==='') return '';
    const num = Number(n);
    return Number.isFinite(num) ? num.toLocaleString('ru-RU') + ' тг' : String(n);
  }

  function genHeader(){
    const lines = [];
    if(court.value) lines.push('В ' + court.value);
    if(plaintiff.value) lines.push('Истец: ' + plaintiff.value);
    if(defendant.value) lines.push('Ответчик: ' + defendant.value);
    if(claim.value) lines.push('Цена иска: ' + money(claim.value));
    if(fee.value) lines.push('Госпошлина: ' + money(fee.value));

    const title = (subject.value ? (doctype.value + ' о ' + subject.value) : doctype.value).toUpperCase();

    out.textContent = lines.join('\\n') + (title ? ('\\n\\n' + title) : '');
    out.scrollIntoView({behavior:'smooth', block:'center'});
  }

  function toList(text){
    const arr = (text||'').split(/\\n+/).map(s=>s.trim()).filter(Boolean);
    return arr.length ? arr.map((s,i)=> (s.match(/^\\d+[).]/)? s : (i+1)+') '+s)) : [];
  }

  function genFull(){
    genHeader();
    const head = out.textContent || '';

    const dt = new Date();
    const d = String(dt.getDate()).padStart(2,'0');
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const y = dt.getFullYear();

    const _facts = (facts.value||'').trim();
    const _law   = (law.value||'').trim();
    const _jur   = (juris.value||'').trim();
    const _claims= toList(claimsList.value||'');
    const _ev    = toList(evidence.value||'');
    const _att   = toList(attachments.value||'');

    const sections = [];
    const docType = doctype.value || 'Иск';
    const title = subject.value ? (docType + ' о ' + subject.value).toUpperCase() : docType.toUpperCase();
    sections.push(title);

    if(_facts) sections.push('ОБСТОЯТЕЛЬСТВА ДЕЛА:\\n' + _facts);
    if(_law)   sections.push('ПРАВОВОЕ ОБОСНОВАНИЕ:\\n' + _law);
    if(_jur)   sections.push('ПОДСУДНОСТЬ:\\n' + _jur);
    if(_claims.length) sections.push('ПРОШУ СУД:\\n' + _claims.join('\\n'));
    if(_ev.length)     sections.push('ДОКАЗАТЕЛЬСТВА:\\n' + _ev.join('\\n'));
    if(_att.length)    sections.push('ПРИЛОЖЕНИЯ:\\n' + _att.join('\\n'));
    sections.push(`\nДата: ${d}.${m}.${y}   Подпись: ____________`);

    out.textContent = head + '\\n\\n' + sections.join('\\n\\n');
    out.scrollIntoView({behavior:'smooth', block:'center'});
  }

  $('#copy').addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(out.textContent||'');
      $('#copy').textContent = 'Скопировано';
      setTimeout(()=> $('#copy').textContent='Копировать', 1400);
    }catch(e){
      alert('Не удалось скопировать. Скопируйте вручную.');
    }
  });

  $('#print').addEventListener('click', ()=>{
    const _subject = (subject.value||'').trim();
    const docType  = (doctype.value||'Иск').trim();
    const title    = (_subject ? (docType + ' о ' + _subject) : docType).toUpperCase();

    const factsV  = (facts.value||'').trim();
    const lawV    = (law.value||'').trim();
    const jurisV  = (juris.value||'').trim();
    const claimsV = (claimsList.value||'').trim();
    const evV     = (evidence.value||'').trim();
    const attV    = (attachments.value||'').trim();

    $('#printCourtLeft').textContent = court.value ? ('В ' + court.value) : '';
    $('#printPlaintiff').textContent = 'Истец: ' + (plaintiff.value||'—');
    $('#printDefendant').textContent = 'Ответчик: ' + (defendant.value||'—');
    $('#printPrice').textContent     = 'Цена иска: ' + (money(claim.value)||'—');
    $('#printFee').textContent       = 'Госпошлина: ' + (money(fee.value)||'—');
    $('#printTitle').textContent     = title;

    const sections = [];
    if(factsV)  sections.push('ОБСТОЯТЕЛЬСТВА ДЕЛА:\\n' + factsV);
    if(lawV)    sections.push('ПРАВОВОЕ ОБОСНОВАНИЕ:\\n' + lawV);
    if(jurisV)  sections.push('ПОДСУДНОСТЬ:\\n' + jurisV);
    if(claimsV){
      const norm = claimsV.split(/\\n+/).map(s=>s.trim()).filter(Boolean)
        .map((s,i)=> (s.match(/^\\d+[).]/)? s : (i+1)+') '+s)).join('\\n');
      sections.push('ПРОШУ СУД:\\n' + norm);
    }
    if(evV){
      const norm = evV.split(/\\n+/).map(s=>s.trim()).filter(Boolean)
        .map((s,i)=> (s.match(/^\\d+[).]/)? s : (i+1)+') '+s)).join('\\n');
      sections.push('ДОКАЗАТЕЛЬСТВА:\\n' + norm);
    }
    if(attV){
      const norm = attV.split(/\\n+/).map(s=>s.trim()).filter(Boolean)
        .map((s,i)=> (s.match(/^\\d+[).]/)? s : (i+1)+') '+s)).join('\\n');
      sections.push('ПРИЛОЖЕНИЯ:\\n' + norm);
    }
    const dt = new Date(), d = String(dt.getDate()).padStart(2,'0'), m = String(dt.getMonth()+1).padStart(2,'0'), y = dt.getFullYear();
   sections.push(`\nДата: ${d}.${m}.${y}   Подпись: ____________`);

    $('#printBody').textContent = sections.join('\\n\\n');

    const sheet = $('#printArea');
    const prev  = sheet.style.display;
    sheet.style.display = 'block';
    window.print();
    sheet.style.display = prev || 'none';
  });

  // Buttons
  $('#gen').addEventListener('click', genHeader);
  $('#genFull').addEventListener('click', genFull);

  genHeader();
}
