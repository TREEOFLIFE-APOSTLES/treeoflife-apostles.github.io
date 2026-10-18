// Falling Sand — original code by 589/kin. Inspired only by sandspiel; no code copied.
"use strict";
const cv=document.getElementById("c"),ctx=cv.getContext("2d");
const COLS=240,ROWS=160,CAP=COLS*ROWS;
const EMPTY=0,SAND=1,GOLD=2,WATER=3,EMBER=4;
let grid=new Uint8Array(CAP),shade=new Uint8Array(CAP),life=new Uint8Array(CAP);
let material=SAND,brush=3,paused=false,pouring=false,lastX=-1,lastY=-1,particles=0,raf=0;
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
if(reduced)paused=true;
const img=ctx.createImageData(COLS,ROWS);
const COLORS={1:[94,230,208],2:[255,210,122],3:[90,160,255],4:[255,120,50]};
const NAMES={1:"Teal Sand",2:"Gold Sparkle",3:"Blue Water",4:"Rising Ember"};
function idx(x,y){return y*COLS+x}
function inB(x,y){return x>=0&&x<COLS&&y>=0&&y<ROWS}
function setCell(x,y,t){if(!inB(x,y))return;const i=idx(x,y);if(grid[i]===EMPTY&&t!==EMPTY)particles++;if(grid[i]!==EMPTY&&t===EMPTY)particles--;grid[i]=t;shade[i]=(Math.random()*60)|0;life[i]=t===EMBER?120+((Math.random()*120)|0):0;updateCount()}
function updateCount(){const el=document.getElementById("count");if(el)el.textContent=particles+" / "+CAP+" particles"}
function pour(cx,cy){const r=brush;for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){if(x*x+y*y>r*r)continue;if(Math.random()<0.55)setCell(cx+x,cy+y,material)}}
function step(){
 // sand & gold: bottom-up
 for(let y=ROWS-2;y>=0;y--){const dir=Math.random()<.5?1:-1;
  for(let n=0;n<COLS;n++){const x=dir>0?n:COLS-1-n,i=idx(x,y),t=grid[i];if(t!==SAND&&t!==GOLD)continue;
   if(grid[idx(x,y+1)]===EMPTY||grid[idx(x,y+1)]===WATER){const below=grid[idx(x,y+1)];grid[idx(x,y+1)]=t;grid[i]=below;shade[idx(x,y+1)]=shade[i];}
   else{const dx=Math.random()<.5?1:-1;for(const d of [dx,-dx]){if(inB(x+d,y+1)&&(grid[idx(x+d,y+1)]===EMPTY||grid[idx(x+d,y+1)]===WATER)){const b=grid[idx(x+d,y+1)];grid[idx(x+d,y+1)]=t;grid[i]=b;shade[idx(x+d,y+1)]=shade[i];break}}}}}
 // water
 for(let y=ROWS-2;y>=0;y--)for(let n=0;n<COLS;n++){const x=n,i=idx(x,y);if(grid[i]!==WATER)continue;
  if(grid[idx(x,y+1)]===EMPTY){grid[idx(x,y+1)]=WATER;grid[i]=EMPTY;shade[idx(x,y+1)]=shade[i];continue}
  const dx=Math.random()<.5?1:-1;let moved=false;
  for(const d of [dx,-dx])if(inB(x+d,y+1)&&grid[idx(x+d,y+1)]===EMPTY){grid[idx(x+d,y+1)]=WATER;grid[i]=EMPTY;shade[idx(x+d,y+1)]=shade[i];moved=true;break}
  if(!moved)for(const d of [dx*3,dx*2,dx,-dx])if(inB(x+d,y)&&grid[idx(x+d,y)]===EMPTY){grid[idx(x+d,y)]=WATER;grid[i]=EMPTY;shade[idx(x+d,y)]=shade[i];break}}
 // ember: top-down, rises, flickers, dies
 for(let y=1;y<ROWS;y++)for(let x=0;x<COLS;x++){const i=idx(x,y);if(grid[i]!==EMBER)continue;
  if(--life[i]<=0){grid[i]=EMPTY;particles--;continue}
  const dx=[-1,0,1][(Math.random()*3)|0];
  if(inB(x+dx,y-1)&&grid[idx(x+dx,y-1)]===EMPTY){grid[idx(x+dx,y-1)]=EMBER;life[idx(x+dx,y-1)]=life[i];shade[idx(x+dx,y-1)]=shade[i];grid[i]=EMPTY}}
 updateCount();
}
function render(){const d=img.data;for(let i=0;i<CAP;i++){const t=grid[i],o=i*4;
 if(t===EMPTY){d[o]=3;d[o+1]=4;d[o+2]=15;d[o+3]=255;continue}
 let c=COLORS[t],s=shade[i]-30;
 if(t===EMBER)s=((Math.random()*70)|0)-20;
 d[o]=Math.max(0,Math.min(255,c[0]+s));d[o+1]=Math.max(0,Math.min(255,c[1]+s));d[o+2]=Math.max(0,Math.min(255,c[2]+s));d[o+3]=255}
 ctx.putImageData(img,0,0)}
function loop(){if(!paused){if(pouring&&lastX>=0)pour(lastX,lastY);step()}render();raf=requestAnimationFrame(loop)}
function pos(e){const r=cv.getBoundingClientRect();return[Math.floor((e.clientX-r.left)/r.width*COLS),Math.floor((e.clientY-r.top)/r.height*ROWS)]}
cv.addEventListener("pointerdown",e=>{cv.setPointerCapture(e.pointerId);pouring=true;[lastX,lastY]=pos(e);pour(lastX,lastY)});
cv.addEventListener("pointermove",e=>{if(!pouring)return;const [x,y]=pos(e);const dx=x-lastX,dy=y-lastY,steps=Math.max(Math.abs(dx),Math.abs(dy),1);for(let s=0;s<=steps;s++)pour(Math.round(lastX+dx*s/steps),Math.round(lastY+dy*s/steps));lastX=x;lastY=y});
["pointerup","pointercancel","pointerleave"].forEach(ev=>cv.addEventListener(ev,()=>pouring=false));
document.querySelectorAll("[data-mat]").forEach(b=>b.addEventListener("click",()=>{material=+b.dataset.mat;document.querySelectorAll("[data-mat]").forEach(x=>x.setAttribute("aria-pressed",x===b?"true":"false"));document.getElementById("matName").textContent=NAMES[material]}));
const pauseBtn=document.getElementById("pause");
function setPaused(v){paused=v;pauseBtn.setAttribute("aria-pressed",String(v));pauseBtn.textContent=v?"▶ Resume":"⏸ Pause"}
pauseBtn.addEventListener("click",()=>setPaused(!paused));
if(reduced){pauseBtn.setAttribute("aria-pressed","true");pauseBtn.textContent="▶ Resume";document.getElementById("msg").textContent="Reduced motion: the sand starts paused. Press Resume when you are ready."}
document.getElementById("clear").addEventListener("click",()=>{grid.fill(0);life.fill(0);particles=0;updateCount()});
const brushEl=document.getElementById("brush");
brushEl.addEventListener("input",()=>{brush=+brushEl.value;document.getElementById("brushVal").textContent=brush});
updateCount();requestAnimationFrame(loop);
