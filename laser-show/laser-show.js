"use strict";
// Clean-room screen-only laser-show simulator. No hardware/DAC/OSC/network output.
const cv=document.getElementById("c"),ctx=cv.getContext("2d");
const presetNameEl=document.getElementById("presetName"),paletteNameEl=document.getElementById("paletteName"),modeNameEl=document.getElementById("modeName"),msgEl=document.getElementById("msg");
const playBtn=document.getElementById("playBtn"),choreoBtn=document.getElementById("choreoBtn"),drawBtn=document.getElementById("drawBtn"),paletteBtn=document.getElementById("paletteBtn"),soundBtn=document.getElementById("soundBtn");
const speedEl=document.getElementById("speed"),speedVal=document.getElementById("speedVal"),glowEl=document.getElementById("glow"),glowVal=document.getElementById("glowVal");
const fpsEl=document.getElementById("fps"),frameMsEl=document.getElementById("frameMs"),ptsEl=document.getElementById("pts"),tierEl=document.getElementById("tier"),beatEl=document.getElementById("beat");
const presetsBar=document.getElementById("presets");
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
let W=0,H=0,DPR=1,tier=0; // 0 full, 1 balanced, 2 light
const TIERS=["Full","Balanced","Light"];
function size(){const r=cv.parentElement.getBoundingClientRect();const cap=tier===0?2:tier===1?1.35:1;DPR=Math.min(cap,devicePixelRatio||1);W=r.width;H=r.height;cv.width=Math.max(1,W*DPR);cv.height=Math.max(1,H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);ctx.fillStyle="#01020a";ctx.fillRect(0,0,W,H);}
addEventListener("resize",size);

// ---------- shape generators (normalized coords, strokes = arrays of [x,y]) ----------
function circle(cx,cy,r,n){const p=[];n=n||72;for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;p.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return p;}
function star(){const p=[];for(let i=0;i<=10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?0.38:0.82;p.push([Math.cos(a)*r,Math.sin(a)*r]);}return [p];}
function fish(sign){ // one Pisces fish: wavy body + tail, sign mirrors it
  const body=[],tail=[];for(let i=0;i<=40;i++){const t=i/40,x=sign*( -0.55+t*1.0),y=Math.sin(t*Math.PI*1.15)*0.42*sign -0.05 + (t-0.5)*0.35*sign;body.push([x,y]);}
  const tip=body[body.length-1];tail.push(tip,[tip[0]+sign*0.22,tip[1]-0.20],tip,[tip[0]+sign*0.22,tip[1]+0.20],tip);return [body,tail];}
function pisces(){return fish(1).concat(fish(-1));}
function dragon(){let turns=[];const n=8;for(let i=0;i<n;i++){turns=turns.concat([1],turns.slice().reverse().map(v=>-v));}
  let x=0,y=0,dx=1,dy=0;const raw=[[0,0]];const step=()=>{x+=dx;y+=dy;raw.push([x,y]);};step();
  for(const t of turns){const nx=t===1?-dy:dy,ny=t===1?dx:-dx;dx=nx;dy=ny;step();}
  let mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;for(const p of raw){mnx=Math.min(mnx,p[0]);mxx=Math.max(mxx,p[0]);mny=Math.min(mny,p[1]);mxy=Math.max(mxy,p[1]);}
  const s=1.55/Math.max(mxx-mnx,mxy-mny);return [raw.map(p=>[ (p[0]-(mnx+mxx)/2)*s,(p[1]-(mny+mxy)/2)*s ])];}
function tri(up,cx,cy,r){const p=[];for(let i=0;i<=3;i++){const a=(up?-Math.PI/2:Math.PI/2)+i*2*Math.PI/3;p.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return p;}
function sri(){const s=[];const up=[.78,.60,.44,.30],down=[.82,.68,.52,.38,.24];
  up.forEach((r,i)=>s.push(tri(true,(i-1.5)*0.03,(i%2?0.04:-0.03),r)));down.forEach((r,i)=>s.push(tri(false,(i-2)*0.025,(i%2?-0.04:0.03),r)));s.push(circle(0,0,.92,72));return s;}
function vesica(){return [circle(-0.38,0,0.62),circle(0.38,0,0.62)];}
function tree(){const s=[];function branch(x,y,a,len,d){if(d===0||len<0.04)return;const x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len;s.push([[x,y],[x2,y2]]);branch(x2,y2,a-0.42,len*0.72,d-1);branch(x2,y2,a+0.42,len*0.72,d-1);}branch(0,0.88,-Math.PI/2,0.42,6);return s;}
function galaxy(){const arms=[];for(let k=0;k<2;k++){const p=[];for(let i=0;i<=90;i++){const t=i/90,a=t*Math.PI*3.2+k*Math.PI,r=0.06+t*0.78;p.push([Math.cos(a)*r,Math.sin(a)*r*0.82]);}arms.push(p);}arms.push(circle(0,0,0.09,36));return arms;}
const PRESETS=[{id:"star",label:"⭐ Star",make:star},{id:"pisces",label:"♓ Pisces",make:pisces},{id:"dragon",label:"🐉 Dragon",make:dragon},{id:"sri",label:"🔺 Sri Yantra",make:sri},{id:"vesica",label:"🐟 Vesica",make:vesica},{id:"tree",label:"🌳 Tree",make:tree},{id:"galaxy",label:"🌀 Spiral Galaxy",make:galaxy}];
const PALETTES=[{name:"Teal / Gold",colors:["#5ee6d0","#ffd27a","#5ee6d0"]},{name:"Purple / Green Dragon",colors:["#c49aff","#7dff9a","#5ee6d0"]},{name:"Gold / Pink",colors:["#ffd27a","#ff7ad9","#ffe9a8"]},{name:"Ocean / Green",colors:["#59c2ff","#7dff9a","#5ee6d0"]}];

// resample all strokes into N points (for morphing)
function resample(strokes,N){const segs=[];let total=0;for(const st of strokes)for(let i=1;i<st.length;i++){const d=Math.hypot(st[i][0]-st[i-1][0],st[i][1]-st[i-1][1]);segs.push([st[i-1],st[i],d]);total+=d;}
  const out=[];if(!total)return out;let idx=0,acc=0;for(let k=0;k<N;k++){const target=total*k/(N-1);while(idx<segs.length-1&&acc+segs[idx][2]<target){acc+=segs[idx][2];idx++;}const sg=segs[idx],f=sg[2]? (target-acc)/sg[2]:0;out.push([sg[0][0]+(sg[1][0]-sg[0][0])*f,sg[0][1]+(sg[1][1]-sg[0][1])*f]);}return out;}
const MORPH_N=260;
PRESETS.forEach(p=>{p.strokes=p.make();p.sample=resample(p.strokes,MORPH_N);});

// ---------- state ----------
let cur=0,palette=0,playing=!reduced,choreo=true,drawMode=false,soundOn=false;
let phase=0,morph=null,lastChange=performance.now(),beatCount=0,lastBeat=performance.now();
let drawPts=[],drawing=false,pointsThisFrame=0;
const BEAT_MS=60000/72, HOLD_MS=5600;
function setMsg(t){msgEl.textContent=t;}
function updateHud(){presetNameEl.textContent=PRESETS[cur].label.replace(/^\S+\s/,"");paletteNameEl.textContent=PALETTES[palette].name;modeNameEl.textContent=drawMode?"Draw":(playing?(choreo?"Auto-choreograph":"Timeline"):"Paused");
  document.querySelectorAll(".presetBtn").forEach((b,i)=>b.setAttribute("aria-pressed",String(i===cur&&!drawMode)));playBtn.setAttribute("aria-pressed",String(playing));playBtn.textContent=playing?"⏸ Pause timeline":"▶ Play timeline";}
PRESETS.forEach((p,i)=>{const b=document.createElement("button");b.type="button";b.className="presetBtn";b.textContent=p.label;b.onclick=()=>goTo(i,"Preset: "+p.label);presetsBar.appendChild(b);});

const PENTA=[523.25,587.33,659.25,783.99,880.0];
let audio=null,chimeIdx=0;
function chime(){if(!soundOn)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();if(audio.state==="suspended")audio.resume();const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type="sine";o.frequency.value=PENTA[chimeIdx++%PENTA.length];g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.045,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+0.8);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+0.85);}catch(e){/* optional */}}

function goTo(next,why){if(next===cur&&!morph){updateHud();return;}const from=PRESETS[cur].sample;cur=((next%PRESETS.length)+PRESETS.length)%PRESETS.length;
  if(reduced){morph=null;}else morph={from:from.slice(),to:PRESETS[cur].sample,t:0};
  palette=(palette+1)%PALETTES.length;lastChange=performance.now();chime();if(why)setMsg(why+" — morphing, palette "+PALETTES[palette].name+".");updateHud();}
function nextPreset(auto){if(choreo&&auto){let n=cur;while(n===cur)n=Math.floor(Math.random()*PRESETS.length);goTo(n,"🥁 Auto-choreograph");}
  else goTo(cur+1,auto?"Timeline":"Next");}

// ---------- controls ----------
playBtn.onclick=()=>{playing=!playing;if(playing)lastChange=performance.now();setMsg(playing?"Timeline playing — fake beams only, always.":"Paused. Tap a preset, draw, or press Play.");updateHud();};
choreoBtn.onclick=()=>{choreo=!choreo;choreoBtn.setAttribute("aria-pressed",String(choreo));choreoBtn.textContent=choreo?"🥁 Auto-choreograph: On":"🥁 Auto-choreograph: Off";setMsg(choreo?"Auto-choreograph on: every 8 beats (72 BPM) the show picks the next shape + palette.":"Auto-choreograph off: timeline walks presets in order.");updateHud();};
drawBtn.onclick=()=>{drawMode=!drawMode;drawBtn.setAttribute("aria-pressed",String(drawMode));if(drawMode){setMsg("Draw mode: drag on the dark stage — the fake beam follows your finger and fades like light.");}else setMsg("Draw mode off.");updateHud();};
paletteBtn.onclick=()=>{palette=(palette+1)%PALETTES.length;setMsg("Palette: "+PALETTES[palette].name);updateHud();};
soundBtn.onclick=()=>{soundOn=!soundOn;soundBtn.setAttribute("aria-pressed",String(soundOn));soundBtn.textContent=soundOn?"🔔 Sound On":"🔕 Sound Off";if(soundOn)chime();else if(audio)audio.close().then(()=>audio=null).catch(()=>{});};
speedEl.addEventListener("input",()=>{speedVal.textContent=(+speedEl.value).toFixed(2).replace(/0+$/,"").replace(/\.$/,".0")+"×";});
glowEl.addEventListener("input",()=>{glowVal.textContent=glowEl.value;});
cv.addEventListener("pointerdown",e=>{if(!drawMode)return;drawing=true;cv.setPointerCapture(e.pointerId);pushDraw(e);});
cv.addEventListener("pointermove",e=>{if(drawing&&drawMode)pushDraw(e);});
cv.addEventListener("pointerup",()=>{drawing=false;});cv.addEventListener("pointercancel",()=>{drawing=false;});
function pushDraw(e){const r=cv.getBoundingClientRect();drawPts.push({x:e.clientX-r.left,y:e.clientY-r.top,life:1});if(drawPts.length>420)drawPts.shift();}

// ---------- drawing ----------
function toXY(p){const s=Math.min(W,H)*0.40;return [W/2+p[0]*s,H/2+p[1]*s];}
function strokePath(strokes,frac,color,glow,pulse){
  // total length in point-index terms for a simple, even trace
  const flat=[];strokes.forEach((st,si)=>{st.forEach((p,i)=>flat.push({p,pen:i===0}));});
  const upto=Math.max(2,Math.floor(flat.length*frac));pointsThisFrame+=upto;
  ctx.save();ctx.lineJoin="round";ctx.lineCap="round";ctx.strokeStyle=color;ctx.fillStyle=color;
  ctx.shadowColor=color;ctx.shadowBlur=tier===2?0:glow*pulse;ctx.lineWidth=tier===2?1.8:2.4;
  ctx.beginPath();let started=false,head=null;
  for(let i=0;i<upto;i++){const [x,y]=toXY(flat[i].p);if(flat[i].pen){ctx.moveTo(x,y);started=true;}else if(!started){ctx.moveTo(x,y);started=true;}else ctx.lineTo(x,y);head=[x,y];}
  ctx.stroke();
  if(head){ctx.beginPath();ctx.arc(head[0],head[1],tier===2?2.5:3.5,0,6.283);ctx.fill();}
  ctx.restore();return head;}
function drawMorph(m,color,glow){pointsThisFrame+=MORPH_N;ctx.save();ctx.lineJoin="round";ctx.lineCap="round";ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=tier===2?0:glow;ctx.lineWidth=2.2;ctx.beginPath();
  const ease=m.t<.5?2*m.t*m.t:1-Math.pow(-2*m.t+2,2)/2;
  for(let i=0;i<MORPH_N;i++){const a=m.from[i],b=m.to[i],p=[a[0]+(b[0]-a[0])*ease,a[1]+(b[1]-a[1])*ease];const [x,y]=toXY(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.restore();}

// ---------- main loop + Lab auto-degrade ----------
let lastTs=0,fpsEMA=60,frameEMA=16,labT=0,slowT=0;
function loop(ts){const now=ts||0,dt=Math.min(80,now-(lastTs||now));lastTs=now;
  if(dt>0){fpsEMA=fpsEMA*0.92+(1000/Math.max(dt,1))*0.08;frameEMA=frameEMA*0.92+dt*0.08;}
  const speed=+speedEl.value,glowBase=+glowEl.value;
  // beat timer
  if(playing&&!drawMode&&now-lastBeat>=BEAT_MS){lastBeat=now;beatCount++;}
  if(playing&&!reduced&&!drawMode){
    if(morph){morph.t+=dt/(900/Math.max(speed,0.01));if(morph.t>=1)morph=null;}
    else {phase+=dt*0.00012*speed;if(phase>=1)phase=0;
      if(now-lastChange>HOLD_MS/Math.max(speed,0.01))nextPreset(true);
      if(choreo&&beatCount>=8){beatCount=0;nextPreset(true);}}
  }
  // fade trail (fake-beam persistence)
  ctx.fillStyle=reduced?"#01020a":"rgba(1,2,10,0.20)";ctx.fillRect(0,0,W,H);
  pointsThisFrame=0;
  const pal=PALETTES[palette],pulse=reduced?1:1+0.12*Math.sin(now/ (BEAT_MS/2) * Math.PI);
  const color=pal.colors[Math.floor(now/1400)%pal.colors.length];
  if(drawMode){
    // redraw fading draw trails
    ctx.save();ctx.lineJoin="round";ctx.lineCap="round";
    for(let i=1;i<drawPts.length;i++){const p=drawPts[i];ctx.globalAlpha=Math.max(0,p.life)*0.9;ctx.strokeStyle=pal.colors[i%pal.colors.length];ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=tier===2?0:glowBase;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(drawPts[i-1].x,drawPts[i-1].y);ctx.lineTo(p.x,p.y);ctx.stroke();pointsThisFrame++;}
    ctx.restore();ctx.globalAlpha=1;
    if(!reduced)for(const p of drawPts)p.life-=dt/1600;drawPts=drawPts.filter(p=>p.life>0);
  } else if(morph){drawMorph(morph,color,glowBase);}
  else strokePath(PRESETS[cur].strokes,reduced?1:phase,color,glowBase,pulse);
  // Lab update + auto-degrade
  labT+=dt;
  if(labT>500){labT=0;fpsEl.textContent=Math.round(fpsEMA);frameMsEl.textContent=frameEMA.toFixed(1);ptsEl.textContent=pointsThisFrame;tierEl.textContent=TIERS[tier];beatEl.textContent=choreo?String(beatCount%8+1)+" / 8":"off";
    if(fpsEMA<45&&tier<2){slowT++;if(slowT>=3){tier++;slowT=0;size();setMsg("Lab: frame rate dipped, so I softened the glow/pixels (tier "+TIERS[tier]+") to stay smooth on phones.");}}else slowT=0;}
  if(!reduced)requestAnimationFrame(loop);}
size();updateHud();
if(reduced){ // one static frame
  ctx.fillStyle="#01020a";ctx.fillRect(0,0,W,H);strokePath(PRESETS[cur].strokes,1,PALETTES[palette].colors[0],+glowEl.value,1);
  // still allow preset taps to redraw statically
  const orig=goTo; // goTo already handles reduced (morph=null)
  setInterval(()=>{ctx.fillStyle="#01020a";ctx.fillRect(0,0,W,H);strokePath(PRESETS[cur].strokes,1,PALETTES[palette].colors[0],+glowEl.value,1);},600);
  setMsg("Reduced motion respected: still shapes — tap a preset to change the shape.");
} else requestAnimationFrame(loop);
