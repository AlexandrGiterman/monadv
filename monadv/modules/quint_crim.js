export default async function render(el, { cdn, store }) {
  const roles = ["Защита","Обвинение","Свидетель 1","Свидетель 2","Свидетель 3"];
  const questions = [
    "Кто? (субъект)",
    "Что сделал?",
    "Где?",
    "Когда?",
    "Чем?",
    "Почему?",
    "Последствия?"
  ];
  el.innerHTML = `
    <div class="monadv-qx">
      <h2 style="margin:0 0 .5rem">Квинтилиан (уголовные)</h2>
      <div style="display:grid;gap:.5rem;grid-template-columns:repeat(${roles.length}, 1fr)">
        ${roles.map(r=>`<div><strong>${r}</strong></div>`).join('')}
        ${questions.map((q,i)=> roles.map((r,ri)=>`
          <div><label>${q}<br><input data-role="${ri}" data-i="${i}" style="width:100%"></label></div>
        `).join('')).join('')}
      </div>
      <button id="sum" style="margin-top:.75rem">Сводка</button>
      <pre id="out" style="margin-top:.5rem;white-space:pre-wrap;background:#f8fafc;border:1px solid rgba(0,0,0,.1);padding:.75rem;border-radius:12px"></pre>
    </div>
  `;
  const inputs = [...el.querySelectorAll('input[data-role]')];
  inputs.forEach(inp=>{
    const key = `monadv.qx.${inp.dataset.role}.${inp.dataset.i}`;
    inp.value = store.getItem(key)||'';
    inp.addEventListener('input',()=>store.setItem(key, inp.value));
  });
  el.querySelector('#sum').addEventListener('click',()=>{
    const lines = questions.map((q,i)=>{
      const row = roles.map((_,ri)=> (store.getItem(`monadv.qx.${ri}.${i}`)||'-').trim()).join(' | ');
      return `${i+1}. ${q}\n  ${row}`;
    });
    el.querySelector('#out').textContent = lines.join('\n\n');
  });
}