export default async function render(el, { cdn, store }) {
  el.innerHTML = `
    <div class="monadv-uk">
      <h2 style="margin:0 0 .5rem">Состав преступления (УК РК)</h2>
      <input id="q" placeholder="Поиск по названию или тегам" style="width:320px">
      <div id="list" style="margin-top:.75rem"></div>
    </div>
  `;
  const list = el.querySelector('#list');
  const q = el.querySelector('#q');
  const items = await fetch(cdn('data/uk.json')).then(r=>r.json()).catch(()=>[]);
  function renderList(){
    const term = (q.value||'').toLowerCase();
    list.innerHTML = '';
    items.filter(x => !term || (x.title||'').toLowerCase().includes(term) || (x.tags||[]).join(' ').toLowerCase().includes(term))
      .slice(0,200)
      .forEach(x=>{
        const div = document.createElement('div');
        div.style.cssText = 'padding:.5rem .75rem;border:1px solid rgba(0,0,0,.1);border-radius:12px;margin-bottom:.5rem';
        div.innerHTML = `<strong>${x.title}</strong><br><small>Теги: ${(x.tags||[]).join(', ')||'—'}</small><br>${x.sanction||''}`;
        list.appendChild(div);
      });
  }
  q.addEventListener('input', renderList);
  renderList();
}