const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(ROOT+'/index.html'))});
 await new Promise(r=>server.listen(8139,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch(require('./browser-options.cjs'));
  const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.clock.setFixedTime(new Date('2027-01-15T03:00:00Z'));
  await p.goto('http://127.0.0.1:8139');
  await p.evaluate(()=>{state=fresh();state.tutorial.step=8;state.food=12;state.sheep[0]={breed:0,name:'<솜솜>',stage:'adult',growth:100,hunger:20,clean:90,wool:0};render()});
  assert.equal(await p.evaluate(()=>mixedFoodCount()),12);
  assert.deepEqual(await p.evaluate(()=>state.foodStock),Array(8).fill(0));
  await p.evaluate(()=>{state.plots[0]={crop:7,ready:Date.now()-1};state.plots[1]={crop:0,ready:Date.now()-1};state.plots[2]={crop:3,ready:Date.now()-1};render()});
  await p.locator('#bulkHarvest').click();
  assert.equal(await p.evaluate(()=>state.food),52);
  assert.deepEqual(await p.evaluate(()=>state.foodStock),[10,0,0,25,0,0,0,5]);
  await p.reload();assert.equal(await p.evaluate(()=>mixedFoodCount()),12);
  await p.evaluate(()=>{state.orders.entries[0]=makeOrder(7);render()});
  await p.getByRole('button',{name:'먹이 고르기',exact:true}).click();
  assert((await p.locator('#modalBody').textContent()).includes('<솜솜>'));
  assert.equal(await p.locator('.pantry-grid article').count(),8);
  assert(await p.locator('.pantry-grid article').nth(1).getByRole('button',{name:'5개 먹이기',exact:true}).isDisabled());
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert(await p.locator('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth));
  await p.screenshot({path:ROOT+'/docs/preview-food-pantry-mobile.png',fullPage:true});
  await p.locator('.pantry-grid article').nth(7).getByRole('button',{name:'5개 먹이기',exact:true}).click();
  assert.deepEqual(await p.evaluate(()=>[state.food,state.stats.favorite,state.sheep[0].foodWish,state.sheep[0].wool]),[47,1,0,35]);
  const once=await p.evaluate(()=>[state.food,state.xp,state.stats.favorite]);
  await p.evaluate(()=>care('feed',0));assert.deepEqual(await p.evaluate(()=>[state.food,state.xp,state.stats.favorite]),once);
  await p.waitForFunction(()=>!state.sheep[0].pendingFeed);
  console.log('PASS: legacy mixed food retained; harvests keep crop identity; exact desired meal and duplicate-feed guard');

  async function feed(crop){await p.getByRole('button',{name:'먹이 고르기',exact:true}).click();await p.locator('.pantry-grid article').nth(crop).getByRole('button',{name:'5개 먹이기',exact:true}).click();await p.waitForFunction(()=>!state.sheep[0].pendingFeed)}
  await feed(3);assert.equal(await p.evaluate(()=>state.stats.favorite),1);assert.equal(await p.evaluate(()=>state.sheep[0].foodWish),0);
  await feed(0);await feed(3);
  assert.deepEqual(await p.evaluate(()=>[state.food,state.stats.favorite,state.sheep[0].foodWish,state.sheep[0].wool,state.sheep[0].hunger]),[32,3,1,100,100]);
  const full=await p.evaluate(()=>[state.food,state.xp]);await p.evaluate(()=>care('feed',0));assert.deepEqual(await p.evaluate(()=>[state.food,state.xp]),full);
  await p.getByRole('button',{name:'이야기',exact:true}).click();
  const token=await p.evaluate(()=>state.orders.entries[0].token),coins=await p.evaluate(()=>state.coins);
  await p.locator('.order-card').first().getByRole('button').click();await p.evaluate(token=>claimOrder(0,token),token);
  assert.equal(await p.evaluate(()=>state.coins),coins+200);
  console.log('PASS: ordinary meals do not satisfy wishes; three desired meals progress quest; full sheep spend nothing');

  await p.evaluate(()=>{state.orders.entries[1]=makeOrder(0);render()});
  await p.locator('.order-card').nth(1).getByRole('button').click();
  assert.equal(await p.evaluate(()=>state.food),22);assert.equal(await p.evaluate(()=>mixedFoodCount()),2);
  await p.evaluate(()=>{state.claimed.push('flame');state.story.angel={step:2,active:true,base:0};render();finishChapter('angel',2)});
  assert.equal(await p.evaluate(()=>state.food),2);assert.equal(await p.evaluate(()=>state.foodStock[3]),2);assert.equal(await p.evaluate(()=>mixedFoodCount()),0);
  assert(await p.evaluate(()=>!!validBackup({format:'shipfarm-backup',state})));
  for(const kind of ['sum','negative','wish'])assert(await p.evaluate(kind=>{const bad=JSON.parse(JSON.stringify(state));if(kind==='sum')bad.foodStock[0]=99;if(kind==='negative')bad.foodStock[0]=-1;if(kind==='wish')bad.sheep[0].foodWish=99;try{validBackup({format:'shipfarm-backup',state:bad});return false}catch{return true}},kind));
  assert.equal(await p.evaluate(()=>spendAnyFood(-1)),false);
  console.log('PASS: deliveries consume mixed then typed stock; story costs and malformed backups checked');

  await p.evaluate(()=>{state.food=5;state.foodStock=[2,0,0,3,0,0,0,0];state.sheep[0].hunger=30;state.sheep[0].foodWish=0;navigate('farm')});
  const favorites=await p.evaluate(()=>state.stats.favorite);
  await p.getByRole('button',{name:'먹이 주기',exact:true}).click();
  assert.equal(await p.evaluate(()=>state.food),0);assert.equal(await p.evaluate(()=>state.stats.favorite),favorites);
  assert.equal(await p.evaluate(()=>state.foodStock.reduce((a,b)=>a+b,0)),0);
  await p.waitForFunction(()=>!state.sheep[0].pendingFeed);
  await p.evaluate(()=>{state.food=10;state.sheep.push({breed:0,name:'둘째',stage:'adult',growth:100,hunger:40,clean:90,wool:0});render()});
  const uid=await p.evaluate(()=>state.sheep[0].uid);
  await p.getByRole('button',{name:'먹이 고르기',exact:true}).click();
  await p.evaluate(uid=>restInBarn(uid),uid);
  const before=await p.evaluate(()=>[state.food,state.sheep[0].hunger]);
  await p.evaluate(uid=>feedFromPantry(uid,-1),uid);
  assert.deepEqual(await p.evaluate(()=>[state.food,state.sheep[0].hunger]),before);
  await p.getByRole('button',{name:'닫기',exact:true}).click();await p.reload();
  assert.equal(await p.evaluate(()=>state.barn.sheep[0].foodWish),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: fragmented stock feeds normally; stale pantry cannot feed a different sheep; wishes persist in barn');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
