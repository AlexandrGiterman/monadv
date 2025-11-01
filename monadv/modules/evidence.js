// modules/evidence.js — Доказательства (AK GITTER MANN)
// Светлая карточная тема, автосохранение, печать и экспорт текста.

export default async function render(el, { cdn, store } = {}){
  const $  = (sel,root=el)=> root.querySelector(sel);
  const $$ = (sel,root=el)=> Array.from(root.querySelectorAll(sel));
  const S  = (k,v)=> v===undefined ? (store?.getItem(k)||'') : store?.setItem(k,v);
  const K  = (id)=> `monadv.ev.${id}`;

  el.innerHTML = `
  <style>
    .ev{
      --bg:#F8FAFC; --card:#FFFFFF; --muted:#6B7280; --text:#111827;
      --accent:#B08250; --ok:#22C55E; --danger:#EF4444;
      --radius:18px; --border:1px solid rgba(0,0,0,.10); --input:#FFFFFF;
      display:grid; gap:12px;
    }
    .ev .row{display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:end}
    .ev .row-3{display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; align-items:end}
    .ev .box{background:var(--card); border:var(--border); border-radius:var(--radius); padding:12px}
    .ev label{display:block; font-size:13px; color:var(--muted)}
    .ev select,.ev input,.ev textarea{width:100%; background:var(--input); color:var(--text); border:var(--border); border-radius:12px; padding:10px 12px; outline:none}
    .ev textarea{min-height:100px; resize:vertical}
    .ev .actions{display:flex; gap:10px; flex-wrap:wrap}
    .ev button{background:var(--accent); border:none; color:#111; border-radius:12px; padding:10px 14px; font-weight:800; cursor:pointer}
    .ev button.secondary{background:transparent; color:var(--text); border:1px solid rgba(0,0,0,.18)}
    .ev table{width:100%; border-collapse:collapse; font-size:14px}
    .ev th,.ev td{border:1px solid rgba(0,0,0,.1); padding:8px; vertical-align:top; background:#fff}
    .ev th{background:#f3f4f6; font-weight:600}
    .ev .mono{white-space:pre-wrap; font-family:ui-monospace,Menlo,Consolas,monospace}
    @media (max-width:900px){ .ev .row,.ev .row-3{grid-template-columns:1fr} table{display:block; overflow:auto} }
    /* Печать */
    @media print{
      .ev .box, .ev .actions{display:none}
      .print-sheet{display:block!important; color:#000; font:12pt/1.3 "Times New Roman",Times,serif; margin:0 auto; max-width:210mm; padding:15mm}
      .print-title{font-weight:700; text-align:center; margin:0 0 10px}
      .print-body{white-space:pre-wrap}
    }
  </style>

  <div class="ev">
    <div class="box">
      <div class="row-3">
        <div>
          <label>Дело / номер</label>
          <input id="case" placeholder="№, суд, стороны"/>
        </div>
        <div>
          <label>Сторона</label>
          <select id="side">
            <option>Истец</option>
            <option>Ответчик</option>
          </select>
        </div>
        <div>
          <label>Куратор (адвокат)</label>
          <input id="curator" placeholder="ФИО адвоката"/>
        </div>
      </div>
      <div class="actions">
        <button id="add">Добавить доказательство</button>
        <button id="export" class="secondary">Экспорт текста</button>
        <button id="print" class="secondary">Печать</button>
      </div>
    </div>

    <div class="box">
      <table id="tbl">
        <thead>
          <tr>
            <th style="width:38px">#</th>
            <th>Наименование и реквизиты</th>
            <th style="width:130px">Категория</th>
            <th style="width:130px">Относимость</th>
            <th style="width:130px">Допустимость</th>
            <th style="width:130px">Достоверность</th>
            <th style="width:130px">Оценка (0–10)</th>
            <th style="width:48px">×</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div class="actions" style="justify-content:space-between">
        <div class="mono" id="sum">Итоговая оценка: 0 / 10</div>
        <div>
          <button id="clear" class="secondary">Очистить всё</button>
        </div>
      </div>
    </div>

    <!-- Печать -->
    <div id="printArea" class="print-sheet" style="display:none">
      <div class="print-title">ВЕДОМОСТЬ ДОКАЗАТЕЛЬСТВ</div>
      <div class="print-body" id="printBody"></div>
    </div>
  </div>
  `;

  const ids = ['case','side','curator'];
  const [caseEl, sideEl, curatorEl] = ids.map(id => el.querySelector('#'+id));
  ids.forEach(id => { const v=S(K(id)); if(v) el.querySelector('#'+id).value=v; el.querySelector('#'+id).addEventListener('input', e=>S(K(id), e.target.value||'')); });

  const tbody = $('#tbl tbody'); const sumEl = $('#sum');

  function rowTpl(i, data={}){
    const d = Object.assign({name:'',cat:'Письменное',rel:'Да',adm:'Да',cred:'Высокая',score:'0'}, data);
    return `<tr>
      <td>${i+1}</td>
      <td><textarea data-key="name" placeholder="Договор №..., переписка, акт, заключение эксперта...">${d.name||''}</textarea></td>
      <td>
        <select data-key="cat">
          ${['Письменное','Вещественное','Электронное','Показания','Заключение эксперта','Иное'].map(v=>`<option ${v===d.cat?'selected':''}>${v}</option>`).join('')}
        </select>
      </td>
      <td>
        <select data-key="rel">
          ${['Да','Частично','Нет','Н/Д'].map(v=>`<option ${v===d.rel?'selected':''}>${v}</option>`).join('')}
        </select>
      </td>
      <td>
        <select data-key="adm">
          ${['Да','Частично','Нет','Н/Д'].map(v=>`<option ${v===d.adm?'selected':''}>${v}</option>`).join('')}
        </select>
      </td>
      <td>
        <select data-key="cred">
          ${['Высокая','Средняя','Низкая','Н/Д'].map(v=>`<option ${v===d.cred?'selected':''}>${v}</option>`).join('')}
        </select>
      </td>
      <td><input data-key="score" type="number" min="0" max="10" step="1" value="${d.score||0}"/></td>
      <td><button class="secondary" data-del>×</button></td>
    </tr>`;
  }

  function readAll(){
    return $$('#tbl tbody tr').map(tr=>{
      const obj = {};
      $$('textarea,select,input', tr).forEach(inp=> obj[inp.dataset.key] = inp.value);
      return obj;
    });
  }

  function calcSum(rows){
    // простая агрегированная оценка по шкале 0–10: среднее по score
    const nums = rows.map(r=> Number(r.score)).filter(n=> Number.isFinite(n));
    const avg = nums.length ? (nums.reduce((a,b)=>a+b,0)/nums.length) : 0;
    return Math.round(avg * 10)/10;
  }

  function save(){
    const data = JSON.stringify(readAll());
    S(K('rows'), data);
    sumEl.textContent = 'Итоговая оценка: ' + calcSum(JSON.parse(data||'[]')) + ' / 10';
  }

  function restore(){
    const raw = S(K('rows'));
    const list = raw ? JSON.parse(raw) : [];
    tbody.innerHTML = list.map((r,i)=>rowTpl(i,r)).join('') || rowTpl(0,{});
    bind();
    save();
  }

  function bind(){
    $$('#tbl tbody tr').forEach(tr=>{
      $$('textarea,select,input', tr).forEach(inp=> inp.addEventListener('input', save));
      $('[data-del]', tr).addEventListener('click', ()=>{ tr.remove(); renumber(); save(); });
    });
  }

  function renumber(){
    $$('#tbl tbody tr').forEach((tr,i)=> tr.firstElementChild.textContent = String(i+1));
    if(!$('#tbl tbody tr')) tbody.innerHTML = rowTpl(0,{}), bind();
  }

  $('#add').addEventListener('click', ()=>{
    const i = $$('#tbl tbody tr').length;
    const tmp = document.createElement('tbody');
    tmp.innerHTML = rowTpl(i,{});
    tbody.appendChild(tmp.firstElementChild);
    bind(); save();
  });

  $('#clear').addEventListener('click', ()=>{
    if(!confirm('Удалить все строки?')) return;
    S(K('rows'), '[]'); restore();
  });

  $('#export').addEventListener('click', ()=>{
    const rows = readAll();
    const head = [
      caseEl.value ? ('Дело: ' + caseEl.value) : '',
      'Сторона: ' + (sideEl.value||'—'),
      curatorEl.value ? ('Куратор: ' + curatorEl.value) : ''
    ].filter(Boolean).join('\n');
    const body = rows.map((r,i)=> `${i+1}) ${r.name}\n   Категория: ${r.cat}; Относимость: ${r.rel}; Допустимость: ${r.adm}; Достоверность: ${r.cred}; Оценка: ${r.score}`).join('\n\n');
    const text = (head ? head + '\n\n' : '') + body;
    navigator.clipboard.writeText(text).then(()=>{
      alert('Экспортировано в буфер обмена');
    },()=> alert('Скопируйте вручную'));
  });

  // Печать
  $('#print').addEventListener('click', ()=>{
    const rows = readAll();
    const head = [
      caseEl.value ? ('Дело: ' + caseEl.value) : '',
      'Сторона: ' + (sideEl.value||'—'),
      curatorEl.value ? ('Куратор: ' + curatorEl.value) : ''
    ].filter(Boolean).join('\n');
    const body = rows.map((r,i)=> `${i+1}) ${r.name}\n   Категория: ${r.cat}; Относимость: ${r.rel}; Допустимость: ${r.adm}; Достоверность: ${r.cred}; Оценка: ${r.score}`).join('\n\n');
    const text = (head ? head + '\n\n' : '') + body + `\n\nИтоговая оценка: ${calcSum(rows)} / 10`;

    const sheet = $('#printArea'); const prev = sheet.style.display;
    $('#printBody').textContent = text;
    sheet.style.display='block';
    window.print();
    sheet.style.display = prev || 'none';
  });

  restore();
}
