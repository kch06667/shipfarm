// Spring Sheep, seesaw and TV are documented in the 2011 web review.
// Artwork, prices, durations and one-visitor reservations are prototype designs.
function isFarmToy(id){return id===4||id===5||id===6}
function toyAvailable(slot,i){return isFarmToy(state.decor[slot])&&![...motion.entries()].some(([j,m])=>j!==i&&m.toySlot===slot&&(m.pending==='play'||m.mode==='playing'))}
function cancelToyVisit(m){m.pending=null;m.route=null;m.mode='idle';m.until=performance.now()+2000;delete m.toySlot;delete m.toyKind}
function cancelSlotVisitors(slot){motion.forEach((m,i)=>{if(m.toySlot===slot&&(m.pending==='play'||m.mode==='playing')){cancelToyVisit(m);syncActor(i,m)}})}
function syncToySlots(){document.querySelectorAll('[data-toy-slot]').forEach(el=>{const slot=+el.dataset.toySlot;el.classList.toggle('in-use',[...motion.values()].some(m=>m.toySlot===slot&&m.mode==='playing'))})}
function springSheepSvg(){return `<svg viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="40" cy="70" rx="26" ry="7" fill="#66834230"/><path d="M24 68H57" stroke="#a58b69" stroke-width="7" stroke-linecap="round"/><path d="M36 62l12-4-15-5 15-5-13-5" fill="none" stroke="#ac9d8a" stroke-width="4" stroke-linejoin="round"/><g class="spring-seat"><path d="M20 35Q16 20 28 22Q34 13 42 22Q56 18 57 31Q68 41 53 47H27Q14 44 20 35Z" fill="#f8e8bf" stroke="#aa8e69" stroke-width="2"/><path d="M50 26Q67 21 68 35Q76 40 68 45Q53 49 50 37Z" fill="#e5c9a0" stroke="#aa8e69" stroke-width="2"/><circle cx="64" cy="34" r="2" fill="#685845"/><path d="M28 40H50" stroke="#dc9b9f" stroke-width="6" stroke-linecap="round"/><path d="M56 22V36" stroke="#849d78" stroke-width="4"/></g></svg>`}
function startToyVisit(i,slot){
 const s=state.sheep[i];if(tutStep()<8||!s||s.sleepUntil||!toyAvailable(slot,i))return false;
 const m=getMotion(i);if(m.pending)return false;
 const [x,y]=decorSpots[slot],targetX=clamp(x+8,30,64);
 m.route={x:targetX,y:clamp(y+2,targetX<40?54:44,78)};
 m.toySlot=slot;m.toyKind=state.decor[slot];m.pending='play';m.mode='walking';m.until=0;
 if(reducedMotion.matches){m.x=m.route.x;m.y=m.route.y;arrive(i,m)}
 syncActor(i,m);return true;
}
function visitToy(slot){
 if(startToyVisit(state.selected,slot))toast(state.sheep[state.selected].name+'이 '+decorTypes[state.decor[slot]].name+'에 놀러 가요.');
 else toast('다른 양이 놀고 있거나 돌봄 중이에요. 잠깐 뒤 다시 놀러 가요.');
}
function tryToyWalk(i){
 if(decorating||Math.random()>=.18)return false;
 const slots=state.decor.map((id,j)=>isFarmToy(id)&&toyAvailable(j,i)?j:-1).filter(j=>j>=0);
 return slots.length?startToyVisit(i,slots[Math.floor(Math.random()*slots.length)]):false;
}
function seesawSvg(){return `<svg viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="40" cy="68" rx="34" ry="8" fill="#66834230"/><path d="M28 65L40 42L53 65Z" fill="#f1c56f" stroke="#a17a50" stroke-width="2"/><circle cx="40" cy="46" r="4" fill="#a17a50"/><g class="seesaw-beam"><path d="M7 44H73" stroke="#a77850" stroke-width="9" stroke-linecap="round"/><path d="M7 41H73" stroke="#e8bd83" stroke-width="5" stroke-linecap="round"/><path d="M15 35V43M65 35V43" stroke="#8c9f65" stroke-width="4"/><path d="M9 31H21M59 31H71" stroke="#8c9f65" stroke-width="5" stroke-linecap="round"/><path d="M3 39H12M68 39H77" stroke="#de969c" stroke-width="7" stroke-linecap="round"/></g></svg>`}
function farmTvSvg(){return `<svg viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="40" cy="71" rx="29" ry="7" fill="#66834230"/><path d="M24 63L21 73M58 63L61 73" stroke="#9b7755" stroke-width="5"/><path d="M37 18L25 6M40 18L52 4" stroke="#a08c73" stroke-width="3" stroke-linecap="round"/><rect x="8" y="18" width="66" height="47" rx="9" fill="#c99170" stroke="#87694f" stroke-width="2"/><rect x="14" y="24" width="43" height="33" rx="8" fill="#405956" stroke="#f2dbad" stroke-width="3"/><g class="tv-picture"><path d="M17 47Q29 34 40 44L54 40V53H17Z" fill="#91b77d"/><circle cx="24" cy="33" r="5" fill="#f7dc92"/><path d="M32 42Q28 35 35 34Q40 30 44 36Q51 35 49 42Z" fill="#fff1d2"/><path d="M35 41V46M45 41V46" stroke="#806e59" stroke-width="2"/></g><circle cx="65" cy="31" r="4" fill="#f6dda7"/><circle cx="65" cy="43" r="3" fill="#f6dda7"/><path d="M61 53H68M61 57H68" stroke="#87694f" stroke-width="2"/></svg>`}
