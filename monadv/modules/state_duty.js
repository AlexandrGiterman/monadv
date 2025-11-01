export default async function render(el, { cdn, store }) {
  el.innerHTML = `
    <div class="monadv-fee">
      <h2 style="margin:0 0 .5rem">Калькулятор госпошлины</h2>
      <label>Цена иска, тг<br><input id="price" type="number" min="0" step="1" style="width:220px"></label><br>
      <label>Категория:<br>
        <select id="cat" style="width:220px">
          <option value="property">Имущественный иск</option>
          <option value="nonprop">Неимущественный</option>
        </select>
      </label>
      <div id="res" style="margin-top:.75rem"></div>
    </div>
  `;
  const price = el.querySelector('#price');
  const cat = el.querySelector('#cat');
  const res = el.querySelector('#res');

  function calc(){
    const v = Math.max(0, Number(price.value||0));
    let duty = 0;
    if(cat.value === 'property'){
      // Пример формулы (заглушка): 1% от цены, но не менее 1 МРП
      duty = Math.max(v * 0.01, 1 * 3692); // 3692 тг — пример МРП (замените актуальным)
    }else{
      duty = 1 * 3692; // неимущественный — фиксированный МРП (пример)
    }
    res.textContent = 'Госпошлина: ' + Math.round(duty).toLocaleString('ru-RU') + ' тг';
  }

  [price, cat].forEach(c=>c.addEventListener('input', calc));
  price.value = store.getItem('monadv.state_duty.price')||'';
  cat.value = store.getItem('monadv.state_duty.cat')||'property';
  [price, cat].forEach(c=>c.addEventListener('change', ()=>{
    store.setItem('monadv.state_duty.price', price.value);
    store.setItem('monadv.state_duty.cat', cat.value);
  }));
  calc();
}
