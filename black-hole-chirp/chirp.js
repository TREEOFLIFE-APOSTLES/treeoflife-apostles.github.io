(()=>{const P=document.getElementById('plot'),px=P.getContext('2d'),O=document.getElementById('orb'),ox=O.getContext('2d'),hz=document.getElementById('hz');
let D=null,cur=-1,anim=null;
// GW freq model (Newtonian chirp), tc = time to merger (s)
const fgw=tau=>Math.min(250,Math.max(30,134*Math.pow(Math.max(tau,1e-3)/0.0317,-3/8)*0.53));
function plot(){if(!D)return;const W=P.width,H=P.height,n=D.H1.length;px.clearRect(0,0,W,H);
 px.strokeStyle='#223';px.beginPath();px.moveTo(0,H/2);px.lineTo(W,H/2);px.stroke();
 const sh=Math.round(0.007*D.fs);[['L1','#5ee6d0',-1,sh],['H1','#ffd27a',1,0]].forEach(([k,c,s,o])=>{px.strokeStyle=c;px.lineWidth=2.5;px.beginPath();
  for(let i=0;i<n;i++){const j=i+o;if(j>=n)break;const x=i/n*W,y=H/2-s*D[k][j]*H*0.45;i?px.lineTo(x,y):px.moveTo(x,y)}px.stroke()});
 if(cur>=0){px.strokeStyle='#fff8';px.beginPath();px.moveTo(cur*W,0);px.lineTo(cur*W,H);px.stroke()}
 px.fillStyle='#ece8ff';px.font='24px system-ui';px.fillText('−0.6 s',8,H-10);px.fillText('merger',W*0.857-40,26);px.fillText('+0.1 s',W-80,H-10)}
function orb(tau){const W=O.width,c=W/2;ox.fillStyle='#0a0d2a';ox.fillRect(0,0,W,W);
 for(let i=0;i<60;i++){ox.fillStyle='#fff3';ox.fillRect((i*137)%W,(i*271)%W,2,2)}
 if(tau>0){const r=Math.max(18,300*Math.pow(tau/1.5,0.25)),ph=-2*Math.PI*Math.pow(Math.max(tau,1e-3),5/8)*60;
  for(let k=1;k<6;k++){ox.strokeStyle=`rgba(255,210,122,${0.25/k})`;ox.lineWidth=3;ox.beginPath();ox.arc(c,c,r+k*((1-tau/1.5)*40+20)+ (Date.now()/8)%40,0,7);ox.stroke()}
  const m1=36,m2=29,a1=r*m2/65,a2=r*m1/65;bh(c+a1*Math.cos(ph),c+a1*Math.sin(ph),40);bh(c-a2*Math.cos(ph),c-a2*Math.sin(ph),34)}
 else{const g=Math.min(1,-tau*4);for(let k=1;k<8;k++){ox.strokeStyle=`rgba(94,230,208,${(1-g)*0.5/k})`;ox.lineWidth=4;ox.beginPath();ox.arc(c,c,60+k*50*(0.3+g*3),0,7);ox.stroke()}bh(c,c,52)}}
function bh(x,y,r){const g=ox.createRadialGradient(x,y,r*0.6,x,y,r*1.8);g.addColorStop(0,'#000');g.addColorStop(0.45,'#000');g.addColorStop(0.6,'#ffb347aa');g.addColorStop(1,'#ffb34700');ox.fillStyle=g;ox.beginPath();ox.arc(x,y,r*1.8,0,7);ox.fill()}
async function play(file,speed){if(anim)return;const ac=new (window.AudioContext||window.webkitAudioContext)();
 const buf=await ac.decodeAudioData(await (await fetch(file)).arrayBuffer());const s=ac.createBufferSource();s.buffer=buf;s.connect(ac.destination);
 const st=ac.currentTime+0.05;s.start(st);const dur=buf.duration;// file spans -1.5..+0.5 s in event time
 const step=()=>{const tt=(ac.currentTime-st)/dur*2-1.5,tau=-tt;
  if(tt>=-1.5){orb(tau);cur=(tt+0.6)/0.7;cur=cur<0||cur>1?-1:cur;plot();hz.textContent=tau>0?`Gravitational-wave frequency: ~${Math.round(fgw(tau))} Hz`+(speed>1?` (you hear ~${Math.round(fgw(tau)*speed)} Hz)`:''):'Merged: one black hole of about 62 Suns 🌌'}
  if(tt<0.6)anim=requestAnimationFrame(step);else{anim=null;cur=-1;plot();ac.close()}};step()}
document.getElementById('play').onclick=()=>play('gw150914_H1_pitchup.wav',4);
document.getElementById('real').onclick=()=>play('gw150914_H1.wav',1);
fetch('chirp.json').then(r=>r.json()).then(j=>{D=j;plot()});orb(1.5);
})();
