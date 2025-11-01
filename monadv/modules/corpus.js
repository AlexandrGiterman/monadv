// УК РК — поиск и фильтры v1.0.4
export default async function render(el, { cdn, store }) {
  el.innerHTML = `
    <div class="monadv-uk">
      <h2 style="margin:0 0 .5rem">Состав преступления (УК РК)</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <input id="q" placeholder="Поиск по названию, номеру, тегам" style="width:320px">
        <select id="section">
          <option value="">Все разделы</option>
          <option value="личность">Против личности</option>
          <option value="собственность">Против собственности</option>
          <option value="общественный порядок">Общественный порядок</option>
          <option value="половая неприкосновенность">Половая неприкосновенность</option>
        </select>
        <button id="export" class="secondary">Экспорт списка</button>
      </div>
      <div id="list" style="margin-top:.75rem"></div>
    </div>
    <style>
      .secondary{background:transparent;border:1px solid rgba(0,0,0,.2);border-radius:12px;padding:.5rem .8rem;cursor:pointer}
    </style>
  `;
  const list = el.querySelector('#list'), q = el.querySelector('#q'), section = el.querySelector('#section');
  const items = await fetch(cdn('data/uk.json')).then(r=>r.json()).catch(()=>[]);
  function renderList(){
    const term = (q.value||'').toLowerCase();
    const sec = section.value;
    list.innerHTML = '';
    items
      .filter(x => (!sec || (x.section||'')===sec))
      .filter(x => {
        const hay = [x.id, x.title, (x.tags||[]).join(' ')].join(' ').toLowerCase();
        return !term || hay.includes(term);
      })
      .slice(0,300)
      .forEach(x=>{
        const div = document.createElement('div');
        div.style.cssText = 'padding:.6rem .8rem;border:1px solid rgba(0,0,0,.1);border-radius:12px;margin-bottom:.5rem;background:#fff';
        const comp = x.composition || {};
        div.innerHTML = `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
            <strong>${x.title}</strong>
            <small style="color:#6b7280">Раздел: ${x.section||'—'}</small>
          </div>
          <div style="font-size:13px;color:#374151;margin-top:.35rem">
            <div><b>Объект:</b> ${comp.object||'—'}</div>
            <div><b>Объективная сторона:</b> ${comp.objective_side||'—'}</div>
            <div><b>Субъект:</b> ${comp.subject||'—'}</div>
            <div><b>Субъективная сторона:</b> ${comp.subjective_side||'—'}</div>
            <div><b>Санкция:</b> ${x.sanction||'—'}</div>
          </div>`;
        list.appendChild(div);
      });
  }
  q.addEventListener('input', renderList);
  section.addEventListener('change', renderList);
  el.querySelector('#export').addEventListener('click', ()=>{
    const rows = [...list.querySelectorAll('strong')].map(s=>s.textContent);
    const blob = new Blob([rows.join('\n')], {type:'text/plain'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'uk_export.txt'; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),0);
  });
  renderList();
}