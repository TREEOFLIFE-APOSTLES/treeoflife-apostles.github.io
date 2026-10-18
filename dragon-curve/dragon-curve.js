"use strict";
const cv=document.getElementById("c"),ctx=cv.getContext("2d");
const scoreEl=document.getElementById("score"),bestEl=document.getElementById("best"),foldEl=document.getElementById("fold"),caughtEl=document.getElementById("caught"),comboEl=document.getElementById("combo"),msgEl=document.getElementById("msg");
const iterEl=document.getElementById("iter"),iterVal=document.getElementById("iterVal");
const startBtn=document.getElementById("startBtn"),pauseBtn=document.getElementById("pauseBtn"),restartBtn=document.getElementById("restartBtn"),exploreBtn=document.getElementById("exploreBtn"),soundBtn=document.getElementById("soundBtn");
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
let W=0,H=0,DPR=1;
function size(){const r=cv.parentElement.getBoundingClientRect();DPR=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);layout();}
addEventListener("resize",size);

// ---- Heighway dragon curve (original implementation) ----
// Turn sequence: S -> S, R, reverse(invert(S)). Walking those turns at
// right angles traces the curve you get by folding a paper strip.
function buildTurns(n){let t=[];for(let i=0;i<n;i++){const rev=t.slice().reverse().map(v=>-v);t=t.concat([1],rev);}return t;}
function buildPoints(n){
  const turns=buildTurns(n);let x=0,y=0,dx=1,dy=0;const pts=[[0,0]];
  const step=()=>{x+=dx;y+=dy;pts.push([x,y]);};
  step();
  for(const t of turns){const nx=t===1?-dy:dy,ny=t===1?dx:-dx;dx=nx;dy=ny;step();}
  return pts;
}
const cache={};function pointsFor(n){if(!cache[n])cache[n]=buildPoints(n);return cache[n];}
let view={s:1,ox:0,oy:0};
function layout(){
  const pts=pointsFor(iter);let mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;
  for(const p of pts){if(p[0]<mnx)mnx=p[0];if(p[0]>mxx)mxx=p[0];if(p[1]<mny)mny=p[1];if(p[1]>mxy)mxy=p[1];}
  const pad=44,s=Math.min((W-pad*2)/Math.max(1,mxx-mnx),(H-pad*2-30)/Math.max(1,mxy-mny));
  view={s,ox:(W-(mxx-mnx)*s)/2-mnx*s,oy:(H-(mxy-mny)*s)/2-mny*s+14};
}
const toScreen=p=>[p[0]*view.s+view.ox,p[1]*view.s+view.oy];

// ---- State ----
let iter=1,progress=reduced?1:0,running=false,paused=false,explore=false,won=false;
let score=0,best=+(localStorage.getItem("dragonCurveBest")||0),caught=0,chain=0,lastCatch=-9999;
let lanterns=[],parts=[],floats=[],spawnT=0,dragonPt=[0,0],lastTs=0,foldElapsed=0;
bestEl.textContent=best;
const PENTA=[523.25,587.33,659.25,783.99,880.0,1046.5];
let audio=null,soundOn=false;
function chime(i,vol){
  if(!soundOn)return;
  try{
    audio=audio||new (window.AudioContext||window.webkitAudioContext)();
    if(audio.state==="suspended")audio.resume();
    const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;
    o.type="sine";o.frequency.value=PENTA[Math.abs(i)%PENTA.length];
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||0.07,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+0.7);
    o.connect(g).connect(audio.destination);o.start(t);o.stop(t+0.75);
  }catch(e){/* sound is optional */}
}
function setMsg(t){msgEl.textContent=t;}
function updateHud(){scoreEl.textContent=score;caughtEl.textContent=caught;foldEl.textContent=iter+" / 12";comboEl.textContent=chain>1?("chain "+chain):"—";iterVal.textContent=iter;if(document.activeElement!==iterEl)iterEl.value=iter;}
function addParts(x,y,n,col){if(reduced)n=Math.min(n,6);for(let i=0;i<n;i++){const a=Math.random()*6.283,v=40+Math.random()*130;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,life:1,col});}}
function fireworks(){for(let k=0;k<5;k++){const x=W*(0.2+0.6*Math.random()),y=H*(0.2+0.35*Math.random());addParts(x,y,26,["#ffd27a","#5ee6d0","#ff7ad9"][k%3]);}floats.push({x:W/2,y:H*0.4,txt:"Dragon Fully Unfolded! 🐉",life:1.6,big:true});floats.push({x:W/2,y:H*0.4+34,txt:"589!",life:1.6,big:true});}

function startFold(n,keepScore){
  iter=n;progress=reduced?1:0;foldElapsed=0;lanterns=[];spawnT=0;layout();updateHud();
  if(!keepScore){/* score persists across folds in one walk */}
}
function completeFold(){
  chime(iter,0.08);
  floats.push({x:W/2,y:36,txt:"Fold "+iter+" complete ✦",life:1});
  if(iter>=12){
    running=false;
    if(caught>=30&&!won){won=true;fireworks();setMsg("Dragon Fully Unfolded! You caught "+caught+" lanterns — treasure open. 🏆 Walk again any time.");}
    else setMsg("The dragon is fully unfolded at fold 12 — "+caught+" lanterns caught. Walk again to chase 30, or Explore the curve.");
    return;
  }
  startFold(iter+1,true);
  setMsg("Fold "+iter+" unfolds — "+(pointsFor(iter).length-1)+" segments. Tap the lanterns on its corners.");
}
function spawnLantern(now){
  const pts=pointsFor(iter);if(pts.length<3)return;
  // a corner: any interior vertex; prefer corners ahead of the dragon
  const idx=1+Math.floor(Math.random()*(pts.length-2));
  const sc=toScreen(pts[idx]);
  if(sc[0]<20||sc[0]>W-20||sc[1]<40||sc[1]>H-20)return;
  lanterns.push({x:sc[0],y:sc[1],born:now,life:reduced?7000:4200,idx});
}
function catchLantern(l,now){
  const within=(now-lastCatch)<3000;chain=within?chain+1:1;lastCatch=now;caught++;
  let mult=1,txt="+10";
  if(chain%9===0){mult=9;txt="589! +90";addParts(l.x,l.y,30,"#ffd27a");}
  else if(chain%6===0){mult=6;txt="×6 +60";addParts(l.x,l.y,24,"#ff7ad9");}
  else if(chain%3===0){mult=3;txt="×3 +30";addParts(l.x,l.y,18,"#ffd27a");}
  else addParts(l.x,l.y,10,"#5ee6d0");
  floats.push({x:l.x,y:l.y-14,txt,life:1});
  score+=10*mult;if(score>best){best=score;bestEl.textContent=best;localStorage.setItem("dragonCurveBest",String(best));}
  chime(chain,0.06);updateHud();
}
function dragonPos(){
  const pts=pointsFor(iter);const f=Math.min(1,progress)*(pts.length-1);const i=Math.min(pts.length-2,Math.floor(f)),fr=f-i;
  const a=toScreen(pts[i]),b=toScreen(pts[i+1]||pts[i]);
  return [a[0]+(b[0]-a[0])*fr,a[1]+(b[1]-a[1])*fr];
}
function draw(now){
  ctx.clearRect(0,0,W,H);
  // stars
  ctx.fillStyle="rgba(170,240,230,.5)";
  for(let i=0;i<40;i++){const x=(i*97.3)%W,y=(i*57.7)%(H*0.8);ctx.fillRect(x,y,1.4,1.4);}
  const pts=pointsFor(iter);const total=pts.length-1;const drawn=Math.max(1,Math.floor(progress*total));
  // undrawn path (teal, faint), then walked path (gold) — teal -> gold per fold
  ctx.lineJoin="round";ctx.lineCap="round";
  ctx.beginPath();for(let i=0;i<=total;i++){const s=toScreen(pts[i]);i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1]);}
  ctx.strokeStyle="rgba(94,230,208,.28)";ctx.lineWidth=iter>9?1.2:2;ctx.stroke();
  ctx.beginPath();for(let i=0;i<=drawn;i++){const s=toScreen(pts[i]);i?ctx.lineTo(s[0],s[1]):ctx.moveTo(s[0],s[1]);}
  ctx.strokeStyle="#ffd27a";ctx.shadowColor="rgba(255,210,122,.7)";ctx.shadowBlur=8;ctx.lineWidth=iter>9?1.6:2.6;ctx.stroke();ctx.shadowBlur=0;
  // lanterns
  for(const l of lanterns){
    const age=(now-l.born)/l.life,alpha=age>0.75?1-(age-0.75)/0.25:1,pulse=reduced?1:1+0.18*Math.sin(now/220+l.idx);
    ctx.save();ctx.globalAlpha=Math.max(0,alpha);
    ctx.beginPath();ctx.arc(l.x,l.y,13*pulse,0,6.283);ctx.fillStyle="rgba(255,210,122,.22)";ctx.fill();
    ctx.font=(16*pulse)+"px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("🏮",l.x,l.y+1);
    ctx.restore();
  }
  // particles / floats
  for(const p of parts){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,2.2,0,6.283);ctx.fill();}
  ctx.globalAlpha=1;ctx.textAlign="center";
  for(const f of floats){ctx.globalAlpha=Math.max(0,Math.min(1,f.life));ctx.fillStyle="#ffd27a";ctx.font=(f.big?"700 26px":"700 15px")+" system-ui";ctx.fillText(f.txt,f.x,f.y);}
  ctx.globalAlpha=1;
  // dragon at the walking head
  const d=dragonPos();dragonPt=d;
  ctx.font="26px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.save();ctx.shadowColor="rgba(94,230,208,.8)";ctx.shadowBlur=14;ctx.fillText("🐉",d[0],d[1]);ctx.restore();
}
function loop(ts){
  const now=ts||0,dt=Math.min(50,now-(lastTs||now));lastTs=now;
  if(running&&!paused&&!explore){
    // roughly constant fold duration: higher folds have far more segments
    if(reduced){progress=1;foldElapsed+=dt;}
    else progress+=dt/7000;
    spawnT+=dt;if(spawnT>900){spawnT=0;spawnLantern(now);}
    lanterns=lanterns.filter(l=>{if(now-l.born>l.life){chain=0;updateHud();return false;}return true;});
    if(reduced?foldElapsed>=9000:progress>=1){progress=1;draw(now);completeFold();}
  }
  // physics for particles
  for(const p of parts){p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.vy+=160*dt/1000;p.life-=dt/700;}
  parts=parts.filter(p=>p.life>0);
  for(const f of floats){f.y-=dt/40;f.life-=dt/1100;}
  floats=floats.filter(f=>f.life>0);
  draw(now);
  requestAnimationFrame(loop);
}
// explore growth animation: when slider changes, regrow from 0
let growAnim=null;
function growTo(n){
  iter=n;layout();updateHud();
  if(reduced){progress=1;return;}
  growAnim={from:0,start:performance.now(),dur:900};
  (function step(t){if(!growAnim)return;progress=Math.min(1,(t-growAnim.start)/growAnim.dur);if(progress<1)requestAnimationFrame(step);else growAnim=null;})(performance.now());
}
// ---- controls ----
function startGame(){
  explore=false;exploreBtn.setAttribute("aria-pressed","false");
  score=0;caught=0;chain=0;won=false;updateHud();
  running=true;paused=false;startFold(1,false);
  setMsg("Fold 1 unfolds. Tap glowing lanterns on the corners before they fade — missed ones just fade.");
}
startBtn.onclick=startGame;
restartBtn.onclick=startGame;
pauseBtn.onclick=()=>{if(!running)return;paused=!paused;pauseBtn.textContent=paused?"▶ Resume":"⏸ Pause";setMsg(paused?"Paused — the dragon rests.":"The dragon walks again.");};
exploreBtn.onclick=()=>{
  explore=!explore;exploreBtn.setAttribute("aria-pressed",String(explore));
  if(explore){running=false;growTo(iter);setMsg("Explore mode: slide the fold 1–12 and just watch the dragon curve grow. No lanterns, no score.");}
  else setMsg("Explore off. Press Walk the Curve to play.");
};
iterEl.addEventListener("input",()=>{explore=true;exploreBtn.setAttribute("aria-pressed","true");running=false;growTo(+iterEl.value);setMsg("Exploring fold "+iter+" — "+(pointsFor(iter).length-1)+" segments from folding paper.");});
soundBtn.onclick=()=>{soundOn=!soundOn;soundBtn.setAttribute("aria-pressed",String(soundOn));soundBtn.textContent=soundOn?"🔔 Sound On":"🔕 Sound Off";if(soundOn)chime(0,0.06);else if(audio)audio.close().then(()=>audio=null).catch(()=>{});};
cv.addEventListener("pointerdown",e=>{
  if(explore)return;
  const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,now=performance.now();
  for(let i=lanterns.length-1;i>=0;i--){const l=lanterns[i];if(Math.hypot(x-l.x,y-l.y)<42){lanterns.splice(i,1);catchLantern(l,now);return;}}
});
addEventListener("keydown",e=>{
  if(e.key==="p"||e.key==="P"){pauseBtn.onclick();}
  if(e.key===" "&&document.activeElement.tagName!=="BUTTON"&&document.activeElement!==iterEl){e.preventDefault();if(!running)startGame();}
});
size();updateHud();layout();
requestAnimationFrame(loop);
