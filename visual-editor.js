import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './config.js';
const $ = selector => document.querySelector(selector);
const status = $('#editor-status'), frame = $('#preview'), list = $('#element-list');
const clone = value => JSON.parse(JSON.stringify(value || {}));
const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);
let db, saved = {}, draft = {}, currentId = '', rowVersion = null, elements = new Map(), ready = false;
function say(message, error = false) { status.textContent = message; status.classList.toggle('error', error); }
function unsaved() { return JSON.stringify(saved) !== JSON.stringify(draft); }
function updateButtons() { $('#save').disabled = !ready || !unsaved(); $('#discard').disabled = !ready || !unsaved(); }
function draftFor(id) { if (!isRecord(draft[id])) draft[id] = {}; return draft[id]; }
function cleanup(id) { if (draft[id] && !Object.keys(draft[id]).length) delete draft[id]; }
function refreshPreview() { frame.contentWindow.DonarezVisual.apply(draft); updateButtons(); }
function setProperty(key, value) {
  if (!currentId) return;
  const item = draftFor(currentId);
  if (value === '' || value === null) delete item[key]; else item[key] = value;
  cleanup(currentId); refreshPreview();
}
function selectElement(id) {
  if (!elements.has(id)) return;
  currentId = id;
  const doc = frame.contentDocument;
  doc.querySelectorAll('.donarez-selected').forEach(el => el.classList.remove('donarez-selected'));
  doc.querySelectorAll('[data-visual-id]').forEach(el => { if (el.dataset.visualId === id) el.classList.add('donarez-selected'); });
  list.value = id;
  const element = elements.get(id), item = isRecord(draft[id]) ? draft[id] : {};
  $('#selection-name').textContent = element.dataset.visualLabel || id;
  $('#controls').hidden = false;
  $('#text-label').hidden = element.hasAttribute('data-visual-style-only');
  $('#text-value').value = typeof item.text === 'string' ? item.text : element.textContent.trim();
  for (const name of ['color','background']) {
    $('#'+name+'-enabled').checked = /^#[0-9a-f]{6}$/i.test(item[name] || '');
    $('#'+name).value = item[name] || (name === 'color' ? '#eee9dc' : '#10100e');
    $('#'+name).disabled = !$('#'+name+'-enabled').checked;
  }
  for (const name of ['font','weight','align']) $('#'+name).value = item[name] || '';
  $('#size').value = Number.isInteger(item.size) ? item.size : '';
}
function initPreview() {
  if (ready) return;
  const doc = frame.contentDocument;
  if (!doc?.documentElement || doc.documentElement.dataset.visualReady !== 'true' || !frame.contentWindow.DonarezVisual) return;
  const style = doc.createElement('style');
  style.textContent = '.donarez-selected{outline:2px solid #e0b66e!important;outline-offset:3px!important;cursor:pointer!important} [data-visual-id]:hover{outline:1px dashed #e0b66e;outline-offset:2px;cursor:pointer}';
  doc.head.append(style);
  doc.querySelectorAll('[data-visual-id]').forEach(el => {
    const id = el.dataset.visualId;
    if (/^[a-z0-9-]{1,80}$/.test(id) && !elements.has(id)) elements.set(id, el);
  });
  list.replaceChildren();
  for (const [id, el] of elements) { const option = document.createElement('option'); option.value = id; option.textContent = el.dataset.visualLabel || id; list.append(option); }
  doc.addEventListener('click', event => {
    event.preventDefault(); event.stopPropagation();
    if (event.target.closest('.project')) { say('متن و تصاویر پروژه‌ها را از بخش پروژه‌ها در پنل تغییر دهید.'); return; }
    const el = event.target.closest('[data-visual-id]');
    if (el) selectElement(el.dataset.visualId);
  }, true);
  ready = true; refreshPreview(); selectElement(elements.keys().next().value); say('یک جزء را در پیش‌نمایش انتخاب کنید.');
}
list.addEventListener('change', () => selectElement(list.value));
$('#text-value').addEventListener('input', event => setProperty('text', event.target.value));
for (const name of ['color','background']) {
  $('#'+name+'-enabled').addEventListener('change', event => {
    $('#'+name).disabled = !event.target.checked;
    setProperty(name, event.target.checked ? $('#'+name).value : null);
  });
  $('#'+name).addEventListener('input', event => setProperty(name, event.target.value));
}
for (const name of ['font','weight','align']) $('#'+name).addEventListener('change', event => setProperty(name, event.target.value));
$('#size').addEventListener('input', event => {
  const n = Number(event.target.value);
  if (!event.target.value) setProperty('size', null);
  else if (Number.isInteger(n) && n >= 8 && n <= 160) setProperty('size', n);
});
$('#reset-element').addEventListener('click', () => { delete draft[currentId]; refreshPreview(); selectElement(currentId); });
$('#discard').addEventListener('click', () => { if (!confirm('تغییرات ذخیره‌نشده کنار گذاشته شوند؟')) return; draft = clone(saved); refreshPreview(); selectElement(currentId); say('تغییرات ذخیره‌نشده کنار گذاشته شدند.'); });
for (const mode of ['desktop','mobile']) $('#'+mode).addEventListener('click', () => { frame.classList.toggle('mobile', mode === 'mobile'); $('#desktop').setAttribute('aria-pressed', String(mode === 'desktop')); $('#mobile').setAttribute('aria-pressed', String(mode === 'mobile')); });
window.addEventListener('beforeunload', event => { if (unsaved()) { event.preventDefault(); event.returnValue = ''; } });
$('#save').addEventListener('click', async () => {
  if (!ready || !unsaved()) return;
  $('#save').disabled = true;
  try {
    const latest = await db.from('donarez_settings').select('content,updated_at').eq('id','main').maybeSingle();
    if (latest.error) throw latest.error;
    if ((latest.data?.updated_at || null) !== rowVersion) throw Error('تنظیمات در صفحه دیگری تغییر کرده‌اند. پیش از ویرایش دوباره صفحه را باز کنید.');
    const content = {...(latest.data?.content || {}), visualEditor: clone(draft)}, updated_at = new Date().toISOString();
    const result = rowVersion
      ? await db.from('donarez_settings').update({content, updated_at}).eq('id','main').eq('updated_at',rowVersion).select('updated_at')
      : await db.from('donarez_settings').insert({id:'main',content,updated_at}).select('updated_at');
    if (result.error) throw result.error;
    if (!result.data?.length) throw Error('تنظیمات هم‌زمان تغییر کرده‌اند؛ صفحه را دوباره باز کنید.');
    rowVersion = result.data[0].updated_at; saved = clone(draft); updateButtons(); say('تغییرات ذخیره و در سایت منتشر شدند.');
  } catch (error) { say(error.message || 'ذخیره انجام نشد.', true); updateButtons(); }
});
try {
  if (location.protocol !== 'https:' && !['localhost','127.0.0.1','[::1]'].includes(location.hostname)) throw Error('ویرایشگر فقط با HTTPS یا پیش‌نمایش محلی در دسترس است.');
  db = createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  const session = await db.auth.getSession(); if (session.error) throw session.error;
  const assurance = await db.auth.mfa.getAuthenticatorAssuranceLevel(); if (assurance.error) throw assurance.error;
  if (!session.data.session || assurance.data.currentLevel !== 'aal2') throw Error('ابتدا از پنل مدیریت با تأیید دومرحله‌ای وارد شوید.');
  const permission = await db.rpc('donarez_can_edit'); if (permission.error) throw permission.error;
  if (!permission.data) throw Error('این حساب مجوز ویرایش ندارد.');
  const settings = await db.from('donarez_settings').select('content,updated_at').eq('id','main').maybeSingle(); if (settings.error) throw settings.error;
  rowVersion = settings.data?.updated_at || null;
  saved = clone(isRecord(settings.data?.content?.visualEditor) ? settings.data.content.visualEditor : {}); draft = clone(saved);
  $('#editor-workspace').hidden = false;
  frame.addEventListener('load', () => {
    const doc = frame.contentDocument;
    if (!doc || !frame.contentWindow.DonarezVisual) return;
    doc.addEventListener('donarez:visual-ready', initPreview, {once:true});
    initPreview();
  });
  frame.src = 'index.html?visual-preview=1';
  say('در حال بارگذاری پیش‌نمایش…');
} catch (error) { say(error.message || 'باز کردن ویرایشگر ممکن نشد.', true); }
