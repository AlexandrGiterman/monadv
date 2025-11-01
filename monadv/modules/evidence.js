// Калькулятор доказательств v1.0.4 — веса и итоговая убедительность
export default async function render(el, { cdn, store }) {
  const EVID = [
    { k: 'contract', name: 'Договор/заказ-наряд', w: 20 },
    { k: 'acts', name: 'Акты/накладные/счета', w: 18 },
    { k: 'payments', name: 'Оплата (платежки, БВУ, чеки)', w: 16 },
    { k: 'correspondence', name: 'Переписка (email/мессенджеры)', w: 10 },
    { k: 'expert', name: 'Экспертиза/оценка', w: 16 },
    { k: 'witness', name: 'Показания свидетелей', w: 8 },
    { k: 'photo', name: 'Фото/видео/скриншоты', w: 6 },
    { k: 'other', name: 'Иные письменные/вещественные', w: 6 }
  ];
  const saved = JSON.parse(store.getItem('monadv.evidence.sel')||'[]');
  el.innerHTML = `
    <div class="monadv-ev">
      <h2 style="margin:0 0 .5rem">Калькулятор доказательств</h2>
      <p class="muted">Отметьте, что уже есть, и получите «уровень убедительности» и рекомендации.</p>
      <div class="grid"></div>
      <div class="sum" style="margin-top:.75rem;font-weight:700"></div>
      <div class="rec" style="margin-top:.25rem;color:#6b7280"></div>
      <div style="margin-top:.5rem">
        <button id="copyBtn">Скопировать итог</button>
        <button id="clearBtn" class="secondary">Сбросить</button>
      </div>
    </div>
    <style>
      .monadv-ev .grid{display:grid;grid-template-columns:repeat(2,minmax(200px,1fr));gap:.5rem}
      @media (max-width:640px){.monadv-ev .grid{grid-template-columns:1fr}}
      .monadv-ev label{display:flex;align-items:center;gap:.5rem;border:1px solid rgba(0,0,0,.1);border-radius:12px;padding:.6rem .8rem;background:#fff}
      .monadv-ev input[type=checkbox]{transform:scale(1.1)}
      .secondary{background:transparent;border:1px solid rgba(0,0,0,.2);border-radius:12px;padding:.5rem .8rem;cursor:pointer}
    </style>
  `;
  const grid = el.querySelector('.grid');
  EVID.forEach(it=>{
    const row = document.createElement('label');
    row.innerHTML = `<input type="checkbox" data-k="${it.k}"> <span>${it.name}</span> <small style="margin-left:auto;color:#6b7280">${it.w} баллов</small>`;
    const cb = row.querySelector('input'); cb.checked = saved.includes(it.k);
    cb.addEventListener('change', refresh);
    grid.appendChild(row);
  });
  const sumEl = el.querySelector('.sum'), recEl = el.querySelector('.rec');

  function refresh(){
    const cbs = [...grid.querySelectorAll('input[type=checkbox]')];
    const sel = cbs.filter(x=>x.checked).map(x=>x.dataset.k);
    store.setItem('monadv.evidence.sel', JSON.stringify(sel));
    const score = sel.reduce((acc,k)=> acc + (EVID.find(x=>x.k===k)?.w||0), 0);
    const pct = Math.min(100, Math.round(score)); // шкала 0..100
    sumEl.textContent = `Итоговая убедительность: ${pct}%`;
    let tip = 'Рекомендуется собрать ключевые документы: договор, акты, оплату.';
    if(pct >= 75) tip = 'Доказательства сильные; уточните детали (даты, объемы, экспертизу).';
    else if(pct >= 50) tip = 'Средний уровень: добавьте официальные документы (оплата/акты) и экспертизу.';
    else if(pct >= 25) tip = 'Низкий уровень: сосредоточьтесь на договоре/актах/платежах, зафиксируйте переписку.';
    recEl.textContent = tip;
  }
  el.querySelector('#copyBtn').addEventListener('click', ()=>{
    const text = `${sumEl.textContent}\n${recEl.textContent}`;
    navigator.clipboard.writeText(text);
  });
  el.querySelector('#clearBtn').addEventListener('click', ()=>{
    store.removeItem('monadv.evidence.sel'); [...grid.querySelectorAll('input')].forEach(i=>i.checked=false); refresh();
  });
  refresh();
}