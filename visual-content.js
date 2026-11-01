/* Apply only plain text and a small, validated set of styles from site settings. */
(() => {
  const fonts = {vazir:'Vazir,Tahoma,sans-serif', tahoma:'Tahoma,sans-serif', arial:'Arial,sans-serif', georgia:'Georgia,serif', impact:'Impact,Arial,sans-serif'};
  const keys = ['color','backgroundColor','fontFamily','fontSize','fontWeight','textAlign','whiteSpace','transform','display'];
  const originals = new Map();
  const imageTarget = el => el.matches('img') ? el : el.matches('.about-portrait') ? el.querySelector('img') : null;
  function capture() {
    document.querySelectorAll('[data-visual-id]').forEach(el => {
      if (originals.has(el)) return;
      const styles = Object.fromEntries(keys.map(key => [key, el.style[key]]));
      originals.set(el, {styles, imageSrc: imageTarget(el)?.getAttribute('src'), children: el.hasAttribute('data-visual-style-only') ? null : [...el.childNodes].map(node => node.cloneNode(true))});
    });
  }
  function syncObjects(changes) {
    const objects = Array.isArray(changes.__objects) ? changes.__objects.slice(0, 50) : [];
    const valid = objects.filter(o => o && /^custom-[a-z0-9-]{1,60}$/.test(o.id) && ['text','image'].includes(o.type) && ['hero','works','about','contact'].includes(o.section));
    const ids = new Set(valid.map(o => o.id));
    document.querySelectorAll('[data-visual-dynamic]').forEach(el => { if (!ids.has(el.dataset.visualId)) { originals.delete(el); el.remove(); } });
    for (const o of valid) {
      let el = [...document.querySelectorAll('[data-visual-dynamic]')].find(n => n.dataset.visualId === o.id);
      if (!el) {
        const host = o.section === 'hero' ? document.querySelector('.hero') : document.getElementById(o.section);
        if (!host) continue;
        let container = host.querySelector(':scope > .donarez-extra');
        if (!container) { container = document.createElement('div'); container.className = 'donarez-extra'; host.append(container); }
        el = document.createElement(o.type === 'image' ? 'img' : 'p');
        el.dataset.visualId = o.id; el.dataset.visualDynamic = ''; el.dataset.visualLabel = o.type === 'image' ? 'تصویر افزوده‌شده' : 'متن افزوده‌شده';
        if (o.type === 'image') { el.dataset.visualStyleOnly = ''; el.alt = 'Portfolio image'; el.loading = 'lazy'; }
        else el.textContent = typeof o.text === 'string' ? o.text.slice(0,3000) : '';
        container.append(el);
      }
      if (o.type === 'image' && typeof o.src === 'string' && /^(https:\/\/|images\/)/i.test(o.src)) el.src = o.src;
    }
  }
  function apply(settings) {
    const changes = settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {};
    syncObjects(changes);
    capture();
    for (const [el, original] of originals) {
      if (!el.isConnected) continue;
      for (const key of keys) el.style[key] = original.styles[key];
      if (original.children) el.replaceChildren(...original.children.map(node => node.cloneNode(true)));
      const change = changes[el.dataset.visualId];
      if (!change || typeof change !== 'object' || Array.isArray(change)) continue;
      if (original.children && typeof change.text === 'string' && change.text.length <= 3000) {
        el.textContent = change.text;
        el.style.whiteSpace = 'pre-line';
      }
      for (const [field, css] of [['color','color'],['background','backgroundColor']])
        if (typeof change[field] === 'string' && /^#[0-9a-f]{6}$/i.test(change[field])) el.style[css] = change[field];
      if (Object.hasOwn(fonts, change.font)) el.style.fontFamily = fonts[change.font];
      if (Number.isInteger(change.size) && change.size >= 8 && change.size <= 160) el.style.fontSize = `${change.size}px`;
      if (['400','500','600','700','800','900'].includes(change.weight)) el.style.fontWeight = change.weight;
      if (['right','center','left'].includes(change.align)) el.style.textAlign = change.align;
      if (Number.isFinite(change.x) && Number.isFinite(change.y) && Math.abs(change.x) <= 1500 && Math.abs(change.y) <= 1500) el.style.transform = `translate(${change.x}px, ${change.y}px)`;
      if (change.hidden === true) el.style.display = 'none';
      const img = imageTarget(el);
      if (img && original.imageSrc !== undefined) img.setAttribute('src', original.imageSrc);
      if (img && typeof change.imageUrl === 'string' && /^(https:\/\/|images\/)/i.test(change.imageUrl)) img.src = change.imageUrl;
    }
  }
  window.DonarezVisual = {apply};
})();
