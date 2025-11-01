export default async function render(el, { cdn, store }) {
  const MRP = Number(localStorage.getItem('monadv.mrp')) || 3932; // 2025: 3932 тг
  el.innerHTML = `
    <div class="monadv-fee">
      <h2 style="margin:0 0 .5rem">Калькулятор госпошлины (ст. 610 НК РК)</h2>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <label>Категория<br>
          <select id="cat" style="min-width:260px">
            <option value="property">Иск имущественного характера</option>
            <option value="nonprop_complaint_ind">Жалоба на действия госорганов (ФЛ)</option>
            <option value="nonprop_complaint_ent">Жалоба на действия госорганов (ЮЛ)</option>
            <option value="special_proc">Дела особого производства</option>
          </select>
        </label>
        <label id="whoWrap" style="display:none">Истец<br>
          <select id="who" style="min-width:200px">
            <option value="fl">Физическое лицо</option>
            <option value="yl">Юридическое лицо</option>
          </select>
        </label>
        <label id="sumWrap">Цена иска, тг<br><input id="price" type="number" min="0" step="1" style="min-width:220px"></label>
      </div>
      <div style="margin-top:.5rem">
        <small>МРП сейчас: <b id="mrpView"></b> тг. <a href="#" id="setMrp">изменить</a></small>
      </div>
      <div id="res" style="margin-top:.75rem;font-weight:600"></div>
      <div id="note" style="margin-top:.25rem;color:#6b7280"></div>
    </div>
  `;
  const $ = sel => el.querySelector(sel);
  const cat = $('#cat'), who = $('#who'), whoWrap = $('#whoWrap');
  const sumWrap = $('#sumWrap'), price = $('#price');
  const res = $('#res'), note = $('#note'), mrpView = $('#mrpView'), setMrp = $('#setMrp');
  mrpView.textContent = MRP.toLocaleString('ru-RU');
  cat.value  = store.getItem('monadv.fee.cat') || 'property';
  who.value  = store.getItem('monadv.fee.who') || 'fl';
  price.value = store.getItem('monadv.fee.price') || '';
  function fmt(x){ return Math.round(Number(x)||0).toLocaleString('ru-RU'); }
  function calc(){
    const v = Math.max(0, Number(price.value||0));
    let duty = 0;
    if(cat.value === 'property'){
      const rate = (who.value === 'fl') ? 0.01 : 0.03;
      const capMci = (who.value === 'fl') ? 10000 : 20000;
      duty = v * rate;
      const cap = capMci * MRP;
      if (duty > cap) duty = cap;
      sumWrap.style.display = '';
      whoWrap.style.display = '';
      note.innerHTML = 'Основание: ст. 610 НК РК (имущественные: ФЛ 1% ≤ 10 000 МРП; ЮЛ 3% ≤ 20 000 МРП). МРП: '+fmt(MRP)+' тг.';
    } else if (cat.value === 'nonprop_complaint_ind'){
      duty = 0.3 * MRP;
      sumWrap.style.display = 'none';
      whoWrap.style.display = 'none';
      note.textContent = 'Основание: ст. 610 НК РК — жалоба ФЛ на действия госорганов: 0,3 МРП.';
    } else if (cat.value === 'nonprop_complaint_ent'){
      duty = 5 * MRP;
      sumWrap.style.display = 'none';
      whoWrap.style.display = 'none';
      note.textContent = 'Основание: ст. 610 НК РК — жалоба ЮЛ на действия госорганов: 5 МРП.';
    } else if (cat.value === 'special_proc'){
      duty = 0.5 * MRP;
      sumWrap.style.display = 'none';
      whoWrap.style.display = 'none';
      note.textContent = 'Основание: ст. 610 НК РК — дела особого производства: 0,5 МРП.';
    }
    res.textContent = 'Госпошлина: ' + fmt(duty) + ' тг';
    store.setItem('monadv.fee.cat', cat.value);
    store.setItem('monadv.fee.who', who.value);
    store.setItem('monadv.fee.price', price.value);
  }
  cat.addEventListener('change', calc);
  who.addEventListener('change', calc);
  price.addEventListener('input', calc);
  setMrp.addEventListener('click',(e)=>{
    e.preventDefault();
    const val = prompt('Введите МРП (тг)', String(MRP));
    if(!val) return;
    const num = Number(val);
    if(!isFinite(num) || num<=0){ alert('Некорректное значение МРП'); return; }
    localStorage.setItem('monadv.mrp', String(Math.round(num)));
    location.reload();
  });
  calc();
}