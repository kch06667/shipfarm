const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
(async()=>{const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(ROOT+'/index.html'))});await new Promise(r=>server.listen(8150,'127.0.0.1',r));let browser;try{
browser=await chromium.launch(require('./browser-options.cjs'));const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8150');
await p.evaluate(()=>{state=fresh();state.tutorial.step=8;state.levelBase=30;state.sheep[0]={breed:0,name:'몽실',stage:'adult',growth:100,hunger:60,clean:50,wool:100};render()});
const cap=await p.evaluate(()=>laborCap());await p.evaluate(()=>{state.seed=9;plot(0);state.plots[0].ready=Date.now()-1;plot(0)});assert.equal(await p.evaluate(()=>state.foodStock[9]),90);assert.equal(await p.evaluate(()=>state.labor.points),cap-1);
await p.evaluate(()=>{state.labor.points=0;care('wash');render()});assert.equal(await p.evaluate(()=>state.sheep[0].clean),50);
await p.getByRole('button',{name:'노동력 및 푸딩'}).click();await p.getByRole('button',{name:'최대 5개 먹기'}).click();assert.equal(await p.evaluate(()=>state.labor.points),5);await p.getByRole('button',{name:'닫기',exact:true}).click();
await p.reload();assert.equal(await p.evaluate(()=>state.labor.points),5);await p.evaluate(()=>{state.labor.at=Date.now()-600000;recoverLabor();render()});assert.equal(await p.evaluate(()=>state.labor.points),7);
await p.evaluate(()=>navigate('crops'));assert.equal(await p.locator('.crop-list tbody tr').count(),14);assert.deepEqual(errors,[]);console.log('PASS: labor cost, zero guard, pudding, recovery, saved seasonal crops');
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
