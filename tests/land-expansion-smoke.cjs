const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(ROOT+'/index.html'))});
 await new Promise(resolve=>server.listen(8148,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch(require('./browser-options.cjs'));
  const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:8148');
  await p.evaluate(()=>{state=fresh();state.tutorial.step=8;state.levelBase=25;state.coins=20000;state.sheep[0]={breed:0,name:'몽실',stage:'adult',growth:100,hunger:90,clean:90,wool:100};state.plots[0]={crop:7,plantedAt:Date.now(),ready:Date.now()+60000};state.decor[0]=4;render()});
  const oldWidth=await p.locator('.world').evaluate(el=>el.clientWidth);
  await p.getByRole('button',{name:'땅 넓히기',exact:true}).click();
  await p.getByRole('button',{name:'확장하기',exact:true}).click();
  assert.equal(await p.locator('.cropplot').count(),12);
  assert(await p.locator('.world').evaluate(el=>el.clientWidth)>oldWidth*1.4);
  assert.deepEqual(await p.evaluate(()=>[state.landLevel,state.coins,state.plots[0].crop,state.decor[0],landSpec().sheep]),[1,16500,7,4,12]);
  await p.evaluate(()=>expandLand(1));assert.equal(await p.evaluate(()=>state.coins),16500);
  await p.evaluate(()=>{toggleDecor();chooseMoveDecor();placeDecor(0);placeDecor(4)});
  assert.deepEqual(await p.evaluate(()=>[state.decor[0],state.decor[4],state.coins]),[null,4,16500]);
  await p.evaluate(()=>{chooseDecor(7);placeDecor(5);toggleDecor();startToyVisit(0,5)});
  assert.equal(await p.evaluate(()=>getMotion(0).toyKind),7);
  assert.equal(await p.evaluate(()=>getMotion(0).mode),'playing');
  assert(await p.evaluate(()=>getMotion(0).x>100));
  await p.evaluate(()=>{state.seed=7;plot(8);expandLand(2)});
  assert.equal(await p.locator('.cropplot').count(),18);
  assert.equal(await p.evaluate(()=>state.coins),7020);
  await p.reload();
  assert.deepEqual(await p.evaluate(()=>[state.landLevel,state.plots[8].crop,state.decor[4],state.decor[5],landSpec().sheep]),[2,7,4,7,18]);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.evaluate(()=>validBackup({format:'shipfarm-backup',state}));
  assert(await p.evaluate(()=>{try{validBackup({format:'shipfarm-backup',state:{...state,landLevel:0}});return false}catch{return true}}));
  assert.deepEqual(errors,[]);
  console.log('PASS: real wider land, preserved plots, move without extra charge, new toy, expanded save/backup, mobile layout');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
