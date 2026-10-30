// Historical crop durations, interpreted as the harvest window AFTER growth.
// See docs/original-game-research.md for evidence and remaining uncertainty.
const cropFreshSeconds=[3600,14400,43200,28800,64800,129600,128600,5400];
function cropExpiresAt(p){return p.ready+cropFreshSeconds[p.crop]*1000}
function cropPhase(p,now=Date.now()){
 if(!p)return 'empty';
 if(p.spoiled||now>=cropExpiresAt(p))return 'spoiled';
 return now>=p.ready?'ready':'growing';
}
function decayCrops(now=Date.now()){
 for(const p of state.plots){if(p&&cropPhase(p,now)==='spoiled')p.spoiled=true}
}
function cropIsReady(p){return cropPhase(p)==='ready'}
function cropCountdown(ms){
 const s=Math.max(0,Math.ceil(ms/1000));
 if(s>=3600)return `${Math.floor(s/3600)}시간 ${Math.floor(s%3600/60)}분`;
 return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}
function timeLeft(p){
 const phase=cropPhase(p);
 if(phase==='spoiled')return '썩음 · 쭉정이 치우기';
 if(phase==='ready')return '수확 · '+cropCountdown(cropExpiresAt(p)-Date.now())+' 남음';
 return cropCountdown(p.ready-Date.now());
}
function spoiledPlantSvg(){return `<svg viewBox="0 0 70 70" aria-hidden="true"><path d="M4 46L35 31L67 46L35 63Z" fill="#9d8467" stroke="#78624f" stroke-width="2"/><path d="M35 49Q38 31 28 28Q18 26 22 36M36 44Q45 31 51 39M34 40L25 42" fill="none" stroke="#7d704d" stroke-width="3" stroke-linecap="round"/><path d="M22 36Q14 34 18 43Q23 44 22 36ZM49 37Q56 35 54 46Q48 46 49 37ZM25 41Q17 40 20 46Q26 48 25 41Z" fill="#a49666"/><ellipse cx="43" cy="48" rx="8" ry="4" fill="#847053"/><path d="M17 50l7 4m24-2l5-3" stroke="#c1aa80" stroke-width="2"/></svg>`}
function clearSpoiledPlot(i){
 decayCrops();const p=state.plots[i];if(cropPhase(p)!=='spoiled')return;
 state.plots[i]=null;state.stats.clear=(state.stats.clear??0)+1;
 if(tutStep()===5&&i===(state.tutorial.plot??0))state.tutorial.step=4;
 render();toast('썩은 작물의 쭉정이를 치웠어요. 먹이는 얻지 못했지만, 다시 심을 수 있어요.');
}
function clearAllSpoiled(){
 if(tutStep()<8)return;
 decayCrops();const indexes=state.plots.map((p,i)=>cropPhase(p)==='spoiled'?i:-1).filter(i=>i>=0);
 if(!indexes.length)return;
 for(const i of indexes)state.plots[i]=null;
 state.stats.clear=(state.stats.clear??0)+indexes.length;render();toast(`쭉정이 ${indexes.length}칸을 치웠어요. 새 씨앗을 심어 주세요.`);
}
function updatePlots(){
 if(tab!=='farm')return;
 document.querySelectorAll('[data-plot]').forEach(el=>{
  const i=+el.dataset.plot,p=state.plots[i];if(!p){el.classList.remove('ready','spoiled','expiring');return}
  const phase=cropPhase(p),ready=phase==='ready',spoiled=phase==='spoiled',progress=cropProgress(p);
  const stage=spoiled?4:ready?3:progress>.5?2:progress>.2?1:0;
  el.classList.toggle('ready',ready);el.classList.toggle('spoiled',spoiled);
  el.classList.toggle('expiring',ready&&cropExpiresAt(p)-Date.now()<=600000);
  el.querySelector('.timer').textContent=timeLeft(p);
  el.setAttribute('aria-label',`밭 ${i+1}: ${crops[p.crop][0]} ${timeLeft(p)}`);
  if(el.dataset.artStage!==String(stage)){el.querySelector('svg').outerHTML=spoiled?spoiledPlantSvg():plantSvg(ready,p.crop,progress);el.dataset.artStage=stage}
  let bar=el.querySelector('.crop-progress');
  if(!bar){el.insertAdjacentHTML('beforeend','<span class="crop-progress"><i></i></span><span class="plot-name">'+crops[p.crop][0]+'</span>');bar=el.querySelector('.crop-progress')}
  bar.querySelector('i').style.width=(progress*100)+'%';bar.hidden=phase!=='growing';
 });
 const count=state.plots.filter(p=>cropPhase(p)==='spoiled').length,b=$('#clearSpoiled');
 if(b){b.hidden=!count;b.textContent=`쭉정이 모두 치우기 (${count})`}
 if(count&&!state.plots.some(cropIsReady)){const summary=$('#lifeSummary');if(summary)summary.textContent=`썩은 작물 ${count}칸의 쭉정이를 치워 주세요.`}
 if(tutStep()===5&&cropPhase(state.plots[state.tutorial.plot??0])==='spoiled'){
  const band=$('.tutorial-band');if(band&&!band.textContent.includes('첫 작물이 썩었어요'))band.outerHTML=guideBand();
 }
}
