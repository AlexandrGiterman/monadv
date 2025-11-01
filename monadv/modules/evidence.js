export default async function render(el, { cdn, store }) {
  el.innerHTML = `
    <div class="monadv-box">
      <h2 style="margin:0 0 .5rem">Калькулятор доказательств</h2>
      <p>Отметьте, какие доказательства у вас есть:</p>
      <label><input type="checkbox" data-k="contract"> Договор</label><br>
      <label><input type="checkbox" data-k="acts"> Акты выполненных работ</label><br>
      <label><input type="checkbox" data-k="correspondence"> Переписка</label><br>
      <div id="out" style="margin-top:.75rem"></div>
    </div>
  `;
  const out = el.querySelector('#out');
  const boxes = [...el.querySelectorAll('input[type="checkbox"]')];
  const saved = JSON.parse(store.getItem('monadv.evidence')||'[]');
  boxes.forEach(b => b.checked = saved.includes(b.dataset.k));
  const refresh = () => {
    const sel = boxes.filter(b=>b.checked).map(b=>b.dataset.k);
    store.setItem('monadv.evidence', JSON.stringify(sel));
    out.textContent = sel.length ? `Выбрано доказательств: ${sel.length}` : 'Выберите пункты выше';
  };
  boxes.forEach(b => b.addEventListener('change', refresh));
  refresh();
}
