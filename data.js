const DEFAULT_PROJECTS = [
{id:'ring',title:'Ring',category:'عکاسی',description:'مجموعه‌ای از تصاویر با تمرکز بر جزئیات و روایت بصری.',cover:'images/projects/ring/01.jpg',gallery:Array.from({length:8},(_,i)=>`images/projects/ring/0${i+1}.jpg`)},
{id:'eyla',title:'Café Eyla',category:'هویت بصری',description:'طراحی و خلق فضای بصری برای کافه ایلا.',cover:'images/projects/eyla/cover.jpg',gallery:['images/projects/eyla/cover.jpg']},
{id:'zhinaj',title:'Zhinaj Crafts',category:'بسته‌بندی',description:'روایتی بصری برای محصولات و صنایع دستی ژیناج.',cover:'images/projects/zhinaj/cover.jpg',gallery:['images/projects/zhinaj/cover.jpg']},
{id:'rubikamp',title:'Rubikamp',category:'طراحی گرافیک',description:'مجموعه طراحی‌های پروژه روبیکمپ.',cover:'images/projects/rubikamp/01.jpg',gallery:Array.from({length:8},(_,i)=>`images/projects/rubikamp/0${i+1}.jpg`)},
{id:'ostovar',title:'Ostovar',category:'طراحی گرافیک',description:'مجموعه آثار پروژه استوار.',cover:'images/projects/ostovar/01.jpg',gallery:Array.from({length:9},(_,i)=>`images/projects/ostovar/0${i+1}.jpg`)},
{id:'gozar',title:'Gozar',category:'هویت بصری',description:'مجموعه آثار پروژه گذر.',cover:'images/projects/gozar/cover.jpg',gallery:['images/projects/gozar/cover.jpg',...['02','03','04'].map(x=>`images/projects/gozar/${x}.jpg`)]},
...['keymasi','khadem','niko','reels'].map(id=>({id,title:({keymasi:'Keymasi',khadem:'Khadem',niko:'Niko',reels:'Reels'})[id],category:id==='reels'?'دیجیتال':'طراحی گرافیک',description:'منتخبی از آرشیو تصویری don.arez.',cover:`images/projects/${id}/cover.${id==='keymasi'?'png':'jpg'}`,gallery:[`images/projects/${id}/cover.${id==='keymasi'?'png':'jpg'}`]}))];
const STORE_KEY='donarez.projects.v1';
function loadProjects(){try{const value=localStorage.getItem(STORE_KEY);if(value!==null){const data=JSON.parse(value);if(Array.isArray(data))return data}}catch(e){console.error('Could not load projects',e)}return structuredClone(DEFAULT_PROJECTS)}
function saveProjects(items){localStorage.setItem(STORE_KEY,JSON.stringify(items))}
function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function safeImage(value){const s=String(value||'');return /^(images\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(s)?s:''}
