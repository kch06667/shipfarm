const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const port=Number(process.env.PORT||8000),host=process.env.HOST||'127.0.0.1';
const server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
  if(!['/','/index.html'].includes(req.url.split('?')[0])){res.writeHead(404);res.end('Not found');return}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
  if(req.method==='HEAD')res.end();else fs.createReadStream(path.resolve(__dirname,'../index.html')).pipe(res);
});
server.listen(port,host,()=>console.log(`목장 열기: http://${host}:${port}`));
