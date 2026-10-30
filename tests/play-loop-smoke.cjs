const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(ROOT+'/index.html'))});
 await new Promise(r=>server.listen(8136,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch(require('./browser-options.cjs'));
  const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.clock.setFixedTime(new Date('2026-11-02T03:00:00Z'));
  await p.goto('http://127.0.0.1:8136');
  assert.equal(await p.locator('#farmGoals').count(),0);
  // Reproduce an established farm with no food and all plots occupied for 35 hours.
  await p.evaluate(()=>{state=fresh();state.tutorial.step=8;state.coins=0;state.sheep[0]={breed:0,name:'<솜솜>',stage:'adult',growth:100,hunger:10,clean:90,wool:0};state.plots=Array.from({length:6},()=>({crop:6,plantedAt:Date.now(),ready:Date.now()+128600000}));render()});
  assert.equal(await p.locator('[data-goal="food"]').count(),1);
  await p.locator('[data-goal="food"]').click();
  await p.getByRole('button',{name:'1분 작물로 바꾸기',exact:true}).click();
  await p.getByRole('button',{name:'취소',exact:true}).click();
  assert.equal(await p.evaluate(()=>state.plots[0].crop),6);
  await p.locator('[data-plot="0"]').click();
  await p.getByRole('button',{name:'1분 작물로 바꾸기',exact:true}).click();
  await p.getByRole('button',{name:'확인하고 바꾸기',exact:true}).click();
  assert.deepEqual(await p.evaluate(()=>({food:state.food,coins:state.coins,xp:state.xp,harvest:state.stats.harvest})),{food:0,coins:0,xp:0,harvest:0});
  assert.equal(await p.evaluate(()=>state.plots[0].ready-state.plots[0].plantedAt),60000);
  assert.equal(await p.evaluate(()=>state.plots.filter(p=>p.crop===6).length),5);
  const stamp=await p.evaluate(()=>state.plots[0].ready);
  await p.evaluate(()=>applyCropChange());assert.equal(await p.evaluate(()=>state.plots[0].ready),stamp);
  await p.reload();assert.equal(await p.evaluate(()=>state.plots[0].crop),7);
  console.log('PASS: zero-coin/zero-food farm can replace one long crop with confirmation; no reward or neighbor-plot changes');

  await p.clock.setFixedTime(new Date('2026-11-02T03:01:01Z'));
  await p.evaluate(()=>tickWorld());
  await p.locator('[data-goal="harvest"]').click();
  assert.equal(await p.evaluate(()=>state.food),5);
  assert.equal(await p.evaluate(()=>state.stats.harvest),1);
  await p.locator('[data-goal="feed"]').click();
  assert((await p.locator('#farmGoals').textContent()).includes('<솜솜>'));
  await p.getByRole('button',{name:'먹이 주기',exact:true}).click();
  assert.equal(await p.evaluate(()=>state.food),0);
  assert(await p.evaluate(()=>state.sheep[0].hunger>15));
  await p.waitForTimeout(2600);
  await p.locator('[data-goal="food"]').click();
  assert.equal(await p.evaluate(()=>state.plots[0].crop),7);
  console.log('PASS: natural one-minute harvest, food spending and planting repeat through suggested actions');

  // A ready crop must never be destroyed by a confirmation left open earlier.
  await p.locator('[data-plot="0"]').click();
  await p.getByRole('button',{name:'밭 비우기',exact:true}).click();
  await p.clock.setFixedTime(new Date('2026-11-02T03:02:02Z'));
  await p.getByRole('button',{name:'확인하고 비우기',exact:true}).click();
  assert.equal(await p.evaluate(()=>state.plots[0].crop),7);
  await p.locator('[data-plot="0"]').click();
  assert.equal(await p.evaluate(()=>state.stats.harvest),2);
  await p.locator('[data-plot="1"]').click();
  await p.getByRole('button',{name:'밭 비우기',exact:true}).click();
  await p.getByRole('button',{name:'확인하고 비우기',exact:true}).click();
  assert.equal(await p.evaluate(()=>state.plots[1]),null);
  assert.equal(await p.evaluate(()=>state.stats.harvest),2);
  assert.equal(await p.evaluate(()=>state.food),5);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:ROOT+'/docs/preview-play-guide-mobile.png',fullPage:true});
  await p.locator('[data-goal="story"]').click();
  assert(await p.getByRole('heading',{name:'성냥팔이 소녀',exact:true}).isVisible());
  assert.deepEqual(errors,[]);
  console.log('PASS: ready-crop protection, clear without rewards, mobile goals and next-story navigation');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
