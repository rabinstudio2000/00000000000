/* Apply only plain text and a small, validated set of styles from site settings. */
(() => {
  const fonts = {vazir:'Vazir,Tahoma,sans-serif', tahoma:'Tahoma,sans-serif', arial:'Arial,sans-serif', georgia:'Georgia,serif', impact:'Impact,Arial,sans-serif'};
  const keys = ['color','backgroundColor','fontFamily','fontSize','fontWeight','textAlign','whiteSpace'];
  const originals = new Map();
  function capture() {
    document.querySelectorAll('[data-visual-id]').forEach(el => {
      if (originals.has(el)) return;
      const styles = Object.fromEntries(keys.map(key => [key, el.style[key]]));
      originals.set(el, {styles, children: el.hasAttribute('data-visual-style-only') ? null : [...el.childNodes].map(node => node.cloneNode(true))});
    });
  }
  function apply(settings) {
    capture();
    const changes = settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {};
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
    }
  }
  window.DonarezVisual = {apply};
})();
