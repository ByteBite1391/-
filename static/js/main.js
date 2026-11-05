(function(){
'use strict';
const THEME_KEY='lib_theme';
const THEMES=['light','dark','sepia','night'];
function applyTheme(t){
  if(!THEMES.includes(t))t='light';
  document.documentElement.setAttribute('data-theme',t);
  try{localStorage.setItem(THEME_KEY,t);}catch(e){}
  document.querySelectorAll('.theme-swatch').forEach(el=>{
    el.classList.toggle('active', el.dataset.theme===t);
  });
}
function currentTheme(){try{return localStorage.getItem(THEME_KEY)||'light';}catch(e){return 'light';}}
function bindThemeSwitcher(){
  document.querySelectorAll('.theme-swatch').forEach(el=>{
    el.addEventListener('click',()=>applyTheme(el.dataset.theme));
  });
}
function toFa(n){return String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);}

function clearLessonData(lessonId){
  const keys = [
    'seen_' + lessonId,
    'marked_' + lessonId,
    'book_page_' + lessonId,
    'lib_view_' + lessonId
  ];
  keys.forEach(k => { try{ localStorage.removeItem(k); }catch(e){} });
}
function clearAllData(keepTheme){
  try{
    const theme = keepTheme ? localStorage.getItem('lib_theme') : null;
    localStorage.clear();
    if(theme) localStorage.setItem('lib_theme', theme);
  }catch(e){}
}
window.LibReset = { clearLessonData, clearAllData };

window.LibTheme={applyTheme,currentTheme,bindThemeSwitcher,toFa,THEMES};
document.addEventListener('DOMContentLoaded',()=>{
  applyTheme(currentTheme());
  bindThemeSwitcher();
});
})();
