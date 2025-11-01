// Подсудность + Конструктор иска (v1.0.3)
// - Автовыбор суда по региону/категории
// - Генерация "шапки" иска (справа) + копирование/печать
// - Поддержка цены иска, вычисление госпошлины (та же логика, что в state_duty.js)
// - Сохранение полей в localStorage
export default async function render(el, { cdn, store }) {
  const MRP = Number(localStorage.getItem('monadv.mrp')) || 3932; // МРП-2025, можно менять в state_duty

  // Загружаем справочник судов
  const courts = await fetch(cdn('data/courts.json')).then(r=>r.json()).catch(()=>({}));

  // Типы споров → подсудность (примерные правила)
  const CATS = [
    {id:'family_children', name:'Дела по детям/семье', hint:'СМИС по делам несовершеннолетних', courtGroup:['Суды по детям','Специализированные']},
    {id:'civil_common',    name:'Гражданские общие',   hint:'Городской/районный суд', courtGroup:['Городские','Районные']},
    {id:'economic',        name:'Экономические (хоз.)',hint:'СМИЭС области', courtGroup:['Экономические','Экономический']},
    {id:'admin',           name:'Административные',    hint:'Административный суд', courtGroup:['Административные']},
  ];

  el.innerHTML = `
    <style>
      .monadv-j{display:grid;gap:12px}
      .monadv-j .row{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end}
      .monadv-j .col{min-width:240px}
      .monadv-j .box{background:#f8fafc;border:1px solid rgba(0,0,0,.1);padding:12px;border-radius:12px}
      .monadv-j textarea{width:100%;min-height:120px}
      @media (max-width:640px){.monadv-j .col{flex:1 1 100%}}
      .right{ text-align:right; white-space:pre-wrap }
      .muted{ color:#6b7280; font-size:12px }
    </style>

    <div class="monadv-j">
      <div class="row">
        <label class="col">Регион<br>
          <select id="reg"></select>
        </label>
        <label class="col">Категория спора<br>
          <select id="cat"></select>
          <div class="muted" id="catHint"></div>
        </label>
        <label class="col">Суд<br>
          <select id="court"></select>
        </label>
      </div>

      <div class="row box">
        <label class="col">Тип документа<br>
          <select id="doctype">
            <option>Иск</option><option>Заявление</option>
            <option>Жалоба</option><option>Ходатайство</option>
          </select>
        </label>
        <label class="col">Истец (ФИО/наименование)<br><input id="plaintiff" style="min-width:260px"></label>
        <label class="col">Ответчик (ФИО/наименование)<br><input id="defendant" style="min-width:260px"></label>
      </div>

      <div class="row box">
        <label class="col">Цена иска, тг<br><input id="claim" type="number" min="0" step="1"></label>
        <label class="col">Кто подаёт<br>
          <select id="who"><option value="fl">Физлицо</option><option value="yl">Юрлицо</option></select>
        </label>
        <label class="col">Госпошлина, тг<br><input id="fee" type="number" min="0" step="1"></label>
        <button id="calc" class="col" style="height:40px">Рассчитать пошлину</button>
        <div class="muted">МРП сейчас: <b id="mrpView"></b> тг (меняется в «Госпошлина» → «изменить МРП»)</div>
      </div>

      <div class="box">
        <div class="row">
          <label class="col" style="flex:1 1 100%">Реквизиты суда (при необходимости)<br>
            <textarea id="courtReq" placeholder="Реквизиты суда для оплаты/почтовые данные"></textarea>
          </label>
        </div>
      </div>

      <!-- Поля для полного конструктора (сворачиваемый блок) -->
      <div class="box" id="fullBlock">
        <div class="row">
          <label class="col" style="flex:1 1 100%">Обстоятельства дела (кратко)<br>
            <textarea id="facts" placeholder="Когда, где, что произошло; ссылки на документы и участников"></textarea>
          </label>
        </div>
        <div class="row">
          <label class="col" style="flex:1 1 100%">Правовое обоснование (нормы права)<br>
            <textarea id="law" placeholder="Например: ст. 9, 917 ГК РК; нормы ГПК РК о подсудности и доказательствах"></textarea>
          </label>
        </div>
        <div class="row">
          <label class="col" style="flex:1 1 100%">Подсудность (мотивировка, если нужна)<br>
            <textarea id="juris" placeholder="Почему выбран данный суд (территориальная, родовая подсудность)"></textarea>
          </label>
        </div>
        <div class="row">
          <label class="col" style="flex:1 1 100%">Требования (просительная часть — по пунктам)<br>
            <textarea id="claimsList" placeholder="1) Взыскать ...; 2) Обязать ...; 3) Вынести частное определение ..."></textarea>
          </label>
        </div>
        <div class="row">
          <label class="col" style="flex:1 1 100%">Доказательства (по пунктам)<br>
            <textarea id="evidence" placeholder="1) Договор №... от ...; 2) Переписка; 3) Заключение эксперта ..."></textarea>
          </label>
        </div>
        <div class="row">
          <label class="col" style="flex:1 1 100%">Приложения (копии по числу участников)<br>
            <textarea id="attachments" placeholder="Квитанция об уплате госпошлины; копия иска; доверенность ..."></textarea>
          </label>
        </div>
      </div>

      <div class="row">
        <button id="gen">Сформировать «шапку»</button>
        <button id="genFull">Сформировать полный текст</button>
        <button id="copy">Копировать</button>
        <button id="print">Печать</button>
      </div>

      <div class="box right" id="out"></div>
    </div>
  `;

  // DOM helpers
  const $ = (s)=> el.querySelector(s);
  const reg=$('#reg'), cat=$('#cat'), court=$('#court'), catHint=$('#catHint');
  const doctype=$('#doctype'), plaintiff=$('#plaintiff'), defendant=$('#defendant');
  const claim=$('#claim'), who=$('#who'), fee=$('#fee'), calcBtn=$('#calc'), mrpView=$('#mrpView');
  const courtReq=$('#courtReq'), out=$('#out');

  mrpView.textContent = MRP.toLocaleString('ru-RU');

  // Заполняем списки
  const regions = Object.keys(courts);
  regions.sort();
  reg.innerHTML = regions.map(r=>`<option>${r}</option>`).join('');
  cat.innerHTML = CATS.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');

  // Восстанавливаем состояние
  reg.value       = store.getItem('monadv.j.reg') || regions[0] || '';
  cat.value       = store.getItem('monadv.j.cat') || (CATS[0]&&CATS[0].id) || '';
  doctype.value   = store.getItem('monadv.j.doc') || 'Иск';
  plaintiff.value = store.getItem('monadv.j.plaintiff') || '';
  defendant.value = store.getItem('monadv.j.defendant') || '';
  claim.value     = store.getItem('monadv.j.claim') || '';
  who.value       = store.getItem('monadv.j.who') || 'fl';
  fee.value       = store.getItem('monadv.j.fee') || '';
  courtReq.value  = store.getItem('monadv.j.courtReq') || '';

  function save(){
    store.setItem('monadv.j.reg', reg.value);
    store.setItem('monadv.j.cat', cat.value);
    store.setItem('monadv.j.doc', doctype.value);
    store.setItem('monadv.j.plaintiff', plaintiff.value);
    store.setItem('monadv.j.defendant', defendant.value);
    store.setItem('monadv.j.claim', claim.value);
    store.setItem('monadv.j.who', who.value);
    store.setItem('monadv.j.fee', fee.value);
    store.setItem('monadv.j.courtReq', courtReq.value);
  }

  // Автовыбор суда по категории
  function fillCourts(){
    const groups = (CATS.find(x=>x.id===cat.value)||{}).courtGroup || [];
    catHint.textContent = (CATS.find(x=>x.id===cat.value)||{}).hint || '';
    // Сливаем подходящие группы в один список
    const byReg = courts[reg.value] || {};
    let list = [];
    groups.forEach(g=>{
      if(Array.isArray(byReg[g])) list = list.concat(byReg[g]);
    });
    // Фоллбэк: если ничего не нашли — все суды региона
    if(list.length===0){
      Object.values(byReg).forEach(arr=>{ if(Array.isArray(arr)) list = list.concat(arr); });
    }
    list = Array.from(new Set(list));
    court.innerHTML = list.map(n=>`<option>${n}</option>`).join('');
    const saved = store.getItem('monadv.j.court')||'';
    if(saved && list.includes(saved)) court.value = saved;
    save();
  }

  reg.addEventListener('change', ()=>{ fillCourts(); save(); });
  cat.addEventListener('change', ()=>{ fillCourts(); save(); });
  court.addEventListener('change', ()=>{ store.setItem('monadv.j.court', court.value); });
  [doctype, plaintiff, defendant, claim, who, fee, courtReq].forEach(inp=> inp.addEventListener('input', save));

  // Первичная инициализация
  fillCourts();

  // Расчет госпошлины (синхронно, чтобы не зависеть от другого модуля)
  function calcFee(){
    const v = Math.max(0, Number(claim.value||0));
    let duty = 0;
    if(v>0){
      // Имущественные (по умолчанию) — ФЛ 1% (≤ 10 000 МРП), ЮЛ 3% (≤ 20 000 МРП)
      const rate = (who.value === 'yl') ? 0.03 : 0.01;
      const cap  = (who.value === 'yl') ? 20000*MRP : 10000*MRP;
      duty = Math.min(v*rate, cap);
      fee.value = String(Math.round(duty));
      save();
    }
  }
  calcBtn.addEventListener('click', calcFee);

  // Генерация «шапки» (выровнено вправо)
  function genHeader(){
    const lines = [
      court.value,
      '',
      `От: ${plaintiff.value||'__________'}`,
      `К:  ${defendant.value||'__________'}`,
      '',
      `Тип документа: ${doctype.value}`,
      `Цена иска: ${claim.value ? Number(claim.value).toLocaleString('ru-RU')+' тг' : '—'}`,
      `Госпошлина: ${fee.value ? Number(fee.value).toLocaleString('ru-RU')+' тг' : '—'}`,
      courtReq.value ? ('\nРеквизиты суда:\n'+courtReq.value) : ''
    ];
    out.textContent = lines.join('\n');
    window.scrollTo({top: out.getBoundingClientRect().top + window.scrollY - 16, behavior:'smooth'});
  }


  // Автосохранение расширенных полей
  const facts = $('#facts'), law = $('#law'), jurisM = $('#juris'),
        claimsList = $('#claimsList'), evidence = $('#evidence'), attachments = $('#attachments');
  [facts, law, jurisM, claimsList, evidence, attachments].forEach(inp=>{
    if(!inp) return;
    const key = 'monadv.j.' + inp.id;
    const val = store.getItem(key) || '';
    if(val) inp.value = val;
    inp.addEventListener('input', ()=> store.setItem(key, inp.value||''));
  });

  function toList(text){
    const arr = (text||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
    return arr.length ? arr.map((s,i)=> (s.match(/^\d+[).]/)? s : (i+1)+') '+s)) : [];
  }

  function genFull(){
    // Сначала шапка (как текст), затем тело
    genHeader(); // заполняет out.textContent
    const head = out.textContent || '';

    const dt = new Date();
    const d = String(dt.getDate()).padStart(2,'0');
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const y = dt.getFullYear();

    const _facts = (facts && facts.value || '').trim();
    const _law = (law && law.value || '').trim();
    const _jur = (jurisM && jurisM.value || '').trim();
    const _claims = toList(claimsList && claimsList.value || '');
    const _ev = toList(evidence && evidence.value || '');
    const _att = toList(attachments && attachments.value || '');

    const sections = [];

    // Заголовок документа (тип)
    sections.push(doctype.value.toUpperCase());

    // Описательная часть
    if(_facts){
      sections.push('ОБСТОЯТЕЛЬСТВА ДЕЛА:\\n' + _facts);
    }

    // Правовое обоснование
    if(_law){
      sections.push('ПРАВОВОЕ ОБОСНОВАНИЕ:\\n' + _law);
    }

    // Подсудность (опционально)
    if(_jur){
      sections.push('ПОДСУДНОСТЬ:\\n' + _jur);
    }

    // Просительная часть
    if(_claims.length){
      sections.push('ПРОШУ СУД:\\n' + _claims.join('\\n'));
    }

    // Доказательства
    if(_ev.length){
      sections.push('ДОКАЗАТЕЛЬСТВА:\\n' + _ev.join('\\n'));
    }

    // Приложения
    if(_att.length){
      sections.push('ПРИЛОЖЕНИЯ:\\n' + _att.join('\\n'));
    }

    sections.push(`\\nДата: ${d}.${m}.${y}   Подпись: ____________`);

    out.textContent = head + '\\n\\n' + sections.join('\\n\\n');
    window.scrollTo({top: out.getBoundingClientRect().top + window.scrollY - 16, behavior:'smooth'});
  }

  $('#gen').addEventListener('click', genHeader);
  $('#genFull').addEventListener('click', genFull);
  $('#copy').addEventListener('click', ()=>{
    navigator.clipboard.writeText(out.textContent||'');
  });
  $('#print').addEventListener('click', ()=>{
    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(`<pre style="font:16px/1.5 system-ui; text-align:right; white-space:pre-wrap">${out.textContent||''}</pre>`);
    w.document.close(); w.focus(); w.print(); w.close();
  });
}
