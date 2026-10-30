// Reconstructed scenery inspired by the 2011 web screenshots, not recovered art.
function sunflower(x,y,scale=1){return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 0V20M0 14Q-13 4-11 15Q-5 20 0 17M0 10Q12 0 11 11Q6 16 0 13" fill="#6d9a32" stroke="#4d6d2b" stroke-width="2"/>${Array.from({length:8},(_,i)=>`<ellipse cy="-8" rx="4" ry="7" transform="rotate(${i*45})" fill="#ffcf39" stroke="#bc862a" stroke-width="1.4"/>`).join('')}<circle r="6" fill="#825136" stroke="#593c2d" stroke-width="2"/><path d="M-3-2l6 4M-3 2l6-4" stroke="#b37b48" stroke-width="1.5"/></g>`}
function gardenBorders(){
 const bed=(x,y,count,dx,dy)=>`<g class="sunflower-border"><path d="M${x-12} ${y+15}L${x+(count-1)*dx+12} ${y+(count-1)*dy+15}" stroke="#55742f" stroke-width="22" stroke-linecap="round"/>${Array.from({length:count},(_,i)=>sunflower(x+i*dx,y+i*dy,.65)).join('')}</g>`;
 return bed(190,164,9,26,-9)+bed(548,121,8,25,10)+bed(166,310,7,23,10);
}
function classicFarmPalette(svg){
 const colors={'#c9dc92':'#acdb55','#bad181':'#91c845','#a9c477':'#7bb53b','#a2ba72':'#5f862e','#819f58':'#547d2b','#8eaf64':'#619538','#dce6aa':'#d4ed83','#dceccf':'#b8dca0','#f3eed6':'#e2e9b5','#9ccdc1':'#67bfc5','#b5dace':'#9ad7ce','#90aa74':'#527d3b','#c18c61':'#a95f39','#d99d6e':'#bc7744','#9f7855':'#70482e','#f4e8bf':'#ffe6a2','#e8d3a6':'#e5bc79'};
 return svg.replace(/#[0-9a-f]{6}\b/gi,c=>colors[c.toLowerCase()]??c);
}
