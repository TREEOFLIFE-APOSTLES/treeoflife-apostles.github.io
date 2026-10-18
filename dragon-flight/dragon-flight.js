"use strict";
const cv=document.getElementById("c"),ctx=cv.getContext("2d");
const scoreEl=document.getElementById("score"),bestEl=document.getElementById("best"),biomeEl=document.getElementById("biome"),comboEl=document.getElementById("combo"),msgEl=document.getElementById("msg");
const startBtn=document.getElementById("startBtn"),pauseBtn=document.getElementById("pauseBtn"),restartBtn=document.getElementById("restartBtn"),soundBtn=document.getElementById("soundBtn");
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
let W=0,H=0,DPR=1;
function size(){DPR=Math.min(devicePixelRatio||1,2);const r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=Math.max(1,W*DPR);cv.height=Math.max(1,H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);}
addEventListener("resize",size);
const BIOMES=[
 {name:"🌊 Ocean",sky:["#062a4a","#041426"],accent:"#5ee6d0"},
 {name:"❄️ Snow",sky:["#24365e","#0a1226"],accent:"#dff6ff"},
 {name:"🌋 Lava",sky:["#2b0f14","#12040a"],accent:"#ff9a3c"}];
const NAMES=["589","ZERACHIEL","EVANGELINE","ZEUS","SCORPIO","ZELDA","TREEOFLIFE","APOSTLES","589/kin","WITNESS"];
let running=false,paused=false,holding=false,last=0,t=0,dist=0,biomeIdx=0,biomeTimer=0,slowUntil=0;
let score=0,best=+(localStorage.getItem("dragonFlightBest")||0),chain=0,lastCollect=-9999,spawnT=0,ambient=[];
let dragon={y:0,vy:0},lanterns=[],clouds=[],parts=[],floats=[];
bestEl.textContent=best;
function reset(){score=0;chain=0;dist=0;biomeIdx=0;biomeTimer=0;dragon.y=H*0.45;dragon.vy=0;lanterns=[];clouds=[];parts=[];floats=[];spawnT=0;scoreEl.textContent="0";comboEl.textContent="—";biomeEl.textContent=BIOMES[0].name;msgEl.textContent="Hold to rise, release to glide. Collect lanterns 🏮";}
function spawnLantern(){lanterns.push({x:W+40,y:50+Math.random()*(H-120),r:14,ph:Math.random()*6.28});}
function spawnCloud(){const b=biomeIdx;clouds.push({x:W+80,y:40+Math.random()*(H*0.6),r:28+Math.random()*36,kind:b===1?"gust":(b===2?"smoke":"cloud"),hit:false});}
function addParts(x,y,n,col,star){if(reduced)n=Math.ceil(n/2);for(let i=0;i<n&&parts.length<220;i++){let a,s;if(star){a=(i/Math.max(1,n))*6.283+((i%2)?0.35:0);s=1.2+((i%3)*0.7);}else{a=Math.random()*6.28;s=Math.random()*1.8+0.3;}parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-0.3,life:1,decay:0.012+Math.random()*0.02,col,size:star?2.4:1.8});}}
function burst589(x,y){ // fireworks sparkle, original simple rays
 for(let ring=0;ring<3;ring++)for(let i=0;i<18&&parts.length<220;i++){const a=i/18*6.283+ring*0.2,s=1.4+ring*1.1;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:0.01,col:ring===0?"#ffd27a":ring===1?"#5ee6d0":"#ff7ad9",size:2.6});}
 floats.push({x,y,txt:"589!",life:1,big:true});
}
let AC=null,soundOn=false,master=null;
function ensureAudio(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=0.06;master.connect(AC.destination);}catch(e){}}
function chime(){if(!soundOn||!AC)return;const o=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),now=AC.currentTime;o.frequency.value=528;o2.frequency.value=1056;o.type="sine";o2.type="sine";g.gain.setValueAtTime(0.5,now);g.gain.exponentialRampToValueAtTime(0.001,now+1.1);o.connect(g);o2.connect(g);g.connect(master);o.start(now);o2.start(now);o.stop(now+1.2);o2.stop(now+1.2);}
function whoosh(){if(!soundOn||!AC)return;const len=AC.sampleRate*0.5,buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);const s=AC.createBufferSource();s.buffer=buf;const f=AC.createBiquadFilter();f.type="bandpass";f.frequency.value=600;const g=AC.createGain();g.gain.value=0.35;s.connect(f);f.connect(g);g.connect(master);s.start();}
function collect(l,now){const within=(now-lastCollect)<2500;chain=within?chain+1:1;lastCollect=now;let mult=1,txt="+10";
 if(chain%9===0){mult=9;txt="589! +"+(10*mult);burst589(l.x,l.y);}
 else if(chain%6===0){mult=6;txt="×6 +"+(10*mult);addParts(l.x,l.y,26,"#ff7ad9",true);}
 else if(chain%3===0){mult=3;txt="×3 +"+(10*mult);addParts(l.x,l.y,20,"#ffd27a",true);}
 else addParts(l.x,l.y,14,"#ffd27a",true);
 score+=10*mult;scoreEl.textContent=score;comboEl.textContent=chain>1?("chain "+chain+(mult>1?" · ×"+mult:"")):"—";
 if(chain%9!==0)floats.push({x:l.x,y:l.y,txt,life:1});
 if(score>best){best=score;bestEl.textContent=best;localStorage.setItem("dragonFlightBest",String(best));}
 chime();}
function drawDragon(x,y,time){ctx.save();ctx.translate(x,y);const bob=reduced?Math.sin(time/600)*2:Math.sin(time/280)*4;ctx.translate(0,bob);
 // tail trail handled by particles; body: glowing teal/gold vector dragon (original)
 ctx.shadowColor="rgba(94,230,208,.8)";ctx.shadowBlur=14;
 ctx.fillStyle="#19b8a6";ctx.strokeStyle="#ffd27a";ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-42,6);ctx.quadraticCurveTo(-20,-12,12,-8);ctx.quadraticCurveTo(34,-6,44,0);ctx.quadraticCurveTo(34,10,8,12);ctx.quadraticCurveTo(-22,14,-42,6);ctx.fill();
 ctx.beginPath();ctx.arc(48,-2,10,0,6.28);ctx.fill(); // head
 ctx.fillStyle="#ffd27a";ctx.beginPath();ctx.moveTo(44,-10);ctx.lineTo(52,-20);ctx.lineTo(56,-9);ctx.fill(); // horn
 ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(51,-4,3,0,6.28);ctx.fill();ctx.fillStyle="#062";ctx.beginPath();ctx.arc(52,-4,1.4,0,6.28);ctx.fill();
 ctx.strokeStyle="#5ee6d0";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-40,6);ctx.quadraticCurveTo(-58,Math.sin(time/200)*8,-70,Math.sin(time/200+1)*10);ctx.stroke(); // tail
 ctx.fillStyle="rgba(255,210,122,.85)";ctx.beginPath();ctx.moveTo(-4,-10);ctx.quadraticCurveTo(8,-26,18,-12);ctx.quadraticCurveTo(8,-8,-4,-10);ctx.fill(); // wing
 ctx.restore();}
function drawBiome(dt,speed){const b=BIOMES[biomeIdx];const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,b.sky[0]);g.addColorStop(1,b.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 if(biomeIdx===0){ // Ocean waves + faint waterfall name-rain + Pisces fish
   ctx.save();ctx.globalAlpha=0.16;ctx.fillStyle="#7dffd4";ctx.font="12px monospace";
   NAMES.forEach((n,i)=>{const x=((i*97 - (t*0.02))%(W+120)+W+120)%(W+120)-60;const y=((i*53 + t*0.25)%(H+30));ctx.fillText(n,x,y);});
   ctx.restore();
   ctx.strokeStyle="rgba(94,230,208,.5)";for(let row=0;row<3;row++){ctx.beginPath();for(let x=0;x<=W;x+=12){const y=H-50-row*18+Math.sin(x/40+t/500+row)*5;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
   ctx.fillStyle="rgba(125,255,212,.55)";for(let i=0;i<3;i++){const fx=((W - ((t*0.05+i*260)%(W+120)))+W)%(W+120)-60,fy=H*0.62+Math.sin(t/700+i)*10;ctx.beginPath();ctx.ellipse(fx,fy,12,6,0,0,6.28);ctx.fill();ctx.beginPath();ctx.moveTo(fx+10,fy);ctx.lineTo(fx+20,fy-6);ctx.lineTo(fx+20,fy+6);ctx.fill();}
 } else if(biomeIdx===1){ // Snow peaks + snow
   ctx.fillStyle="rgba(230,246,255,.9)";ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W;x+=90){ctx.lineTo(x+45,H-90-((x*7)%40));ctx.lineTo(x+90,H);}ctx.fill();
   ctx.fillStyle="rgba(255,255,255,.85)";for(const p of ambient){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fill();}
 } else { // Lava rocks + glow + embers
   const lg=ctx.createLinearGradient(0,H-120,0,H);lg.addColorStop(0,"rgba(255,90,0,0)");lg.addColorStop(1,"rgba(255,110,20,.55)");ctx.fillStyle=lg;ctx.fillRect(0,H-120,W,120);
   ctx.fillStyle="#1a0a0e";ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W;x+=70){ctx.lineTo(x+35,H-55-((x*13)%35));ctx.lineTo(x+70,H);}ctx.fill();
   ctx.fillStyle="rgba(255,154,60,.9)";for(const p of ambient){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fill();}
 }}
function updateAmbient(dt){const maxA=reduced?24:48;if(ambient.length<maxA&&Math.random()<0.3)ambient.push(biomeIdx===2?{x:Math.random()*W,y:H+5,r:1+Math.random()*2,vy:-(0.4+Math.random())}:{x:Math.random()*W,y:-5,r:1+Math.random()*2,vy:0.4+Math.random()*0.8});
 for(const p of ambient){p.y+= (biomeIdx===2?p.vy*2:p.vy);p.x+=Math.sin(t/600+p.y/30)*0.3;}ambient=ambient.filter(p=>p.y>-10&&p.y<H+10);}
function frame(ts){if(!running||paused){return;}const dt=Math.min(32,ts-last||16);last=ts;t+=dt;
 const base=reduced?1.7:2.2, speed=(base+Math.min(1.8,score/300))*(t<slowUntil?0.65:1);dist+=speed*dt/16;biomeTimer+=dt;
 if(biomeTimer>18000){biomeTimer=0;biomeIdx=(biomeIdx+1)%3;biomeEl.textContent=BIOMES[biomeIdx].name;ambient=[];whoosh();floats.push({x:W*0.5,y:50,txt:BIOMES[biomeIdx].name,life:1,big:true});}
 dragon.vy+= (holding?-0.045:0.035)* (dt/16) * (reduced?0.8:1);dragon.vy*=0.92;dragon.vy=Math.max(-3.4,Math.min(3.2,dragon.vy));dragon.y+=dragon.vy*dt/16;
 if(dragon.y<34){dragon.y=34;dragon.vy=Math.max(0,dragon.vy);}if(dragon.y>H-44){dragon.y=H-44;dragon.vy=Math.min(0,dragon.vy);}
 if(Math.random()<0.55)addParts(W*0.22-38,dragon.y+6,1,"#5ee6d0",false);
 spawnT+=dt;if(spawnT>1050){spawnT=0;spawnLantern();if(Math.random()<0.55)spawnCloud();}
 updateAmbient(dt);
 const dx=W*0.24;
 for(const l of lanterns){l.x-=speed*dt/16;l.ph+=dt/300;if(!l.got&&Math.hypot(l.x-dx,l.y-dragon.y)<48){l.got=true;collect(l,ts);}}
 lanterns=lanterns.filter(l=>!l.got&&l.x>-50);
 for(const c of clouds){c.x-=speed*0.9*dt/16;if(!c.hit&&Math.hypot(c.x-dx,c.y-dragon.y)<c.r+18){c.hit=true;slowUntil=t+900;addParts(dx,dragon.y,10,"#ffffff",false);floats.push({x:dx,y:dragon.y-24,txt:"✨ slow sparkle",life:1});}}
 clouds=clouds.filter(c=>c.x>-120);
 for(const p of parts){p.x+=p.vx*dt/16;p.y+=p.vy*dt/16;p.vy+=0.01;p.life-=p.decay*dt/16;}parts=parts.filter(p=>p.life>0);
 for(const f of floats){f.y-=0.5*dt/16;f.life-=0.012*dt/16;}floats=floats.filter(f=>f.life>0);
 drawBiome(dt,speed);
 // clouds behind dragon
 for(const c of clouds){ctx.save();ctx.globalAlpha=0.28;ctx.fillStyle=c.kind==="smoke"?"#888":c.kind==="gust"?"#eaf7ff":"#ffffff";for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(c.x+i*16-24,c.y+((i%2)*8),c.r*0.55,0,6.28);ctx.fill();}ctx.restore();}
 for(const l of lanterns){ctx.save();ctx.translate(l.x,l.y+Math.sin(l.ph)*4);ctx.shadowColor="#ffd27a";ctx.shadowBlur=16;ctx.fillStyle="#ffd27a";ctx.beginPath();ctx.arc(0,0,10,0,6.28);ctx.fill();ctx.fillStyle="#7a3b00";ctx.fillRect(-2,-16,4,6);ctx.fillStyle="#fff3c4";ctx.beginPath();ctx.arc(0,0,4,0,6.28);ctx.fill();ctx.restore();}
 drawDragon(dx,dragon.y,ts);
 for(const p of parts){ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,6.28);ctx.fill();ctx.restore();}
 ctx.textAlign="center";for(const f of floats){ctx.save();ctx.globalAlpha=Math.max(0,f.life);ctx.fillStyle=f.big?"#ffd27a":"#fff";ctx.font=f.big?"700 30px system-ui":"600 14px system-ui";ctx.fillText(f.txt,f.x,f.y);ctx.restore();}
 if(paused){ctx.fillStyle="rgba(0,0,0,.45)";ctx.fillRect(0,0,W,H);ctx.fillStyle="#fff";ctx.font="700 22px system-ui";ctx.textAlign="center";ctx.fillText("Paused — soft eyes",W/2,H/2);}
 requestAnimationFrame(frame);}
function start(){size();reset();running=true;paused=false;pauseBtn.textContent="⏸ Pause";msgEl.textContent="Flying! Hold to rise, release to glide.";last=performance.now();requestAnimationFrame(frame);}
function togglePause(){if(!running)return;paused=!paused;pauseBtn.textContent=paused?"▶ Resume":"⏸ Pause";if(!paused){last=performance.now();requestAnimationFrame(frame);}else{frame(performance.now());}}
startBtn.addEventListener("click",start);restartBtn.addEventListener("click",start);pauseBtn.addEventListener("click",togglePause);
soundBtn.addEventListener("click",()=>{soundOn=!soundOn;soundBtn.setAttribute("aria-pressed",String(soundOn));soundBtn.textContent=soundOn?"🔔 Sound On":"🔕 Sound Off";if(soundOn){ensureAudio();if(AC&&AC.state==="suspended")AC.resume();chime();}});
function down(e){holding=true;if(!running)start();e.preventDefault();}function up(){holding=false;}
cv.addEventListener("pointerdown",down);addEventListener("pointerup",up);addEventListener("pointercancel",up);
addEventListener("keydown",e=>{if(e.code==="Space"||e.code==="ArrowUp"){holding=true;if(!running)start();e.preventDefault();}if(e.code==="KeyP")togglePause();});
addEventListener("keyup",e=>{if(e.code==="Space"||e.code==="ArrowUp")holding=false;});
size();dragon.y=innerHeight*0.3;drawBiome(0,0);drawDragon(W*0.24||120,140,0);
