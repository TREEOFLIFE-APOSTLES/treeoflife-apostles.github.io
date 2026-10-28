(function(){
var NS='http://www.w3.org/2000/svg',PL=['ones','tens','hundreds','thousands','ten-thousands'];
var COL={GL:'#b9a58a',MB:'#7a5230',AB:'#5a3a22',W:'#eee8dc'};
function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;}
// digits from number, high place first
function toClusters(v){var s=String(v).split('').map(Number),n=s.length;return s.map(function(d,i){return{place:n-1-i,d:d};});}
function drawKnots(g,x,y,cl){ // cl: {place,d}
  var p=cl.place,d=cl.d;if(!d)return;
  if(p>0){var sp=Math.min(10,40/d);for(var i=0;i<d;i++)el('circle',{cx:x,cy:y-d*sp/2+i*sp+sp/2,r:Math.min(4.5,sp/2),fill:'#ffd98a',stroke:'#3b2a1a','stroke-width':1},g);}
  else if(d===1){el('path',{d:'M'+(x-6)+' '+(y-10)+' C'+(x+10)+' '+(y-4)+','+(x-10)+' '+(y+4)+','+(x+6)+' '+(y+10)+' M'+(x+6)+' '+(y-10)+' C'+(x-10)+' '+(y-4)+','+(x+10)+' '+(y+4)+','+(x-6)+' '+(y+10),fill:'none',stroke:'#ffd98a','stroke-width':3},g);}
  else{el('rect',{x:x-6,y:y-d*Math.min(7,40/d)/2,width:12,height:d*Math.min(7,40/d),rx:5,fill:'#ffd98a'},g);for(var j=1;j<d;j++)el('line',{x1:x-6,x2:x+6,y1:y-d*Math.min(7,40/d)/2+j*Math.min(7,40/d),y2:y-d*Math.min(7,40/d)/2+j*Math.min(7,40/d),stroke:'#3b2a1a'},g);}
}
var ROW=function(p,top,step,max){return top+(max-p)*step;};
function cord(svg,x,clusters,color,top,step,label){
  var g=el('g',{'class':'cord'},svg),max=4;
  el('line',{x1:x,y1:20,x2:x,y2:top+(max+1)*step,stroke:color||'#c9a36a','stroke-width':5,'stroke-linecap':'round'},g);
  clusters.forEach(function(c){drawKnots(g,x,ROW(c.place,top,step,max),c);});
  if(label)el('text',{x:x,y:top+(max+1)*step+18,'text-anchor':'middle','font-size':13,fill:'currentColor'},g).textContent=label;
  return g;}
function explain(cl){var v=0,parts=cl.slice().sort(function(a,b){return b.place-a.place;}).map(function(c){v+=c.d*Math.pow(10,c.place);var k=c.place>0?c.d+' single knot'+(c.d==1?'':'s'):(c.d==1?'figure-eight knot':c.d+'-turn long knot');return c.d? k+' in the '+PL[c.place]+' = '+c.d*Math.pow(10,c.place):'empty '+PL[c.place]+' = 0';});return parts.join(' · ')+'  →  <b>'+v+'</b>';}
function main(svg){el('line',{x1:10,y1:20,x2:630,y2:20,stroke:'#c9a36a','stroke-width':8,'stroke-linecap':'round'},svg);}
// real khipu: places from cluster order on cord (ones last); data verified aligned
var R=document.getElementById('real');main(R);
var real=(window.KHIPU||{cords:[]}).cords.map(function(c){var n=c.clusters.length;var cl=c.clusters.map(function(k,i){var t=k.knots[0][0],d=t==='S'?k.knots.length:(t==='E'?1:k.knots[0][1]);return{place:n-1-i,d:d};});return{n:c.n,v:c.value,color:c.color,cl:cl};});
real.forEach(function(c,i){var x=70+i*100;var g=cord(R,x,c.cl,COL[c.color],60,60,'cord '+c.n+' ('+c.color+')');
  g.addEventListener('click',function(){[].forEach.call(R.querySelectorAll('.sel'),function(s){s.classList.remove('sel');});g.classList.add('sel');document.getElementById('realh').innerHTML='Cord '+c.n+': '+explain(c.cl);});});
var T=document.getElementById('tie'),N=document.getElementById('num');
function tie(){while(T.firstChild)T.removeChild(T.firstChild);main(T);var v=Math.max(0,Math.min(99999,Math.floor(+N.value||0)));var cl=toClusters(v);cord(T,320,cl,'#c9a36a',40,45);document.getElementById('tieh').innerHTML=explain(cl);}
N.addEventListener('input',tie);tie();
var Q=document.getElementById('quiz'),ans=0;
function next(){while(Q.firstChild)Q.removeChild(Q.firstChild);main(Q);ans=1+Math.floor(Math.random()*999);if(Math.random()<.3)ans=Math.floor(ans/10)*10+1;cord(Q,320,toClusters(ans),'#c9a36a',40,45);document.getElementById('quizh').textContent='';document.getElementById('guess').value='';}
document.getElementById('next').addEventListener('click',next);
document.getElementById('check').addEventListener('click',function(){var g=+document.getElementById('guess').value;document.getElementById('quizh').innerHTML=g===ans?'Yes! '+explain(toClusters(ans)):'Not quite, try again. Count the knots in each row, top row is the highest place.';});
window.__quizAnswer=function(){return ans;};next();
})();
