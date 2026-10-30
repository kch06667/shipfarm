const {spawnSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const build=spawnSync(process.execPath,['scripts/build.cjs'],{cwd:root,stdio:'inherit'});
if(build.status!==0)process.exit(build.status||1);
for(const file of ['browser-smoke','polish-smoke','progression-smoke','homestead-smoke','variants-smoke']){
 console.log('\nRunning '+file);
 const result=spawnSync(process.execPath,[path.join(__dirname,file+'.cjs')],{cwd:root,stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
