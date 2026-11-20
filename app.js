(() => {
'use strict';
const $=id=>document.getElementById(id), KEY='discrete-math-trainer-v1';
let mode='sample', current=0, filter='all', only=false, state={sample:{},final:{}}, mathQueue=Promise.resolve();
const empty=()=>({answers:{},position:0,filter:'all',only:false});
try { const saved=JSON.parse(localStorage.getItem(KEY)||'null'); if(saved&&typeof saved==='object')state=saved; } catch (_) { $('storage-warning').hidden=false; }
for(const m of ['sample','final']){
 const old=state[m];state[m]=old&&typeof old==='object'?{...empty(),...old}:empty();
 if(!state[m].answers||typeof state[m].answers!=='object')state[m].answers={};
}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rich=s=>escape(s).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').split(/\n\n/).map(p=>'<p>'+p.replace(/\n/g,'<br>')+'</p>').join('');
const list=()=>TASKS[mode];
const item=()=>list()[current];
function progress(m){return TASKS[m].filter(q=>state[m].answers[q.id]?.solved).length;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){$('storage-warning').hidden=false;}}
function math(target='practice'){
 mathQueue=mathQueue.catch(()=>{}).then(async()=>{
  if(!window.MathJax?.startup)return;
  await MathJax.startup.promise;
  await MathJax.typesetPromise([$(target)]);
 }).catch(()=>{ $('source').textContent+=' Формула не отрисовалась: доступна её текстовая запись.'; });
}
function clearMath(target='practice'){if(window.MathJax?.typesetClear)MathJax.typesetClear([$(target)]);}
function section(name){for(const id of ['home','practice','reviews'])$(id).hidden=id!==name;for(const id of ['tab-tests','tab-reviews'])$(id).removeAttribute('aria-current');$(name==='reviews'?'tab-reviews':'tab-tests').setAttribute('aria-current','page');}
function visible(){return list().map((q,i)=>({q,i})).filter(({q})=>(filter==='all'||q.type===Number(filter))&&(!only||!state[mode].answers[q.id]?.solved)).map(o=>o.i);}
function home(){
 section('home');
 for(const m of ['sample','final']){
  const n=progress(m);$(m+'-count').textContent=`Решено ${n} из ${TASKS[m].length}`;$(m+'-bar').style.width=n/TASKS[m].length*100+'%';
  $(m+'-cta').innerHTML=(n===TASKS[m].length?'Повторить и посмотреть решения':Object.keys(state[m].answers).length?'Продолжить':'Начать подготовку')+' <span>→</span>';
 }
 document.title='Задачник — Discrete Math';window.scrollTo(0,0);
}
function open(m){
 mode=m;filter=state[m].filter;only=Boolean(state[m].only);current=Number(state[m].position)||0;
 if(!['all',...TASKS.topics.map((_,i)=>String(i+1))].includes(String(filter)))filter='all';
 if(current<0||current>=list().length)current=0;
 $('topic-filter').innerHTML='<option value="all">Все темы</option>'+TASKS.topics.map((t,i)=>`<option value="${i+1}">${i+1}. ${escape(t)}</option>`).join('');
 const vis=visible();if(!vis.includes(current)&&vis.length)current=vis[0];if(!vis.length){only=false;filter='all';}
 section('practice');render();window.scrollTo(0,0);
}
function render(message='',messageType=''){
 clearMath();const q=item(),a=state[mode].answers[q.id]||{selected:null,solved:false,attempts:0,wrong:[]};
 state[mode].position=current;state[mode].filter=filter;state[mode].only=only;save();
 $('mode-label').textContent=mode==='sample'?'Sample Final Test':'Final Test · авторский вариант';
 $('question-counter').textContent=`ЗАДАЧА ${current+1} / ${list().length}`;$('topic-title').textContent=TASKS.topics[q.type-1];
 $('question-id').textContent=q.id;$('question-text').innerHTML=rich(q.question);
 $('topic-filter').value=filter;$('only-unsolved').checked=only;
 const vis=visible();const nav=vis.includes(current)?vis:[...vis,current].sort((a,b)=>a-b);
 $('question-select').innerHTML=nav.map(i=>`<option value="${i}">${state[mode].answers[list()[i].id]?.solved?'✓ ':''}${list()[i].id} · ${i+1} / ${list().length}</option>`).join('');$('question-select').value=current;
 const done=progress(mode);$('progress-count').textContent=`${done} / ${list().length}`;$('progress-bar').style.width=done/list().length*100+'%';
 $('answer-options').innerHTML=q.options.map((o,i)=>`<button type="button" role="radio" aria-checked="${a.selected===i}" aria-label="${String.fromCharCode(65+i)}: ${escape(o)}" class="option ${a.selected===i?'selected ':''}${a.solved&&i===q.answer?'correct ':''}${!a.solved&&(a.wrong||[]).includes(i)?'wrong':''}" data-answer="${i}" ${a.solved?'disabled':''}><span class="letter">${a.solved&&i===q.answer?'✓':String.fromCharCode(65+i)}</span><span class="option-text">${escape(o)}</span></button>`).join('');
 $('feedback').className='feedback '+(messageType||(a.solved?'success':''));$('feedback').textContent=message||(a.solved?'Верно. Решение открыто.':a.attempts?'Была ошибка. Выбери другой ответ и попробуй снова.':'Выбери один вариант ответа.');
 $('solution-state').textContent=a.solved?'РЕШЕНИЕ ОТКРЫТО':'ПОСЛЕ ВЕРНОГО ОТВЕТА';
 $('solution-content').innerHTML=a.solved?`<div class="solution-step">${rich(LESSONS.get(q).solution)}</div><div class="rule"><h3>КАКОЙ МЕТОД ИСПОЛЬЗОВАТЬ</h3>${rich(q.rule)}</div>${q.note?`<div class="note">${rich(q.note)}</div>`:''}`:'<div class="locked"><div class="lock-icon" aria-hidden="true">◇</div><h3>Сначала попробуй сам</h3><p>Выбери ответ слева и нажми «Проверить». После верного ответа здесь появится пошаговый разбор.</p></div>';
 $('check').disabled=a.solved;$('check').textContent=a.solved?'✓ Ответ проверен':'Проверить ответ';
 const pos=nav.indexOf(current);$('previous').disabled=pos<=0;$('next').disabled=pos>=nav.length-1;$('nav-position').textContent=`${pos+1} из ${nav.length}${filter!=='all'?' в теме':''}`;
 $('source').textContent=q.originalQuestion+' · '+q.source;
 $('completion').hidden=done!==list().length;
 const mistakes=Object.values(state[mode].answers).reduce((s,x)=>s+((x.wrong||[]).length),0);
 $('completion-detail').textContent=`Разобрано ${done} задач. Неверных попыток: ${mistakes}.`;
 document.title=`${q.id} — ${mode==='sample'?'Sample Final Test':'Final Test'} — Задачник`;math();
}
function choose(i){const q=item(),old=state[mode].answers[q.id]||{selected:null,solved:false,attempts:0,wrong:[]};if(old.solved||i>=q.options.length)return;old.selected=i;state[mode].answers[q.id]=old;render();}
function check(){
 const q=item(),a=state[mode].answers[q.id];if(a?.solved)return;
 if(!a||a.selected===null||a.selected===undefined){$('feedback').textContent='Сначала выбери вариант ответа.';$('feedback').className='feedback neutral';return;}
 a.attempts=(a.attempts||0)+1;if(a.selected===q.answer){a.solved=true;render('Верно! Справа — объяснение решения.','success');}
 else {a.wrong=a.wrong||[];a.wrong.push(a.selected);render('Пока неверно. Проверь условия и попробуй другой вариант.','error');}
}
function navigate(delta){const v=visible(),nav=v.includes(current)?v:[...v,current].sort((a,b)=>a-b);const n=nav[nav.indexOf(current)+delta];if(n!==undefined){current=n;render();$('question-text').scrollIntoView({block:'nearest'});}}
function changeFilter(){filter=$('topic-filter').value;only=$('only-unsolved').checked;const v=visible();if(!v.length){only=false;$('only-unsolved').checked=false;const all=visible();if(all.length)current=all[0];render('В выбранной теме всё решено. Показаны задачи для повторения.','success');return;}if(!v.includes(current))current=v[0];render();}
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.open)));
for(const id of ['brand','back-home','completion-home'])$(id).addEventListener('click',home);
$('answer-options').addEventListener('click',e=>{const b=e.target.closest('[data-answer]');if(b)choose(Number(b.dataset.answer));});
$('check').addEventListener('click',check);$('previous').addEventListener('click',()=>navigate(-1));$('next').addEventListener('click',()=>navigate(1));
$('topic-filter').addEventListener('change',changeFilter);$('only-unsolved').addEventListener('change',changeFilter);
$('question-select').addEventListener('change',()=>{current=Number($('question-select').value);render();});
$('help').addEventListener('click',()=>$('help-dialog').showModal());$('close-help').addEventListener('click',()=>$('help-dialog').close());
$('reset').addEventListener('click',()=>$('reset-dialog').showModal());$('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());
$('confirm-reset').addEventListener('click',()=>{state[mode]=empty();save();$('reset-dialog').close();open(mode);});
document.addEventListener('keydown',e=>{
 if($('practice').hidden||document.querySelector('dialog[open]')||/^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='Enter'){if(e.target.tagName==='BUTTON'&&e.target.id!=='check'&&!e.target.closest('#answer-options'))return;e.preventDefault();check();}
 else if(e.key==='ArrowLeft'){e.preventDefault();navigate(-1);}else if(e.key==='ArrowRight'){e.preventDefault();navigate(1);}
 else {const k=e.key.toUpperCase(),i=/^[A-E]$/.test(k)?k.charCodeAt(0)-65:/^[1-5]$/.test(k)?Number(k)-1:-1;if(i>=0){e.preventDefault();choose(i);}}
});
// The reading view has its own navigation and never writes test answers.
let reviewMode='sample',reviewId='T1.1',route='all';
$('review-topic').innerHTML='<option value="all">Все темы</option>'+TASKS.topics.map((t,i)=>`<option value="${i+1}">${i+1}. ${escape(t)}</option>`).join('');
function reviewItems(){
 const topic=$('review-topic').value,diff=$('review-difficulty').value,query=$('review-search').value.trim().toLowerCase();
 return TASKS[reviewMode].filter(q=>{
  const lesson=LESSONS.get(q),search=[q.id,q.question,TASKS.topics[q.type-1]].join(' ').toLowerCase();
  return (topic==='all'||q.type===Number(topic))&&(diff==='all'||lesson.difficulty===diff)&&(!query||search.includes(query))&&(route==='all'||(route==='base'?lesson.difficulty==='easy':lesson.difficulty!=='easy'));
 });
}
function renderReviews(){
 const rows=reviewItems();if(!rows.some(q=>q.id===reviewId))reviewId=rows[0]?.id||'';
 $('review-count').textContent=`Найдено: ${rows.length}`;
 $('review-list').innerHTML=rows.length?rows.map(q=>{const l=LESSONS.get(q);return `<button data-review-id="${q.id}" ${q.id===reviewId?'aria-current="true"':''}><span class="review-item-top"><b>${q.id}</b><span class="difficulty ${l.difficulty}">${l.label}</span></span><span>${escape(TASKS.topics[q.type-1])}</span></button>`;}).join(''):'<p class="empty-review">Ничего не найдено. Измени тему, маршрут или поисковый запрос.</p>';
 clearMath('review-detail');const q=rows.find(q=>q.id===reviewId);
 if(!q){$('review-detail').innerHTML='<div class="empty-detail"><h2>Подходящих задач нет</h2><p>Попробуй другой номер или сбрось фильтры кнопкой «Все задачи».</p></div>';return;}
 const l=LESSONS.get(q);
 $('review-detail').innerHTML=`<div class="review-article-head"><div><p class="eyebrow">${reviewMode==='sample'?'SAMPLE FINAL TEST':'FINAL TEST'} · ${q.id}</p><h2>${escape(TASKS.topics[q.type-1])}</h2></div><span class="difficulty ${l.difficulty}">${l.label}</span></div><section class="review-question"><h3>Условие</h3>${rich(q.question)}</section><section class="review-answer"><h3>Правильный ответ · ${String.fromCharCode(65+q.answer)}</h3>${rich(q.options[q.answer])}</section><section class="review-step"><h3>1. С чего начать</h3>${rich(l.start)}</section><section class="review-step"><h3>2. Решение</h3>${rich(l.solution)}</section><section class="review-pitfall"><h3>3. Что проверить</h3>${rich(l.pitfall)}</section>${q.note?`<div class="note">${rich(q.note)}</div>`:''}<details class="review-theory"><summary>Формула и правило по теме</summary>${rich(q.rule)}</details><p class="source">${escape(q.source)}</p><div class="review-bottom"><button class="secondary" id="review-prev" ${rows[0].id===q.id?'disabled':''}>Предыдущий разбор</button><button class="primary" id="review-practice">Решить в тесте</button><button class="secondary" id="review-next" ${rows.at(-1).id===q.id?'disabled':''}>Следующий разбор</button></div>`;
 $('review-practice').onclick=()=>{open(reviewMode);filter='all';only=false;current=list().findIndex(item=>item.id===q.id);render();window.scrollTo(0,0);};
 function move(delta){reviewId=rows[rows.findIndex(x=>x.id===q.id)+delta].id;renderReviews();$('review-detail').scrollIntoView({block:'start'});}
 $('review-prev').onclick=()=>move(-1);$('review-next').onclick=()=>move(1);
 math('review-detail');
}
function showReviews(){section('reviews');$('review-mode').value=reviewMode;renderReviews();document.title='Разборы задач — Задачник';window.scrollTo(0,0);}
$('tab-tests').addEventListener('click',home);$('tab-reviews').addEventListener('click',showReviews);
$('review-mode').addEventListener('change',()=>{reviewMode=$('review-mode').value;renderReviews();});
for(const id of ['review-topic','review-difficulty'])$(id).addEventListener('change',renderReviews);
$('review-search').addEventListener('input',renderReviews);
$('review-list').addEventListener('click',event=>{const b=event.target.closest('[data-review-id]');if(b){reviewId=b.dataset.reviewId;renderReviews();$('review-detail').scrollIntoView({block:'start'});}});
document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>{
 route=button.dataset.route;$('review-topic').value='all';$('review-difficulty').value='all';$('review-search').value='';
 document.querySelectorAll('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 $('route-description').textContent=route==='base'?'Первый проход: деление, НОД, простые выборы, прогрессии, гарантии и стандартные формулы. Метки сложности — оценка учебного материала.':route==='extend'?'Следующий проход: большие степени, целочисленные уравнения, сравнения, рекурсии и включения-исключения. Самые трудные пересечения оставь напоследок.':'';
 renderReviews();
}));
home();
})();
