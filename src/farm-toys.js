// Spring Sheep is documented in the 2011 web-game review; art and price are new.
function springSheepSvg(){return `<svg viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="40" cy="70" rx="26" ry="7" fill="#66834230"/><path d="M24 68H57" stroke="#a58b69" stroke-width="7" stroke-linecap="round"/><path d="M36 62l12-4-15-5 15-5-13-5" fill="none" stroke="#ac9d8a" stroke-width="4" stroke-linejoin="round"/><g class="spring-seat"><path d="M20 35Q16 20 28 22Q34 13 42 22Q56 18 57 31Q68 41 53 47H27Q14 44 20 35Z" fill="#f8e8bf" stroke="#aa8e69" stroke-width="2"/><path d="M50 26Q67 21 68 35Q76 40 68 45Q53 49 50 37Z" fill="#e5c9a0" stroke="#aa8e69" stroke-width="2"/><circle cx="64" cy="34" r="2" fill="#685845"/><path d="M28 40H50" stroke="#dc9b9f" stroke-width="6" stroke-linecap="round"/><path d="M56 22V36" stroke="#849d78" stroke-width="4"/></g></svg>`}
function startToyVisit(i,slot){
 const s=state.sheep[i];if(tutStep()<8||!s||s.sleepUntil||state.decor[slot]!==4)return false;
 const m=getMotion(i);if(m.pending)return false;
 const [x,y]=decorSpots[slot],targetX=clamp(x+8,30,64);
 m.route={x:targetX,y:clamp(y+2,targetX<40?54:44,78)};
 m.toySlot=slot;m.pending='play';m.mode='walking';m.until=0;
 if(reducedMotion.matches){m.x=m.route.x;m.y=m.route.y;arrive(i,m)}
 syncActor(i,m);return true;
}
function visitToy(slot){
 if(startToyVisit(state.selected,slot))toast(state.sheep[state.selected].name+'이 스프링 쉽에 놀러 가요.');
 else toast('지금 돌봄을 마치거나 낮잠에서 깨면 놀 수 있어요.');
}
function tryToyWalk(i){
 if(decorating||Math.random()>=.18)return false;
 const slots=state.decor.map((id,j)=>id===4?j:-1).filter(j=>j>=0);
 return slots.length?startToyVisit(i,slots[Math.floor(Math.random()*slots.length)]):false;
}
