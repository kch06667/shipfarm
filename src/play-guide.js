// Contextual goals are derived from the current farm, without adding save flags.
let cropChangeCandidate=null;
function farmGoals(){
 if(tutStep()<8)return [];
 const goals=[],add=(id,title,text,button,run)=>goals.push({id,title,text,button,run});
 const ready=state.plots.filter(p=>p&&p.ready<=Date.now()).length;
 if(ready)add('harvest','달콤한 수확이 기다려요',`${ready}칸의 작물을 수확해 먹이를 채워 주세요.`,'모두 수확하기',()=>harvestAll());
 const baby=state.sheep.findIndex(s=>s.stage==='baby'&&!s.sleepUntil);
 if(baby>=0)add('baby','작은 친구가 기다려요',`${state.sheep[baby].name}에게 인사하고 우유와 낮잠으로 키워 주세요.`,'아기양 돌보기',()=>focusSheep(baby));
 const hungry=state.sheep.findIndex(s=>s.stage==='adult'&&s.hunger<=25&&!s.pendingFeed);
 if(hungry>=0&&state.food>=5)add('feed','꼬르륵, 배가 고파요',`${state.sheep[hungry].name}에게 먹이 5개를 주세요.`,'배고픈 양 찾기',()=>focusSheep(hungry));
 if(state.food<5&&!ready){
  const empty=state.plots.findIndex(p=>!p);
  if(empty>=0)add('food','먹이부터 준비해 볼까요?','캬라멜팝콘은 1분 후 먹이 5개를 수확해요.','1분 작물 심기',()=>{state.seed=7;plot(empty)});
  else{
   const soonest=state.plots.reduce((a,p,i)=>p.ready<state.plots[a].ready?i:a,0);
   const p=state.plots[soonest];
   add('food','작물이 자라는 중이에요',`${crops[p.crop][0]} · ${timeLeft(p)} 후 수확. 너무 오래 걸리면 밭을 바꿀 수 있어요.`,'밭 살펴보기',()=>inspectCrop(soonest));
  }
 }
 const dirty=state.sheep.findIndex(s=>s.stage==='adult'&&s.clean<=25);
 if(dirty>=0)add('wash','보송보송하게 씻겨 주세요',`${state.sheep[dirty].name}이 깨끗해지면 털이 다시 자라요.`,'씻길 양 찾기',()=>focusSheep(dirty));
 const wool=state.sheep.findIndex(s=>s.stage==='adult'&&s.wool>=100&&!s.pendingFeed);
 if(wool>=0)add('shear','복슬복슬한 털이 다 자랐어요',`${state.sheep[wool].name}의 털을 깎아 장터에 가져가세요.`,'털 깎을 양 찾기',()=>focusSheep(wool));
 if(woolTotal())add('sell','양털을 코인으로 바꿔요',`창고의 양털 ${woolTotal()}묶음을 팔아 새 친구를 맞이해 보세요.`,'양털 장터로',()=>navigate('market'));
 if(!state.claimed.includes('flame')){
  const q=quests.find(q=>!state.claimed.includes(q.id));
  add('story','다음 친구는 플레임램',q?`${q.title} · ${Math.min(state.stats[q.id],q.goal)}/${q.goal}. 세 부탁을 마치면 새 이야기가 열려요.`:'세 부탁을 마쳤어요! 이야기에서 플레임램을 해금하세요.','첫 이야기 이어가기',()=>navigate('quests'));
 }else{
  const next=Object.entries(storyDefs).find(([id])=>!state.claimed.includes(id));
  if(next){const [id,def]=next,r=state.story[id],c=def.chapters[r?.step??0];add('story',def.title,r?.active?`${c.text} · ${storyProgress(id)}/${c.goal}`:`${breeds[def.breed].name}을 만나는 이야기를 시작해 보세요.`,'이야기 이어가기',()=>navigate('quests'))}
  else add('collection','다음 복슬복슬한 만남',`현재 레벨 ${currentLevel()} · 양 도감에서 새 친구의 조건을 확인하세요.`,'양 도감으로',()=>navigate('sheep'));
 }
 if(state.orders.entries.some(e=>orderProgress(e)>=orderTemplates[e.template].goal))add('order','완료한 부탁의 보상이 있어요','이웃에게 소식을 전하고 코인과 경험치를 받으세요.','부탁 확인하기',()=>navigate('quests'));
 if(goals.length<4)add('neighbor','기다리는 동안 이웃에게 놀러 가요','이웃 목장을 돕고 코인과 경험치를 모을 수 있어요.','이웃 마을로',()=>navigate('village'));
 // Keep one long-term goal visible even when several sheep need care.
 const story=goals.find(g=>g.id==='story'||g.id==='collection');
 const visible=goals.filter(g=>g!==story).slice(0,3);
 if(story)visible.push(story);
 return visible;
}
function updateFarmGoals(){
 if(tab!=='farm'||tutStep()<8)return;
 let panel=$('#farmGoals');
 if(!panel){$('.life-bar')?.insertAdjacentHTML('afterend','<section id="farmGoals" class="farm-goals" aria-label="지금 할 일"></section>');panel=$('#farmGoals')}
 if(!panel)return;
 const html='<div class="goals-heading"><h2>우리 목장, 다음 한 걸음</h2><span>지금 필요한 일을 골라 보세요.</span></div><div class="goals-grid">'+farmGoals().map(g=>`<article><h3>${esc(g.title)}</h3><p>${esc(g.text)}</p><button data-goal="${g.id}" onclick="runFarmGoal('${g.id}')">${g.button}</button></article>`).join('')+'</div>';
 if(panel.innerHTML===html)return;
 const focus=panel.contains(document.activeElement)?document.activeElement.dataset.goal:null;
 panel.innerHTML=html;
 if(focus)panel.querySelector(`[data-goal="${focus}"]`)?.focus({preventScroll:true});
}
function runFarmGoal(id){farmGoals().find(g=>g.id===id)?.run()}
function inspectCrop(i){
 const p=state.plots[i];if(!p||tutStep()<8)return;
 if(p.ready<=Date.now())return plot(i);
 cropChangeCandidate=null;
 modal(`<h2>${crops[p.crop][0]}가 자라고 있어요</h2><div class="crop-inspect-art">${plantSvg(false,p.crop,cropProgress(p))}</div><p>수확까지 ${timeLeft(p)} · 먹이 ${crops[p.crop][1]}개</p><p>다른 작물을 심고 싶다면 밭을 비울 수 있어요. 지금 자라는 작물은 수확하지 못합니다.</p><div class="settings-grid"><button class="action" onclick="confirmCropChange(${i},false)">밭 비우기</button><button class="greenbtn" onclick="confirmCropChange(${i},true)">1분 작물로 바꾸기</button></div>`);
}
function confirmCropChange(i,replant){
 const p=state.plots[i];if(!p||p.ready<=Date.now()||tutStep()<8)return;
 cropChangeCandidate={i,p,replant:!!replant};
 modal(`<h2>${replant?'캬라멜팝콘으로 바꿀까요?':'이 밭을 비울까요?'}</h2><p>현재 심은 <b>${crops[p.crop][0]}</b>와 지금까지의 성장 시간은 사라져요. 먹이·코인·경험치는 받지 않습니다.</p><p>${replant?'새 캬라멜팝콘은 1분 후 수확할 수 있어요.':'빈 밭에는 선택한 씨앗을 다시 심을 수 있어요.'}</p><div class="settings-grid"><button class="greenbtn" onclick="applyCropChange()">${replant?'확인하고 바꾸기':'확인하고 비우기'}</button><button class="action" onclick="cancelCropChange()">취소</button></div>`);
}
function cancelCropChange(){cropChangeCandidate=null;$('#modal').close()}
function applyCropChange(){
 const candidate=cropChangeCandidate;cropChangeCandidate=null;
 if(!candidate||tutStep()<8)return;
 const {i,p,replant}=candidate;
 if(state.plots[i]!==p)return;
 if(p.ready<=Date.now()){$('#modal').close();return toast('그사이 작물이 다 자랐어요. 밭을 눌러 수확해 주세요.')}
 const now=Date.now();state.plots[i]=replant?{crop:7,plantedAt:now,ready:now+60000}:null;
 $('#modal').close();render();toast(replant?'캬라멜팝콘을 심었어요. 1분 뒤 만나요!':'밭을 비웠어요. 새 씨앗을 심어 보세요.');
}
