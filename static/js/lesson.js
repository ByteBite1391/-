(function(){
'use strict';
const params = new URLSearchParams(location.search);
const LESSON_ID = params.get('id') || 'lesson1';
const LESSONS = window.LESSONS_DATA || [];
const lesson = LESSONS.find(l=>l.id===LESSON_ID);
if(!lesson){
  document.body.innerHTML = '<p style="padding:40px;text-align:center">درس یافت نشد.</p>';
  return;
}

const TOTAL = lesson.questions.length;
const KEY = {
  view: 'lib_view_' + LESSON_ID,
  marked: 'marked_' + LESSON_ID,
  seen: 'seen_' + LESSON_ID,
  page: 'book_page_' + LESSON_ID,
  last: 'last_read_lesson'
};

const state = {
  view: localStorage.getItem(KEY.view) || 'book',
  page: parseInt(localStorage.getItem(KEY.page) || '0', 10),
  marked: new Set(JSON.parse(localStorage.getItem(KEY.marked) || '[]')),
  seen: new Set(JSON.parse(localStorage.getItem(KEY.seen) || '[]')),
  animating: false
};

const PER_PAGE = 3;
const PAGES = [{type:'cover'}];
for(let i=0;i<lesson.questions.length;i+=PER_PAGE){
  PAGES.push({type:'questions', items: lesson.questions.slice(i, i+PER_PAGE)});
}

function toFa(n){return String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);}
function saveSet(key,set){try{localStorage.setItem(key,JSON.stringify([...set]));}catch(e){}}
function saveLastRead(){
  try{
    localStorage.setItem(KEY.last, JSON.stringify({
      lessonId: LESSON_ID,
      time: Date.now(),
      view: state.view,
      page: state.view==='book' ? state.page : 0,
      scroll: state.view==='notebook' ? window.scrollY : 0
    }));
  }catch(e){}
}
function getLastRead(){try{return JSON.parse(localStorage.getItem(KEY.last)||'null');}catch(e){return null;}}
function updateProgressBar(){
  const pct = TOTAL ? Math.round(state.seen.size/TOTAL*100) : 0;
  const el = document.getElementById('progressFill');
  if(el) el.style.width = pct + '%';
}

const ICON = {
  mark:'<svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
  section:'<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/></svg>',
  book:'<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/><path d="M9 7.5h7M9 11h5"/></svg>',
  arrowRight:'<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
  arrowLeft:'<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>'
};

function renderQuestion(q){
  const marked = state.marked.has(q.id);
  const ansPrefix = q.a.startsWith('<ul>') ? '' : 'پاسخ: ';
  return `
    <div class="question-card ${marked?'marked':''}" data-qid="${q.id}" id="q-${q.id}">
      <div class="question-head">
        <span class="q-num">${toFa(q.id)}</span>
        <div class="q-text">${q.q}</div>
        <button class="mark-btn" data-mark="${q.id}" title="${marked?'حذف نشان':'نشان کردن'}" aria-label="نشان">${ICON.mark}</button>
      </div>
      <div class="a-box">
        <span class="a-icon">${ICON.check}</span>
        <div class="a-text">${ansPrefix}${q.a}</div>
      </div>
    </div>`;
}

function renderBookPage(p, idx, isActive){
  if(p.type === 'cover'){
    return `<div class="book-page ${isActive?'active':''}" data-page="${idx}">
      <div class="book-cover">
        <div class="cover-icon">${ICON.book}</div>
        <h1>${lesson.title}</h1>
        <div class="cover-divider"></div>
        <p>${lesson.subtitle}</p>
      </div>
    </div>`;
  }
  let lastSection = null;
  const inner = p.items.map(q=>{
    let secHtml = '';
    if(q.section && q.section !== lastSection){
      lastSection = q.section;
      secHtml = `<div class="section-badge">${ICON.section} ${q.section}</div>`;
    }
    return secHtml + renderQuestion(q);
  }).join('');
  return `<div class="book-page ${isActive?'active':''}" data-page="${idx}"><div class="book-body">${inner}</div></div>`;
}

function renderBook(){
  const pagesHtml = PAGES.map((p,idx)=>renderBookPage(p, idx, idx===state.page)).join('');
  return `
    <div class="book">
      <div class="book-stage" id="bookStage">${pagesHtml}</div>
      <div class="book-body" style="padding-top:0">
        <div class="page-nav">
          <button class="nav-btn" id="prevBtn">${ICON.arrowRight} قبلی</button>
          <div class="page-indicator">صفحه <strong id="pageNum">${toFa(state.page+1)}</strong> از ${toFa(PAGES.length)}</div>
          <button class="nav-btn" id="nextBtn">بعدی ${ICON.arrowLeft}</button>
        </div>
        <div class="page-dots" id="pageDots">
          ${PAGES.map((_,i)=>`<button class="dot ${i===state.page?'active':''}" data-dot="${i}" title="صفحه ${toFa(i+1)}"></button>`).join('')}
        </div>
      </div>
    </div>`;
}

function renderNotebook(){
  let lastSection = null;
  const itemsHtml = lesson.questions.map(q=>{
    let secHtml = '';
    if(q.section && q.section !== lastSection){
      lastSection = q.section;
      secHtml = `<div class="section-badge">${ICON.section} ${q.section}</div>`;
    }
    return secHtml + renderQuestion(q);
  }).join('');
  return `
    <div class="notebook">
      <div class="notebook-header">
        <div class="nh-icon">${ICON.book}</div>
        <div><h1>${lesson.title}</h1><p>${lesson.subtitle}</p></div>
      </div>
      ${itemsHtml}
    </div>`;
}

function render(){
  const app = document.getElementById('app');
  document.body.classList.toggle('view-book', state.view==='book');
  document.body.classList.toggle('view-notebook', state.view==='notebook');
  app.innerHTML = state.view==='book' ? renderBook() : renderNotebook();

  app.querySelectorAll('.mark-btn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      toggleMark(parseInt(btn.dataset.mark, 10));
    });
  });

  if(state.view==='book'){
    document.getElementById('prevBtn').addEventListener('click',()=>navigate(-1));
    document.getElementById('nextBtn').addEventListener('click',()=>navigate(1));
    document.querySelectorAll('[data-dot]').forEach(d=>{
      d.addEventListener('click',()=>{
        const target = parseInt(d.dataset.dot,10);
        if(target !== state.page) navigateTo(target);
      });
    });
    updateBookNav();
    markPageSeen(state.page);
  }
  if(state.view==='notebook'){
    setupNotebookTracking();
    if(window.__lastScroll){
      requestAnimationFrame(()=>window.scrollTo(0, window.__lastScroll));
      window.__lastScroll = 0;
    }
  }
  updateProgressBar();
}

function updateBookNav(){
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');
  const num = document.getElementById('pageNum');
  if(prev) prev.disabled = state.page <= 0;
  if(next) next.disabled = state.page >= PAGES.length - 1;
  if(num) num.textContent = toFa(state.page + 1);
  document.querySelectorAll('[data-dot]').forEach(d=>{
    d.classList.toggle('active', parseInt(d.dataset.dot,10) === state.page);
  });
}

function navigate(dir){ navigateTo(state.page + dir); }

function navigateTo(target){
  if(state.animating) return;
  if(target < 0 || target >= PAGES.length) return;
  if(target === state.page) return;
  state.animating = true;
  const dir = target > state.page ? 'next' : 'prev';
  const prev = state.page;
  state.page = target;
  const outEl = document.querySelector(`.book-page[data-page="${prev}"]`);
  const inEl  = document.querySelector(`.book-page[data-page="${target}"]`);
  if(!outEl || !inEl){ state.animating=false; return; }
  inEl.classList.add('active', `flip-in-${dir}`);
  outEl.classList.add(`flip-out-${dir}`);
  setTimeout(()=>{
    outEl.classList.remove('active', `flip-out-${dir}`);
    inEl.classList.remove(`flip-in-${dir}`);
    state.animating = false;
    try{localStorage.setItem(KEY.page, String(state.page));}catch(e){}
    updateBookNav();
    markPageSeen(state.page);
    saveLastRead();
  }, 700);
  inEl.scrollTop = 0;
  saveLastRead();
}

function markPageSeen(idx){
  const p = PAGES[idx];
  if(!p || p.type !== 'questions') return;
  let changed = false;
  p.items.forEach(q=>{
    if(!state.seen.has(q.id)){ state.seen.add(q.id); changed=true; }
  });
  if(changed){ saveSet(KEY.seen, state.seen); updateProgressBar(); }
}

function setupNotebookTracking(){
  if(!('IntersectionObserver' in window)) return;
  const cards = document.querySelectorAll('.question-card');
  const io = new IntersectionObserver(entries=>{
    let changed = false;
    entries.forEach(e=>{
      if(e.isIntersecting && e.intersectionRatio >= 0.5){
        const id = parseInt(e.target.dataset.qid,10);
        if(!state.seen.has(id)){ state.seen.add(id); changed=true; }
      }
    });
    if(changed){ saveSet(KEY.seen, state.seen); updateProgressBar(); saveLastRead(); }
  }, {threshold:[0.5]});
  cards.forEach(c=>io.observe(c));
}

function toggleMark(id){
  if(state.marked.has(id)) state.marked.delete(id);
  else state.marked.add(id);
  saveSet(KEY.marked, state.marked);
  document.querySelectorAll(`.question-card[data-qid="${id}"]`).forEach(card=>{
    const isMarked = state.marked.has(id);
    card.classList.toggle('marked', isMarked);
    const btn = card.querySelector('.mark-btn');
    if(btn){
      btn.title = isMarked ? 'حذف نشان' : 'نشان کردن';
      btn.setAttribute('aria-label', btn.title);
    }
  });
}

function toggleView(){
  state.view = state.view === 'book' ? 'notebook' : 'book';
  try{localStorage.setItem(KEY.view, state.view);}catch(e){}
  render();
}

function doPrint(){ window.print(); }

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('viewBtn').addEventListener('click', toggleView);
  document.getElementById('printBtn').addEventListener('click', doPrint);

  const last = getLastRead();
  if(last && last.lessonId===LESSON_ID){
    if(state.view==='book' && typeof last.page==='number'){
      state.page = Math.min(Math.max(0,last.page), PAGES.length-1);
    }
    if(state.view==='notebook' && typeof last.scroll==='number'){
      window.__lastScroll = last.scroll;
    }
  }
  if(params.has('page')){
    const p = parseInt(params.get('page'),10);
    if(!isNaN(p)) state.page = Math.min(Math.max(0,p), PAGES.length-1);
  }
  render();

  document.getElementById('topFab').addEventListener('click',()=>{
    window.scrollTo({top:0,behavior:'smooth'});
  });

  let scrollTimer = null;
  window.addEventListener('scroll',()=>{
    if(state.view!=='notebook') return;
    if(scrollTimer) return;
    scrollTimer = setTimeout(()=>{ scrollTimer=null; saveLastRead(); }, 800);
  });

  
  const resetBtn = document.getElementById('resetLessonBtn');
  if(resetBtn){
    resetBtn.addEventListener('click', () => {
      if(!confirm('همه پیشرفت، نشان‌ها و وضعیت این درس پاک شود؟ (فقط همین درس)')) return;
      try{
        localStorage.removeItem(KEY.marked);
        localStorage.removeItem(KEY.seen);
        localStorage.removeItem(KEY.page);
        localStorage.removeItem(KEY.view);
        const last = getLastRead();
        if(last && last.lessonId === LESSON_ID){
          localStorage.removeItem(KEY.last);
        }
      }catch(e){}
      state.marked.clear();
      state.seen.clear();
      state.page = 0;
      state.view = 'book';
      try{localStorage.setItem(KEY.view,'book');}catch(e){}
      render();
    });
  }

window.addEventListener('beforeunload', saveLastRead);
});
})();
