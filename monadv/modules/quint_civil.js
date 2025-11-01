export default async function render(el, { cdn, store }) {
  const questions = [
    "Кто? (субъект)",
    "Что сделал? (действие/бездействие)",
    "Где? (место)",
    "Когда? (время)",
    "Чем? (средство/способ)",
    "Почему? (мотив/цель)",
    "Какие последствия? (вред/ущерб)"
  ];
  el.innerHTML = `
    <div class="monadv-qc">
      <h2 style="margin:0 0 .5rem">Квинтилиан (гражданские)</h2>
      <div style="display:grid;gap:.5rem;grid-template-columns:1fr 1fr">
        <div><strong>Версия истца</strong></div><div><strong>Версия ответчика</strong></div>
        ${questions.map((q,i)=>`
          <div><label>${q}<br><input data-side="pl" data-i="${i}" style="width:100%"></label></div>
          <div><label>${q}<br><input data-side="df" data-i="${i}" style="width:100%"></label></div>
        `).join('')}
      </div>
      <button id="sum" style="margin-top:.75rem">Сводка</button>
      <pre id="out" style="margin-top:.5rem;white-space:pre-wrap;background:#f8fafc;border:1px solid rgba(0,0,0,.1);padding:.75rem;border-radius:12px"></pre>
    </div>
  `;
  const inputs = [...el.querySelectorAll('input[data-side]')];
  inputs.forEach(inp=>{
    const key = `monadv.qc.${inp.dataset.side}.${inp.dataset.i}`;
    inp.value = store.getItem(key)||'';
    inp.addEventListener('input',()=>store.setItem(key, inp.value));
  });
  el.querySelector('#sum').addEventListener('click',()=>{
    const lines = questions.map((q,i)=>{
      const pl = (store.getItem(`monadv.qc.pl.${i}`)||'').trim();
      const df = (store.getItem(`monadv.qc.df.${i}`)||'').trim();
      const mark = pl && df ? (pl===df ? '✓ совпадает' : '↔ различия') : '…';
      return `${i+1}. ${q}\n  Истец: ${pl||'-'}\n  Ответчик: ${df||'-'}\n  Итог: ${mark}`;
    });
    el.querySelector('#out').textContent = lines.join('\n\n');
  });
}
