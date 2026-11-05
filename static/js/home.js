(function(){
'use strict';
const LESSONS = window.LESSONS_DATA || [];
const LAST_KEY = 'last_read_lesson';
const seenKey = id => 'seen_' + id;
const markedKey = id => 'marked_' + id;

function loadArr(key){try{return JSON.parse(localStorage.getItem(key)||'[]');}catch(e){return [];}}
function toFa(n){return String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);}

function renderContinue(){
  const host = document.getElementById('continueHost');
  let last=null;
  try{last = JSON.parse(localStorage.getItem(LAST_KEY)||'null');}catch(e){}
  if(!last){host.innerHTML='';return;}
  const lesson = LESSONS.find(l=>l.id===last.lessonId);
  if(!lesson){host.innerHTML='';return;}
  host.innerHTML = `
    <div class="section-h">
      <svg viewBox="0 0 24 24"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg>
      ادامه مطالعه
    </div>
    <a class="lesson-card continue-card" href="lesson.html?id=${lesson.id}">
      <div class="cover"><svg viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z"/></svg></div>
      <h3>${lesson.title}</h3>
      <p>${last.time ? 'آخرین بازدید: ' + new Date(last.time).toLocaleString('fa-IR') : 'ادامه از جایی که رها کردید'}</p>
    </a>`;
}

function renderLessons(){
  const grid = document.getElementById('lessonGrid');
  grid.innerHTML = LESSONS.map(l=>{
    const total = l.questions.length;
    const seen = loadArr(seenKey(l.id)).length;
    const marked = loadArr(markedKey(l.id)).length;
    const pct = total ? Math.round(seen/total*100) : 0;
    return `
      <div class="lesson-card-wrap">
        <a class="lesson-card" href="lesson.html?id=${l.id}">
          <div class="badge">${toFa(pct)}٪</div>
          <div class="cover">
            <svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5z"/><path d="M9 7.5h7M9 11h5"/></svg>
          </div>
          <h3>${l.title}</h3>
          <p>${l.description}</p>
          <div class="progress-track"><span style="width:${pct}%"></span></div>
          <div class="meta">
            <span>${toFa(seen)} از ${toFa(total)} خوانده</span>
            <span>${toFa(marked)} نشان‌شده</span>
          </div>
        </a>
        <button class="btn lesson-reset-btn" data-reset-lesson="${l.id}" title="بازنشانی این درس">
          <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/></svg>
          بازنشانی این درس
        </button>
      </div>`;
  }).join('');
  bindResetButtons();
}


function openConfirm(opts){
  const existing = document.getElementById('confirmModal');
  if(existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay show';
  overlay.id = 'confirmModal';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <h3>
        <svg viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
        ${opts.title}
      </h3>
      <p>${opts.message}</p>
      <div class="modal-actions">
        <button class="btn btn-danger" id="confirmYes">بله، پاک کن</button>
        <button class="btn" id="confirmNo">انصراف</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#confirmYes').onclick = () => { close(); opts.onYes(); };
  overlay.querySelector('#confirmNo').onclick = close;
  overlay.addEventListener('click', e => { if(e.target === overlay) close(); });
}

function bindResetButtons(){
  const globalBtn = document.getElementById('resetAllBtn');
  if(globalBtn && !globalBtn._bound){
    globalBtn._bound = true;
    globalBtn.addEventListener('click', () => {
      openConfirm({
        title: 'پاک کردن همه اطلاعات؟',
        message: 'تمام پیشرفت، سؤال‌های نشان‌شده و «آخرین مطلب» از این مرورگر پاک می‌شود. تم فعلی حفظ خواهد شد.',
        onYes: () => {
          window.LibReset.clearAllData(true);
          renderContinue();
          renderLessons();
        }
      });
    });
  }
  document.querySelectorAll('[data-reset-lesson]').forEach(btn => {
    if(btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-reset-lesson');
      openConfirm({
        title: 'بازنشانی این درس؟',
        message: 'پیشرفت، سؤال‌های نشان‌شده و حالت نمایش این درس پاک می‌شود. بقیه درس‌ها دست‌نخورده می‌مانند.',
        onYes: () => {
          window.LibReset.clearLessonData(id);
          renderContinue();
          renderLessons();
        }
      });
    });
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  renderContinue();
  renderLessons();
  bindResetButtons();
});
window.addEventListener('focus',()=>{renderContinue();renderLessons();});
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden){renderContinue();renderLessons();}
});
})();
