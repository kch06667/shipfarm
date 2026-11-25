const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
(async()=>{const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(ROOT+'/index.html'))});await new Promise(r=>server.listen(8152,'127.0.0.1',r));let browser;try{
browser=await chromium.launch(require('./browser-options.cjs'));const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8152');
await p.evaluate(()=>{state=fresh();state.tutorial.step=8;state.levelBase=70;state.coins=100000;state.food=100;state.sheep[0]={breed:0,name:'base',stage:'adult',growth:100,hunger:50,clean:100,wool:0};render();navigate('sheep')});
assert.equal(await p.locator('.catalog-item').count(),24);assert(await p.evaluate(()=>[...document.querySelectorAll('.catalog-item img')].every(i=>i.complete&&i.naturalWidth>0)));
await p.evaluate(()=>{state.claimed.push('goodEvil');openVariants(11)});assert.equal(await p.locator('.variant-grid article').count(),8);await p.locator('.variant-grid article').nth(5).getByRole('button').click();assert.equal(await p.evaluate(()=>state.sheep[1].variant),5);
await p.evaluate(()=>{state.sheep[1]={breed:5,name:'short',stage:'baby',growth:0,hunger:50,clean:100,wool:0};state.selected=1;render();care('pet');care('milk')});assert.equal(await p.evaluate(()=>state.sheep[1].growth),1);
await p.evaluate(()=>{state.sheep[1].lastBabyCare=Date.now()-300001;care('milk')});assert.equal(await p.evaluate(()=>state.sheep[1].growth),2);
await p.evaluate(()=>{state.sheep[1]={breed:13,name:'cool',stage:'adult',growth:100,hunger:50,clean:100,wool:100};render();care('feed')});assert(await p.evaluate(()=>feedWait(state.sheep[1])>17990000));
await p.reload();assert(await p.evaluate(()=>feedWait(state.sheep[1])>17980000));assert(await p.evaluate(()=>!!validBackup({format:'shipfarm-backup',state})));assert.deepEqual(errors,[]);console.log('PASS: added breeds, SVG loading, sushi selection, slow growth and 5-hour feeding cooldown');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
