const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(ROOT+'/index.html'))});
 await new Promise(r=>server.listen(8137,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch(require('./browser-options.cjs'));
  const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.clock.setFixedTime(new Date('2027-01-10T03:00:00Z'));
  await p.goto('http://127.0.0.1:8137');
  const phases=await p.evaluate(()=>[3600,14400,43200,28800,64800,129600,128600,5400].map((seconds,crop)=>{
   const plant={crop,ready:Date.now()};return [cropPhase(plant,plant.ready-1),cropPhase(plant,plant.ready),cropPhase(plant,plant.ready+seconds*1000-1),cropPhase(plant,plant.ready+seconds*1000)];
  }));
  phases.forEach(row=>assert.deepEqual(row,['growing','ready','ready','spoiled']));
  console.log('PASS: all eight crop windows start after ripening and expire at the exact boundary');
  await p.evaluate(()=>{
   state=fresh();state.tutorial.step=8;state.sheep[0]={breed:0,name:'몽실',stage:'adult',growth:100,hunger:90,clean:90,wool:0};
   const now=Date.now();state.plots=[{crop:0,ready:now-3600000},{crop:7,ready:now-5400000},{crop:2,ready:now-43200000},{crop:1,ready:now-1000},{crop:7,ready:now-1000},{crop:4,ready:now+21600000}];render();
   state.orders.entries[0]=makeOrder(6);render();
  });
  assert.equal(await p.locator('.cropplot.spoiled').count(),3);
  await p.evaluate(()=>plot(0,true));
  assert.equal(await p.evaluate(()=>state.plots[0].spoiled),true);
  assert.equal(await p.evaluate(()=>state.stats.clear),0);
  assert.equal(await p.locator('.cropplot.ready').count(),2);
  assert.equal(await p.locator('#bulkHarvest').textContent(),'모두 수확 (2)');
  await p.locator('#bulkHarvest').click();
  assert.equal(await p.evaluate(()=>state.food),35);
  assert.equal(await p.evaluate(()=>state.stats.harvest),2);
  assert.equal(await p.evaluate(()=>state.xp),10);
  assert.equal(await p.locator('.cropplot.spoiled').count(),3);
  assert(await p.locator('#bulkHarvest').isDisabled());
  await p.screenshot({path:ROOT+'/docs/preview-crop-decay-mobile.png',fullPage:true});
  const before=await p.evaluate(()=>[state.coins,state.food,state.xp]);
  await p.locator('#clearSpoiled').click();
  assert.equal(await p.evaluate(()=>state.stats.clear),3);
  assert.equal(await p.evaluate(()=>state.plots.filter(Boolean).length),1);
  assert.equal(await p.evaluate(()=>state.plots[5].crop),4);
  assert.deepEqual(await p.evaluate(()=>[state.coins,state.food,state.xp]),before);
  await p.evaluate(()=>clearAllSpoiled());assert.equal(await p.evaluate(()=>state.stats.clear),3);
  await p.getByRole('button',{name:'이야기',exact:true}).click();
  const token=await p.evaluate(()=>state.orders.entries[0].token);
  await p.locator('.order-card').first().getByRole('button').click();
  await p.evaluate(token=>claimOrder(0,token),token);
  assert.equal(await p.evaluate(()=>state.coins),before[0]+180);
  assert.equal(await p.evaluate(()=>state.xp),before[2]+24);
  console.log('PASS: mixed bulk harvest excludes rotten crops; cleanup only counts once and completes grandpa order');

  // Offline crop decay has no two-hour livestock cap and remains spoiled after clock rollback.
  await p.evaluate(()=>{state.plots.fill(null);state.plots[0]={crop:5,ready:Date.now()+64800000};save()});
  await p.clock.setFixedTime(new Date('2027-01-13T03:00:00Z'));await p.reload();
  assert.equal(await p.evaluate(()=>cropPhase(state.plots[0])),'spoiled');
  assert.equal(await p.evaluate(()=>state.plots[0].spoiled),true);
  assert(await p.evaluate(()=>!!validBackup({format:'shipfarm-backup',state})));
  assert(await p.evaluate(()=>{const bad=JSON.parse(JSON.stringify(state));bad.plots[0].spoiled='yes';try{validBackup({format:'shipfarm-backup',state:bad});return false}catch{return true}}));
  await p.clock.setFixedTime(new Date('2027-01-10T04:00:00Z'));await p.reload();
  assert.equal(await p.evaluate(()=>cropPhase(state.plots[0])),'spoiled');
  await p.evaluate(()=>finishCrops());assert.equal(await p.evaluate(()=>cropPhase(state.plots[0])),'spoiled');
  const food=await p.evaluate(()=>state.food);await p.locator('[data-plot="0"]').click();
  assert.equal(await p.evaluate(()=>state.plots[0]),null);assert.equal(await p.evaluate(()=>state.food),food);
  console.log('PASS: multi-day offline decay, save/backup state, clock rollback and debug tool cannot revive spoiled crop');

  await p.evaluate(()=>{state=fresh();state.tutorial.step=5;state.tutorial.plot=0;state.sheep[0]={breed:0,name:'몽실',stage:'adult',growth:100,hunger:90,clean:90,wool:50};state.plots[0]={crop:7,tutorial:true,ready:Date.now()-5400000};motion.clear();render()});
  assert((await p.locator('.tutorial-band').textContent()).includes('첫 작물이 썩었어요'));
  await p.locator('[data-plot="0"]').click();assert.equal(await p.evaluate(()=>tutStep()),4);
  await p.locator('[data-plot="0"]').click();assert.equal(await p.evaluate(()=>tutStep()),5);
  assert.equal(await p.evaluate(()=>state.plots[0].ready-state.plots[0].plantedAt),12000);
  assert.equal(await p.evaluate(()=>state.food),0);
  console.log('PASS: neglected tutorial crop spoils too; clearing restarts planting without rewards or skipped steps');

  await p.evaluate(()=>{state.tutorial.step=8;state.plots[0]={crop:0,ready:Date.now()+1000};render()});
  await p.clock.setFixedTime(new Date('2027-01-10T05:00:02Z'));
  await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  assert.equal(await p.locator('.cropplot.spoiled').count(),1);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.getByRole('button',{name:'씨앗 상점',exact:true}).click();assert((await p.locator('.crop-shop-help').textContent()).includes('접속하지 않아도'));
  assert.deepEqual(errors,[]);
  console.log('PASS: visible state refresh on returning, readable seed-shop deadlines, no browser errors');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
