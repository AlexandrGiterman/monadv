// Квинтилиан (уголовные) v1.0.4 — 5 ролей и экспорт
export default async function render(el, { cdn, store }) {
  const roles = ["Защита","Обвинение","Свидетель 1","Свидетель 2","Свидетель 3"];
  const questions = ["Кто?","Что сделал?","Где?","Когда?","Чем?","Почему?","Последствия?"];
  el.innerHTML = `
    <div class="monadv-qx">
      <h2 style="margin:0 0 .5rem">Квинтилиан (уголовные)</h2>
      <div style="display:grid;gap:.5rem;grid-template-columns:repeat(${roles.length},1fr)">
        ${roles.map(r=>`<div><strong>${r}</strong></div>`).join('')}
        ${questions.map((q,i)=> roles.map((r,ri)=>`
          <div><label>${q}<br><input data-role="${ri}" data-i="${i}" style="width:100%"></label></div>
        `).join('')).join('')}
      </div>
      <div style="margin-top:.75rem">
        <button id="sum">Сводка</button>
        <button id="export" class="secondary">Экспорт .DOC</button>
      </div>
      <pre id="out" style="margin-top:.5rem;white-space:pre-wrap;background:#f8fafc;border:1px solid rgba(0,0,0,.1);padding:.75rem;border-radius:12px"></pre>
    </div>
    <style>.secondary{background:transparent;border:1px solid rgba(0,0,0,.2);border-radius:12px;padding:.5rem .8rem;cursor:pointer}</style>
  `;
  const inputs = [...el.querySelectorAll('input[data-role]')];
  inputs.forEach(inp=>{
    const key = `monadv.qx.${inp.dataset.role}.${inp.dataset.i}`;
    inp.value = store.getItem(key)||'';
    inp.addEventListener('input',()=>store.setItem(key, inp.value));
  });
  function build(){
    return questions.map((q,i)=>{
      const row = roles.map((_,ri)=> (store.getItem(`monadv.qx.${ri}.${i}`)||'-').trim()).join(' | ');
      return `${i+1}. ${q}\n  ${row}`;
    }).join('\n\n');
  }
  el.querySelector('#sum').addEventListener('click',()=>{ el.querySelector('#out').textContent = build(); });
  el.querySelector('#export').addEventListener('click',()=>{
    const body = build().replace(/\n/g,'<br/>');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Квинтилиан (уг.)</title></head>
    <body style="font:12pt 'Times New Roman'"><h3 style="text-align:center">Сводка (Квинтилиан, уголовные)</h3><div>${body}</div></body></html>`;
    const blob = new Blob(['\ufeff',html],{type:'application/msword'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='quint_criminal.doc'; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),0);
  });
}