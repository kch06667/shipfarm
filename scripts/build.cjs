// Builds a dependency-free, offline HTML game from editable source files.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=n=>fs.readFileSync(path.join(root,'src',n),'utf8');
const js='const ASSETS='+JSON.stringify(JSON.parse(read('assets.json')))+';\n'+read('crop-life.js')+'\n'+read('farm-toys.js')+'\n'+read('play-guide.js')+'\n'+read('game.js');
new Function(js);
const html=read('shell.html').replace('<!-- GAME_STYLE -->',()=>'<style>'+read('style.css')+'</style>').replace('<!-- GAME_SCRIPT -->',()=>'<script>'+js+'</script>');
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Built index.html ('+Buffer.byteLength(html)+' bytes)');
