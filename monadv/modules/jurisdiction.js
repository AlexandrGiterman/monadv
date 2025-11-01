export default async function render(el, { cdn, store }) {
  el.innerHTML = `
    <div class="monadv-jur">
      <h2 style="margin:0 0 .5rem">Подсудность и конструктор иска</h2>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <label>Регион<br><select id="reg" style="min-width:240px"></select></label>
        <label>Тип суда<br><select id="type" style="min-width:240px"></select></label>
        <label>Суд<br><select id="court" style="min-width:280px"></select></label>
      </div>
      <hr>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <label>Тип документа<br>
          <select id="doctype">
            <option>Иск</option><option>Заявление</option>
            <option>Жалоба</option><option>Ходатайство</option>
          </select>
        </label>
        <label>Цена иска (тг)<br><input id="claim" type="number" min="0" step="1"></label>
        <label>Госпошлина (тг)<br><input id="fee" type="number" min="0" step="1"></label>
      </div>
      <button id="gen" style="margin-top:.75rem">Сформировать «шапку»</button>
      <pre id="out" style="margin-top:.75rem;white-space:pre-wrap;background:#f8fafc;border:1px solid rgba(0,0,0,.1);padding:.75rem;border-radius:12px"></pre>
      <button id="copy" style="margin-top:.5rem">Копировать</button>
    </div>
  `;

  const $ = sel => el.querySelector(sel);
  const reg = $('#reg'), type = $('#type'), court = $('#court');
  const doctype = $('#doctype'), claim = $('#claim'), fee = $('#fee');
  const out = $('#out');

  const data = await fetch(cdn('data/courts.json')).then(r=>r.json()).catch(()=>({}));

  function fillSelect(select, arr){
    select.innerHTML = '';
    (arr||[]).forEach(name => {
      const o = document.createElement('option'); o.textContent = name; o.value = name;
      select.appendChild(o);
    });
  }

  // Инициализация
  const regions = Object.keys(data);
  fillSelect(reg, regions);
  reg.value = store.getItem('monadv.jur.reg') || regions[0] || '';
  function onRegion(){
    const kinds = Object.keys(data[reg.value]||{});
    fillSelect(type, kinds);
    type.value = store.getItem('monadv.jur.type') || kinds[0] || '';
    onType();
  }
  function onType(){
    const courts = (data[reg.value]||{})[type.value] || [];
    fillSelect(court, courts);
    court.value = store.getItem('monadv.jur.court') || courts[0] || '';
  }

  reg.addEventListener('change', ()=>{ store.setItem('monadv.jur.reg', reg.value); onRegion(); });
  type.addEventListener('change', ()=>{ store.setItem('monadv.jur.type', type.value); onType(); });
  court.addEventListener('change', ()=> store.setItem('monadv.jur.court', court.value));
  onRegion();

  $('#gen').addEventListener('click', ()=>{
    const header = `${court.value}\n\nОт: ____________ (Истец)\nК: ____________ (Ответчик)\nТип: ${doctype.value}\nЦена иска: ${claim.value||'-'} тг\nГоспошлина: ${fee.value||'-'} тг`;
    out.textContent = header;
  });
  $('#copy').addEventListener('click', ()=>{
    navigator.clipboard.writeText(out.textContent||'');
    $('#copy').textContent='Скопировано';
    setTimeout(()=>$('#copy').textContent='Копировать',1200);
  });
}