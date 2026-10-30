const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(ROOT+'/index.html'))});
 await new Promise(resolve=>server.listen(8135,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch(require('./browser-options.cjs'));
  const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.clock.setFixedTime(new Date('2026-12-31T14:59:59Z'));
  await p.goto('http://127.0.0.1:8135');
  await p.evaluate(()=>{state=fresh();state.tutorial.step=8;state.sheep[0]={breed:0,name:'몽실',stage:'adult',growth:100,hunger:90,clean:90,wool:100};render()});
  assert.equal(await p.locator('.first-sale-guide').count(),0);
  await p.getByRole('button',{name:'털 깎기',exact:true}).click();
  assert.equal(await p.locator('.first-sale-guide').count(),1);
  const coins=await p.evaluate(()=>state.coins);
  await p.reload();
  assert.equal(await p.locator('.first-sale-guide').count(),1);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.getByRole('button',{name:'첫 양털 팔러 가기',exact:true}).click();
  await p.locator('.wool-card').first().getByRole('button',{name:'1묶음 판매',exact:true}).click();
  assert.equal(await p.evaluate(()=>state.coins),coins+120);
  await p.getByRole('button',{name:'나의 목장',exact:true}).click();
  assert.equal(await p.locator('.first-sale-guide').count(),0);
  await p.evaluate(()=>{state.woolStock[0]=1;render()});
  assert.equal(await p.locator('.first-sale-guide').count(),0);
  console.log('PASS: first wool sale guidance persists until sale, pays normal price and fits mobile');

  await p.getByRole('button',{name:'이웃 마을',exact:true}).click();
  await p.locator('.help-task').first().click();
  assert(await p.locator('.help-task').first().isDisabled());
  await p.locator('.help-task').nth(1).focus();
  const before=await p.evaluate(()=>state.coins);
  // A year boundary at Korean midnight, while the village remains open.
  await p.clock.setFixedTime(new Date('2026-12-31T15:00:00Z'));
  await p.evaluate(()=>tickWorld());
  assert.equal(await p.locator('.help-task:disabled').count(),0);
  assert((await p.locator('.neighbor-heading').textContent()).includes('0 / 3'));
  assert.equal(await p.evaluate(()=>[...document.querySelectorAll('.help-task')].indexOf(document.activeElement)),1);
  assert.equal(await p.evaluate(()=>state.coins),before);
  await p.locator('.help-task').first().click();
  assert.equal(await p.evaluate(()=>state.coins),before+80);
  await p.evaluate(()=>{helpNeighbor(0,0);tickWorld()});
  assert.equal(await p.evaluate(()=>state.coins),before+80);
  // Rolling the device clock back does not reopen a rewarded task.
  await p.clock.setFixedTime(new Date('2026-12-31T14:59:59Z'));
  await p.evaluate(()=>tickWorld());
  assert(await p.locator('.help-task').first().isDisabled());
  console.log('PASS: Korean midnight refresh, focus preservation, no passive or duplicate reward, rollback protection');

  await p.clock.setFixedTime(new Date('2027-01-01T15:00:00Z'));
  await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  assert.equal(await p.locator('.help-task:disabled').count(),0);
  assert.equal(await p.evaluate(()=>state.coins),before+80);
  await p.reload();
  await p.getByRole('button',{name:'이웃 마을',exact:true}).click();
  assert.equal(await p.locator('.help-task:disabled').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: return-to-tab refresh, persisted daily records, no browser errors');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
