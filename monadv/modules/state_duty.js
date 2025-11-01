// modules/state_duty.js — Госпошлина (AK GITTER MANN)
// Светлая карточная тема, настраиваемые тарифные шкалы, сохранение пресетов, печать и экспорт.
// ВНИМАНИЕ: проверьте соответствие актуальному Налоговому кодексу РК; при необходимости скорректируйте шкалу в UI.

export default async function render(el, { cdn, store } = {}){
  const $  = (sel,root=el)=> root.querySelector(sel);
  const $$ = (sel,root=el)=> Array.from(root.querySelectorAll(sel));
  const S  = (k,v)=> v===undefined ? (store?.getItem(k)||'') : store?.setItem(k,v);
  const K  = (id)=> `monadv.sd.${id}`;

  el.innerHTML = `
  <style>
    .sd{
      --bg:#F8FAFC; --card:#FFFFFF; --muted:#6B7280; --text:#111827;
      --accent:#B08250; --ok:#22C55E; --danger:#EF4444;
      --radius:18px; --border:1px solid rgba(0,0,0,.10); --input:#FFFFFF;
      display:grid; gap:12px;
    }
    .sd .row{display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:end}
    .sd .box{background:var(--card); border:var(--border); border-radius:var(--radius); padding:12px}
    .sd label{display:block; font-size:13px; color:var(--muted)}
    .sd select,.sd input,.sd textarea{width:100%; background:var(--input); color:var(--text); border:var(--border); border-radius:12px; padding:10px 12px; outline:none}
    .sd table{width:100%; border-collapse:collapse; font-size:14px}
    .sd th,.sd td{border:1px solid rgba(0,0,0,.1); padding:8px; background:#fff}
    .sd th{background:#f3f4f6; font-weight:600}
    .sd .actions{display:flex; gap:10px; flex-wrap:wrap}
    .sd button{background:var(--accent); border:none; color:#111; border-radius:12px; padding:10px 14px; font-weight:800; cursor:pointer}
    .sd button.secondary{background:transparent; color:var(--text); border:1px solid rgba(0,0,0,.18)}
    @media (max-width:900px){ .sd .row{grid-template-columns:1fr} table{display:block; overflow:auto} }
  </style>

  <div class="sd">
    <div class="box">
      <div class="row">
        <div>
          <label>Тип требования</label>
          <select id="mode">
            <option value="property">Имущественное требование</option>
            <option value="nonproperty">Неимущественное требование (фикс.)</option>
          </select>
        </div>
        <div>
          <label>МРП (тг)</label>
          <input id="mrp" type="number" min="0" step="1" placeholder="0"/>
        </div>
      </div>
      <div class="row">
        <div>
          <label>Цена иска (тг)</label>
          <input id="amount" type="number" min="0" step="1" placeholder="0"/>
        </div>
        <div>
          <label>Фиксированная ставка (неимущественные), в МРП</label>
          <input id="fixed_mrp" type="number" min="0" step="0.1" placeholder="1"/>
        </div>
      </div>
      <div class="actions">
        <button id="calc">Рассчитать</button>
        <button id="savePreset" class="secondary">Сохранить пресет</button>
        <button id="loadPreset" class="secondary">Загрузить пресет</button>
        <button id="export" class="secondary">Копировать расчёт</button>
      </div>
    </div>

    <div class="box">
      <h3 style="margin:0 0 8px">Шкала (имущественные)</h3>
      <table id="scale">
        <thead>
          <tr>
            <th style="width:160px">Порог (тг) до…</th>
            <th style="width:160px">Процент, %</th>
            <th style="width:160px">Надбавка, тг</th>
            <th style="width:48px">×</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
      <div class="actions">
        <button id="addStep">Добавить ступень</button>
        <button id="clearSteps" class="secondary">Очистить</button>
      </div>
    </div>

    <div class="box">
      <div class="row">
        <div>
          <label>Результат</label>
          <input id="result" readonly placeholder="0 тг"/>
        </div>
        <div>
          <label>Примечание</label>
          <input id="note" placeholder="Основание, статья НК РК, льготы, понижающие коэффициенты и т.п."/>
        </div>
      </div>
    </div>
  </div>
  `;

  // ---------- Elements ----------
  const mode   = $('#mode');
  const mrp    = $('#mrp');
  const amount = $('#amount');
  const fixed  = $('#fixed_mrp');
  const result = $('#result');
  const note   = $('#note');
  const tbody  = $('#scale tbody');

  // ---------- Presets ----------
  // Сохраняем и загружаем шкалу и значения полей
  function savePreset(){
    const steps = readSteps();
    const data = {
      mode: mode.value, mrp: mrp.value, amount: amount.value, fixed: fixed.value, note: note.value, steps
    };
    S(K('preset'), JSON.stringify(data));
    alert('Сохранено');
  }
  function loadPreset(){
    const raw = S(K('preset')); if(!raw){ alert('Нет сохранённого пресета'); return; }
    const p = JSON.parse(raw);
    mode.value = p.mode||'property';
    mrp.value = p.mrp||'';
    amount.value = p.amount||'';
    fixed.value = p.fixed||'';
    note.value = p.note||'';
    tbody.innerHTML = (p.steps||[]).map((st,i)=> rowTpl(i,st)).join('');
    if(!tbody.children.length){ tbody.innerHTML = rowTpl(0,{}); }
    bindRows(); calc();
  }

  $('#savePreset').addEventListener('click', savePreset);
  $('#loadPreset').addEventListener('click', loadPreset);

  // ---------- Scale table ----------
  function rowTpl(i, d={}){
    const v = Object.assign({limit:'0', pct:'0', add:'0'}, d);
    return `<tr>
      <td><input data-k="limit" type="number" min="0" step="1" value="${v.limit}"/></td>
      <td><input data-k="pct"   type="number" min="0" step="0.01" value="${v.pct}"/></td>
      <td><input data-k="add"   type="number" min="0" step="1" value="${v.add}"/></td>
      <td><button class="secondary" data-del>×</button></td>
    </tr>`;
  }
  function bindRows(){
    $$('#scale tbody tr').forEach(tr=>{
      $$('input', tr).forEach(inp=> inp.addEventListener('input', calc));
      $('[data-del]', tr).addEventListener('click', ()=>{ tr.remove(); renumber(); calc(); });
    });
  }
  function renumber(){
    if(!$('#scale tbody tr')) tbody.innerHTML = rowTpl(0,{}), bindRows();
  }
  function readSteps(){
    return $$('#scale tbody tr').map(tr=>{
      const o = {};
      $$('input', tr).forEach(inp=> o[inp.dataset.k] = Number(inp.value||0));
      return o;
    }).sort((a,b)=> a.limit - b.limit);
  }

  $('#addStep').addEventListener('click', ()=>{
    const i = $$('#scale tbody tr').length;
    const tmp = document.createElement('tbody');
    tmp.innerHTML = rowTpl(i,{});
    tbody.appendChild(tmp.firstElementChild);
    bindRows();
  });
  $('#clearSteps').addEventListener('click', ()=>{
    if(!confirm('Очистить шкалу?')) return;
    tbody.innerHTML = rowTpl(0,{});
    bindRows(); calc();
  });

  // ---------- Calculation ----------
  function calc(){
    const A = Number(amount.value||0);
    const M = Number(mrp.value||0);
    const F = Number(fixed.value||0);
    if(mode.value==='nonproperty'){
      const fee = F * M; // фиксированная ставка в МРП
      result.value = (Number.isFinite(fee)? fee.toLocaleString('ru-RU') : '0') + ' тг';
      return;
    }
    // Имущественные: прогрессивная шкала — применяем ближайшую ступень ("до ..."), +надбавку
    const steps = readSteps();
    let fee = 0;
    for(const st of steps){
      if(A <= st.limit || st.limit===0){
        fee = A * (st.pct/100) + st.add;
        break;
      }
    }
    // если не попали ни в одну ступень — берём последнюю
    if(!fee && steps.length){
      const last = steps[steps.length-1];
      fee = A * (last.pct/100) + last.add;
    }
    result.value = (Number.isFinite(fee)? Math.max(0,Math.round(fee)).toLocaleString('ru-RU') : '0') + ' тг';
  }

  $('#calc').addEventListener('click', calc);
  [mode, mrp, amount, fixed, note].forEach(inp=> inp.addEventListener('input', ()=> S(K(inp.id), inp.value||'')));
  ['mode','mrp','amount','fixed','note'].forEach(id=>{ const v=S(K(id)); if(v) $('#'+id).value=v; });
  calc(); // initial

  // ---------- Export ----------
  $('#export').addEventListener('click', ()=>{
    const steps = readSteps();
    const t = [
      'Тип требования: ' + mode.value,
      'МРП: ' + (mrp.value||'—'),
      'Цена иска: ' + (amount.value||'—'),
      'Фиксированная ставка (МРП): ' + (fixed.value||'—'),
      '',
      'Шкала:',
      ...steps.map((s,i)=> `${i+1}) до ${s.limit} тг: ${s.pct}% + ${s.add} тг`),
      '',
      'Итого госпошлина: ' + (result.value||'0 тг'),
      note.value ? ('Примечание: ' + note.value) : ''
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(t).then(()=> alert('Скопировано в буфер обмена'), ()=> alert('Скопируйте вручную'));
  });

  // ---------- Defaults (пример) ----------
  if(!S(K('preset'))){
    // Пример шкалы: настройте по актуальному НК РК.
    const demo = [
      {limit: 1000000, pct: 3,   add: 0},
      {limit: 5000000, pct: 2,   add: 10000},
      {limit: 10000000, pct: 1.5, add: 50000},
      {limit: 0, pct: 1, add: 100000} // 0 = "свыше"
    ];
    tbody.innerHTML = demo.map((st,i)=> rowTpl(i,st)).join('');
    bindRows();
  }else{
    loadPreset();
  }
}
