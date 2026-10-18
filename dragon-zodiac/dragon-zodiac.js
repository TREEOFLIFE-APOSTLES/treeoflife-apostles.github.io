"use strict";
const cv=document.getElementById("c"),ctx=cv.getContext("2d");
const scoreEl=document.getElementById("score"),bestEl=document.getElementById("best"),targetEl=document.getElementById("target"),litEl=document.getElementById("lit"),timeEl=document.getElementById("time"),msgEl=document.getElementById("msg");
const startBtn=document.getElementById("startBtn"),pauseBtn=document.getElementById("pauseBtn"),restartBtn=document.getElementById("restartBtn"),soundBtn=document.getElementById("soundBtn"),endlessEl=document.getElementById("endless");
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const SIGNS=[
 {n:"Aries",g:"\u2648"},{n:"Taurus",g:"\u2649"},{n:"Gemini",g:"\u264A"},{n:"Cancer",g:"\u264B"},
 {n:"Leo",g:"\u264C"},{n:"Virgo",g:"\u264D"},{n:"Libra",g:"\u264E"},{n:"Scorpio",g:"\u264F"},
 {n:"Sagittarius",g:"\u2650"},{n:"Capricorn",g:"\u2651"},{n:"Aquarius",g:"\u2652"},{n:"Pisces",g:"\u2653"}];
const PISCES=11, MAXPARTS=180;
let W=0,H=0,DPR=1;
function size(){DPR=Math.min(devicePixelRatio||1,2);const r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=Math.max(1,W*DPR);cv.height=Math.max(1,H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);}
addEventListener("resize",size);
// deterministic little constellation per sign (original pseudo-random from index)
function constellation(i,cx,cy,R){
  const pts=[];let s=(i+3)*7919;
  const rnd=()=>{s=(s*9301+49297)%233280;return s/233280;};
  for(let k=0;k<5;k++){const a=(i/12)*6.283-1.571+(rnd()-0.5)*0.42;const rr=R*(0.82+rnd()*0.13);pts.push({x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr});}
  return pts;
}
let running=false,paused=false,last=0,t=0,score=0,best=+(localStorage.getItem("dragonZodiacBest")||0);
let lit=new Set(),target=PISCES,phase="light",bonus=0,timeLeft=90,spawnT=0;
let dragon={a:0,rad:1,dive:0}; // rad: 1=orbit, dives toward 0.25
let stars=[],parts=[],floats=[];
bestEl.textContent=best;
function centre(){return{x:W/2,y:H/2+14,R:Math.max(80,Math.min(W,H)*0.40)};}
function unlit(){return SIGNS.map((_,i)=>i).filter(i=>!lit.has(i));}
function pickTarget(){const u=unlit();target=u.length?u[Math.floor(Math.random()*u.length)]:PISCES;showTarget();}
function showTarget(){targetEl.textContent=SIGNS[target].g+" "+SIGNS[target].n+(phase==="bonus"?" ("+bonus+"/3)":"");litEl.textContent=lit.size+"/12";}
function addParts(x,y,n,col){if(reduced)n=Math.ceil(n/2);for(let i=0;i<n&&parts.length<MAXPARTS;i++){const a=Math.random()*6.28,sp=Math.random()*1.9+0.3;parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-0.3,life:1,decay:0.012+Math.random()*0.02,col,size:1.9});}}
function fireworks(x,y){for(let ring=0;ring<3;ring++)for(let i=0;i<20&&parts.length<MAXPARTS;i++){const a=i/20*6.283+ring*0.2,sp=1.5+ring*1.1;parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,decay:0.009,col:ring===0?"#ffd27a":ring===1?"#5ee6d0":"#ff7ad9",size:2.6});}}
let AC=null,soundOn=false,master=null;
function ensureAudio(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=0.05;master.connect(AC.destination);}catch(e){}}
function chime(){if(!soundOn||!AC)return;const o=AC.createOscillator(),g=AC.createGain(),now=AC.currentTime;o.type="sine";o.frequency.value=432;g.gain.setValueAtTime(0.5,now);g.gain.exponentialRampToValueAtTime(0.001,now+1.2);o.connect(g);g.connect(master);o.start(now);o.stop(now+1.3);}
function spawnStar(){
  if(stars.length>=4)return;const c=centre();
  let idx;const r=Math.random();
  if(phase==="bonus")idx=r<0.6?PISCES:Math.floor(Math.random()*12);
  else idx=r<0.38?target:Math.floor(Math.random()*12);
  const x=c.x+(Math.random()*2-1)*c.R*0.55;
  stars.push({x,y:-24,vy:(reduced?0.55:0.9)+Math.random()*0.5,idx,ph:Math.random()*6.28});
}
function catchStar(s){
  const correct=phase==="bonus"?s.idx===PISCES:s.idx===target;
  if(!correct){addParts(s.x,s.y,12,"#cfe8ff");floats.push({x:s.x,y:s.y,txt:"\u2726 sparkle",life:1});return;}
  score+=18;scoreEl.textContent=score;chime();addParts(s.x,s.y,20,s.idx===PISCES?"#ffd27a":"#5ee6d0");
  floats.push({x:s.x,y:s.y,txt:"+18 "+SIGNS[s.idx].g,life:1});
  if(score>best){best=score;bestEl.textContent=best;localStorage.setItem("dragonZodiacBest",String(best));}
  if(phase==="light"){
    lit.add(s.idx);
    if(lit.size>=12){phase="bonus";bonus=0;const c=centre();fireworks(c.x,c.y);fireworks(c.x-80,c.y-40);fireworks(c.x+80,c.y+30);floats.push({x:c.x,y:c.y-20,txt:"Whole Sky Lit! \u2726",life:1.6,big:true});msgEl.textContent="Whole Sky Lit! Bonus round: catch Pisces \u2653 three times.";target=PISCES;}
    else pickTarget();
  }else if(phase==="bonus"){
    bonus++;
    if(bonus>=3){phase="won";const c=centre();fireworks(c.x,c.y);floats.push({x:c.x,y:c.y-20,txt:"Whole Sky Lit! \u2653\u00D73 \u2726",life:1.8,big:true});msgEl.textContent="You did it \u2014 Whole Sky Lit, and Pisces caught 3 times! Press Restart to play again.";}
  }
  showTarget();
}
function reset(){
  score=0;lit=new Set();phase="light";bonus=0;stars=[];parts=[];floats=[];spawnT=0;timeLeft=90;
  dragon={a:0,rad:1,dive:0};scoreEl.textContent="0";pickTarget();showTarget();
  timeEl.textContent=endlessEl.checked?"\u221E":"90s";
  msgEl.textContent="The dragon orbits on its own \u2014 tap, click, or press Space to launch it inward.";
}
function dragonPos(){const c=centre();const rr=c.R*dragon.rad;return{x:c.x+Math.cos(dragon.a)*rr,y:c.y+Math.sin(dragon.a)*rr,c};}
function drawDragon(x,y,time){
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(dragon.a)*0.2);const bob=reduced?0:Math.sin(time/280)*2;ctx.translate(0,bob);
  ctx.shadowColor="rgba(94,230,208,.8)";ctx.shadowBlur=12;ctx.fillStyle="#19b8a6";ctx.strokeStyle="#ffd27a";ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(-26,4);ctx.quadraticCurveTo(-12,-8,8,-5);ctx.quadraticCurveTo(22,-4,28,0);ctx.quadraticCurveTo(22,7,5,8);ctx.quadraticCurveTo(-14,9,-26,4);ctx.fill();
  ctx.beginPath();ctx.arc(31,-1,7,0,6.28);ctx.fill();
  ctx.fillStyle="#ffd27a";ctx.beginPath();ctx.moveTo(28,-7);ctx.lineTo(34,-14);ctx.lineTo(37,-6);ctx.fill();
  ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(33,-2,2.2,0,6.28);ctx.fill();
  ctx.strokeStyle="#5ee6d0";ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-25,4);ctx.quadraticCurveTo(-38,Math.sin(time/200)*6,-46,Math.sin(time/200+1)*7);ctx.stroke();
  ctx.fillStyle="rgba(255,210,122,.85)";ctx.beginPath();ctx.moveTo(-3,-7);ctx.quadraticCurveTo(5,-17,12,-8);ctx.quadraticCurveTo(5,-5,-3,-7);ctx.fill();
  ctx.restore();
}
function draw(){
  const c=centre();
  const g=ctx.createRadialGradient(c.x,c.y,10,c.x,c.y,c.R*1.35);g.addColorStop(0,"#101a4a");g.addColorStop(1,"#02040e");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // wheel
  ctx.save();ctx.strokeStyle="rgba(94,230,208,.35)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(c.x,c.y,c.R,0,6.283);ctx.stroke();
  ctx.strokeStyle="rgba(255,210,122,.16)";ctx.beginPath();ctx.arc(c.x,c.y,c.R*0.70,0,6.283);ctx.stroke();ctx.restore();
  for(let i=0;i<12;i++){
    const a=(i/12)*6.283-1.571,house=i===PISCES,isLit=lit.has(i),isTarget=(phase==="bonus"?i===PISCES:i===target);
    const lx=c.x+Math.cos(a)*c.R*0.93,ly=c.y+Math.sin(a)*c.R*0.93;
    const pts=constellation(i,c.x,c.y,c.R);
    ctx.save();
    if(isLit||isTarget){ctx.strokeStyle=house?"rgba(255,210,122,.9)":"rgba(94,230,208,.75)";ctx.lineWidth=isLit?1.8:1.2;ctx.beginPath();pts.forEach((p,k)=>k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
    for(const p of pts){ctx.fillStyle=isLit?(house?"#ffd27a":"#bffcf2"):"rgba(200,220,255,.38)";ctx.beginPath();ctx.arc(p.x,p.y,isLit?2.2:1.4,0,6.283);ctx.fill();}
    ctx.font=(house?"700 20px system-ui":"17px system-ui");ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle=house?"#ffd27a":isTarget?"#ffffff":"rgba(233,230,255,.75)";
    if(house){ctx.shadowColor="#ffd27a";ctx.shadowBlur=12;}
    ctx.fillText(SIGNS[i].g,lx,ly);ctx.restore();
    ctx.save();ctx.font="10px system-ui";ctx.textAlign="center";ctx.fillStyle=house?"#ffd27a":"rgba(233,230,255,.55)";ctx.fillText(SIGNS[i].n,c.x+Math.cos(a)*c.R*1.06,c.y+Math.sin(a)*c.R*1.06);ctx.restore();
  }
  // falling stars
  for(const s of stars){ctx.save();ctx.translate(s.x,s.y+Math.sin(s.ph)*2);ctx.shadowColor=s.idx===PISCES?"#ffd27a":"#9fd8ff";ctx.shadowBlur=14;ctx.fillStyle=s.idx===PISCES?"#ffd27a":"#dff3ff";ctx.beginPath();ctx.arc(0,0,12,0,6.283);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle="#122";ctx.font="700 13px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(SIGNS[s.idx].g,0,1);ctx.restore();}
  const dp=dragonPos();drawDragon(dp.x,dp.y,t);
  for(const p of parts){ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,6.283);ctx.fill();ctx.restore();}
  ctx.textAlign="center";for(const f of floats){ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,f.life));ctx.fillStyle=f.big?"#ffd27a":"#fff";ctx.font=f.big?"700 26px system-ui":"600 14px system-ui";ctx.fillText(f.txt,f.x,f.y);ctx.restore();}
  if(paused){ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(0,0,W,H);ctx.fillStyle="#fff";ctx.font="700 22px system-ui";ctx.textAlign="center";ctx.fillText("Paused \u2014 soft eyes",W/2,H/2);}
}
function frame(ts){
  if(!running||paused)return;const dt=Math.min(32,ts-last||16);last=ts;t+=dt;
  if(!endlessEl.checked&&phase!=="won"){timeLeft-=dt/1000;timeEl.textContent=Math.max(0,Math.ceil(timeLeft))+"s";if(timeLeft<=0){running=false;msgEl.textContent="Time rests at 90 seconds \u2014 gentle try! Your score is saved. Press Start to go again.";draw();return;}}
  dragon.a+=dt/(reduced?2600:1700);
  if(dragon.dive>0){dragon.dive-=dt/16;const ph=dragon.dive;dragon.rad=ph>14?Math.max(0.22,1-(28-ph)*0.055):Math.min(1,0.22+(14-ph)*0.055);if(dragon.dive<=0){dragon.dive=0;dragon.rad=1;}}
  spawnT+=dt;if(spawnT>(reduced?1700:1300)){spawnT=0;spawnStar();}
  const dp=dragonPos();
  for(const s of stars){s.y+=s.vy*dt/16;s.ph+=dt/300;if(Math.hypot(s.x-dp.x,s.y-dp.y)<42){s.got=true;catchStar(s);}}
  const c=centre();stars=stars.filter(s=>!s.got&&s.y<c.y+c.R+30);
  for(const p of parts){p.x+=p.vx*dt/16;p.y+=p.vy*dt/16;p.life-=p.decay*dt/16;}parts=parts.filter(p=>p.life>0);
  for(const f of floats){f.y-=0.4*dt/16;f.life-=0.010*dt/16;}floats=floats.filter(f=>f.life>0);
  draw();requestAnimationFrame(frame);
}
function launch(){if(!running){start();return;}if(paused||dragon.dive>0)return;dragon.dive=28;}
function start(){size();reset();running=true;paused=false;pauseBtn.textContent="\u23F8 Pause";last=performance.now();requestAnimationFrame(frame);}
function togglePause(){if(!running)return;paused=!paused;pauseBtn.textContent=paused?"\u25B6 Resume":"\u23F8 Pause";if(!paused){last=performance.now();requestAnimationFrame(frame);}else draw();}
startBtn.addEventListener("click",start);restartBtn.addEventListener("click",start);pauseBtn.addEventListener("click",togglePause);
endlessEl.addEventListener("change",()=>{timeLeft=90;timeEl.textContent=endlessEl.checked?"\u221E":"90s";});
soundBtn.addEventListener("click",()=>{soundOn=!soundOn;soundBtn.setAttribute("aria-pressed",String(soundOn));soundBtn.textContent=soundOn?"\uD83D\uDD14 Sound On":"\uD83D\uDD15 Sound Off";if(soundOn){ensureAudio();if(AC&&AC.state==="suspended")AC.resume();chime();}});
cv.addEventListener("pointerdown",e=>{launch();e.preventDefault();});
addEventListener("keydown",e=>{if(e.code==="Space"){launch();e.preventDefault();}if(e.code==="KeyP")togglePause();});
size();pickTarget();draw();
