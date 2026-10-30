// The web game had requests for particular crops. Amounts and bonuses here are prototype rules.
const foodWishOrder=[7,0,3,1,4,2,5,6];
function ensureFoodStock(){
 state.foodStock??=Array(8).fill(0);
 // The aggregate remains compatible with old saves and existing debug fixtures.
 let remaining=state.food;
 for(let i=0;i<8;i++){state.foodStock[i]=Math.min(state.foodStock[i]??0,remaining);remaining-=state.foodStock[i]}
 state.stats.favorite??=0;
}
function mixedFoodCount(){return Math.max(0,state.food-state.foodStock.reduce((a,b)=>a+b,0))}
function foodWish(s){return s.foodWish??7}
function receiveCropFood(crop,amount){ensureFoodStock();state.food+=amount;state.foodStock[crop]+=amount}
function spendAnyFood(amount){
 ensureFoodStock();if(!Number.isSafeInteger(amount)||amount<0||state.food<amount)return false;
 let remaining=Math.max(0,amount-mixedFoodCount());
 for(let i=0;i<8&&remaining;i++){const take=Math.min(remaining,state.foodStock[i]);state.foodStock[i]-=take;remaining-=take}
 state.food-=amount;return true;
}
function autoFeedCrop(s){
 ensureFoodStock();const wish=foodWish(s);
 if(state.foodStock[wish]>=5)return wish;
 if(mixedFoodCount()>=5)return -1;
 const i=state.foodStock.findIndex(n=>n>=5);return i>=0?i:-2;
}
function takeSheepFood(s,choice){
 ensureFoodStock();if(state.food<5)return null;
 const crop=choice===undefined?autoFeedCrop(s):choice;
 if(!Number.isInteger(crop)||crop<-2||crop>=8)return null;
 if(crop===-2){if(!spendAnyFood(5))return null}
 else if(crop===-1){if(mixedFoodCount()<5)return null;state.food-=5}
 else{if(state.foodStock[crop]<5)return null;state.foodStock[crop]-=5;state.food-=5}
 return {crop,favorite:crop>=0&&crop===foodWish(s)};
}
function nextFoodWish(s){s.foodWish=foodWishOrder[(foodWishOrder.indexOf(foodWish(s))+1)%foodWishOrder.length]}
function validateFoodStock(v){
 if(v.foodStock!=null&&(!Array.isArray(v.foodStock)||v.foodStock.length!==8||!v.foodStock.every(n=>Number.isSafeInteger(n)&&n>=0)||v.foodStock.reduce((a,b)=>a+b,0)>v.food))throw Error('먹이 창고 기록이 올바르지 않아요.');
 if(v.stats?.favorite!=null&&(!Number.isSafeInteger(v.stats.favorite)||v.stats.favorite<0))throw Error('원하는 먹이 기록이 올바르지 않아요.');
 for(const s of [...v.sheep,...(v.barn?.sheep??[])])if(s.foodWish!=null&&(!Number.isInteger(s.foodWish)||s.foodWish<0||s.foodWish>=8))throw Error('양의 먹이 요청이 올바르지 않아요.');
}
function foodWishHint(s){
 if(tutStep()<8||s.stage!=='adult')return '';
 return `<div class="food-wish"><span>오늘은 <b>${crops[foodWish(s)][0]}</b>이 먹고 싶어요.</span><button onclick="openFoodPantry()">먹이 고르기</button></div>`;
}
function openFoodPantry(){
 ensureFoodStock();const s=state.sheep[state.selected],adult=s.stage==='adult'&&tutStep()>=8;
 modal(`<h2>달콤한 먹이 창고</h2><p>${adult?`${esc(s.name)}의 부탁은 <b>${crops[foodWish(s)][0]}</b> 5개예요.`:'아기양에게는 우유를 주세요. 수확한 작물은 자란 뒤 먹일 수 있어요.'}</p><p>일반 먹이: 포만감 +25 · 털 +25<br>원하는 먹이: 털 +10 추가 · 경험치 +3</p><div class="pantry-summary"><b>전체 ${state.food}개</b><button class="action" onclick="feedFromPantry(${s.uid},undefined)" ${adult&&state.food>=5?'':'disabled'}>자동으로 5개 고르기</button></div><div class="pantry-grid">${crops.map((c,i)=>`<article class="${adult&&foodWish(s)===i?'requested':''}"><div class="pantry-art">${plantSvg(true,i)}</div><strong>${c[0]}</strong><span>${state.foodStock[i]}개${adult&&foodWish(s)===i?' · 먹고 싶어요!':''}</span><button class="greenbtn" onclick="feedFromPantry(${s.uid},${i})" ${adult&&state.foodStock[i]>=5?'':'disabled'}>5개 먹이기</button><button class="pantry-seed" onclick="choosePantrySeed(${i})">씨앗 고르기</button></article>`).join('')}</div>${mixedFoodCount()?`<div class="mixed-food"><div><b>혼합 먹이 ${mixedFoodCount()}개</b><p>이전 목장에서 가져온 종류 미상의 먹이예요. 일반 먹이와 같은 효과가 있어요.</p></div><button class="greenbtn" onclick="feedFromPantry(${s.uid},-1)" ${adult&&mixedFoodCount()>=5?'':'disabled'}>혼합 먹이 5개</button></div>`:''}<p class="story-note">현재 수량·포만감·보너스는 시안용 설정입니다. 빠른 먹이 주기는 원하는 작물을 먼저 사용해요. 부탁에 먹이를 보내면 혼합 먹이부터, 이후에는 창고 순서대로 차감해요.</p>`);
}
function choosePantrySeed(i){if(!crops[i])return;$('#modal').close();state.seed=i;navigate('crops')}
function feedFromPantry(uid,crop){
 const i=state.sheep.findIndex(s=>s.uid===uid);
 if(i<0||state.sheep[i].stage!=='adult'||tutStep()<8)return toast('이 친구가 풀밭으로 돌아오거나 자란 뒤 먹일 수 있어요.');
 state.selected=i;const before=state.food;care('feed',crop);
 if(state.food===before-5)$('#modal').close();
}
