// Квинтилиан (гражданские) v1.0.4 — сравнение версий и экспорт
export default async function render(el, { cdn, store }) {
  const questions = [
    "Кто? (субъект)","Что сделал?","Где?","Когда?","Чем?","Почему?","Последствия?"
  ];
  el.innerHTML = `
    <div class="monadv-qc">
      <h2 style="margin:0 0 .5rem">Квинтилиан (гражданские)</h2>
      <div style="display:grid;gap:.5rem;grid-template-columns:1fr 1fr">
        <div><strong>Истец</strong></div><div><strong>Ответчик</strong></div>
        ${questions.map((q,i)=>`
          <div><label>${q}<br><input data-side="pl" data-i="${i}" style="width:100%"></label></div>
          <div><label>${q}<br><input data-side="df" data-i="${i}" style="width:100%"></label></div>
        `).join('')}
      </div>
      <div style="margin-top:.75rem">
        <button id="sum">Сводка</button>
        <button id="export" class="secondary">Экспорт .DOC</button>
      </div>
      <pre id="out" style="margin-top:.5rem;white-space:pre-wrap;background:#f8fafc;border:1px solid rgba(0,0,0,.1);padding:.75rem;border-radius:12px"></pre>
    </div>
    <style>.secondary{background:transparent;border:1px solid rgba(0,0,0,.2);border-radius:12px;padding:.5rem .8rem;cursor:pointer}</style>
  `;
  const inputs = [...el.querySelectorAll('input[data-side]')];
  inputs.forEach(inp=>{
    const key = `monadv.qc.${inp.dataset.side}.${inp.dataset.i}`;
    inp.value = store.getItem(key)||'';
    inp.addEventListener('input',()=>store.setItem(key, inp.value));
  });
  function build(){
    return questions.map((q,i)=>{
      const pl=(store.getItem(`monadv.qc.pl.${i}`)||'').trim();
      const df=(store.getItem(`monadv.qc.df.${i}`)||'').trim();
      const mark = pl && df ? (pl===df ? '✓ совпадает' : '↔ различия') : '…';
      return `${i+1}. ${q}\n  Истец: ${pl||'-'}\n  Ответчик: ${df||'-'}\n  Итог: ${mark}`;
    }).join('\n\n');
  }
  el.querySelector('#sum').addEventListener('click',()=>{ el.querySelector('#out').textContent = build(); });
  el.querySelector('#export').addEventListener('click',()=>{
    const body = build().replace(/\n/g,'<br/>');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Квинтилиан (гр.)</title></head>
    <body style="font:12pt 'Times New Roman'"><h3 style="text-align:center">Сравнительная таблица (Квинтилиан)</h3><div>${body}</div></body></html>`;
    const blob = new Blob(['\ufeff',html],{type:'application/msword'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='quint_civil.doc'; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),0);
  });
}