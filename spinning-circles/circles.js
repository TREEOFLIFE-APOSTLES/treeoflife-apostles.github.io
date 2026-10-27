// Spinning Circles: original code by 589/kin. Fourier epicycles, one chain per boundary.
(function(){
const M=512, TAU=Math.PI*2;
function circ(cx,cy,r,rev){const p=[];for(let i=0;i<200;i++){const a=(rev?-1:1)*TAU*i/200;p.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}return p;}
// resample a closed polygon to M points evenly by arc length
function resample(p){const L=[0];for(let i=1;i<=p.length;i++){const a=p[i-1],b=p[i%p.length];L.push(L[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1]));}
 const T=L[p.length],o=[];let j=0;for(let i=0;i<M;i++){const s=T*i/M;while(L[j+1]<s)j++;const a=p[j],b=p[(j+1)%p.length],f=(s-L[j])/((L[j+1]-L[j])||1);o.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]);}return o;}
function tree(){ // canopy: scalloped circle, trunk with roots below
 const p=[],cy=-0.25;
 const a0=Math.PI/2+0.16,a1=Math.PI/2-0.16+TAU; // gap at bottom for trunk
 // trunk right side going up from root
 p.push([0.45,0.95],[0.2,0.82],[0.13,0.62]);
 for(let i=0;i<=300;i++){const a=a0+(a1-a0)*i/300;const r=0.62+0.05*Math.cos(9*(a-Math.PI/2));p.push([r*Math.cos(a),cy+r*Math.sin(a)]);}
 p.push([-0.13,0.62],[-0.2,0.82],[-0.45,0.95],[0,0.9]);
 return [p, circ(-0.25,-0.4,0.12,1), circ(0.25,-0.4,0.12,1), circ(0,-0.02,0.12,1)];}
function inf(){ // union of two circles (outer) + two holes
 const p=[],R=0.5,c=0.42,w=Math.acos(c/R);
 for(let i=0;i<=200;i++){const a=w+(TAU-2*w)*i/200;p.push([c+R*Math.cos(a+Math.PI),R*Math.sin(a+Math.PI)]);}
 for(let i=0;i<=200;i++){const a=w+(TAU-2*w)*i/200;p.push([-c+R*Math.cos(a),R*Math.sin(a)]);}
 return [p.map(q=>[q[0]*1.6,q[1]*1.6]),circ(-0.72,0,0.32,0),circ(0.72,0,0.32,0)];}
function heart(){const p=[];for(let i=0;i<400;i++){const t=TAU*i/400;p.push([16*Math.pow(Math.sin(t),3)/18,-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/18+0.05]);}return [p];}
function dft(pts){const c=[];for(let k=-M/2;k<M/2;k++){let re=0,im=0;for(let n=0;n<M;n++){const a=-TAU*k*n/M,x=pts[n][0],y=pts[n][1];re+=x*Math.cos(a)-y*Math.sin(a);im+=x*Math.sin(a)+y*Math.cos(a);}c.push({k,re:re/M,im:im/M,r:Math.hypot(re,im)/M});}return c.sort((a,b)=>b.r-a.r);}
const SH={tree,inf,heart},cache={};
function load(name){if(!cache[name]){cache[name]=SH[name]().map(b=>{const s=resample(b);return {pts:s,co:dft(s)};});}return cache[name];}
const cv=document.getElementById('c'),g=cv.getContext('2d'),nIn=document.getElementById('n'),spIn=document.getElementById('sp'),pp=document.getElementById('pp'),info=document.getElementById('info');
let shape='tree',chains=load(shape),N=8,t=0,play=true,trails=[],last=performance.now();
const COL=['#ffd27a','#5ee6d0','#8fe388','#ff9fc3'];
function reset(){chains=load(shape);trails=chains.map(()=>[]);t=0;N=1<<(+nIn.value);document.getElementById('nv').textContent=N;
 let err=0,tot=0;chains.forEach(ch=>{ch.co.forEach((c,i)=>{tot+=c.r*c.r;if(i>=N)err+=c.r*c.r;});});
 info.textContent=chains.length+(chains.length>1?' chains':' chain')+' × '+N+' circles · energy kept '+(100*(1-err/tot)).toFixed(2)+'%';}
function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;if(play){t+=dt*0.12*(+spIn.value);if(t>=1){t-=1;trails=chains.map(()=>[]);}}
 const W=cv.width,S=W*0.42,O=W/2;g.clearRect(0,0,W,W);
 g.lineWidth=6;g.strokeStyle='rgba(255,210,122,0.12)';chains.forEach(ch=>{g.beginPath();ch.pts.forEach((p,i)=>i?g.lineTo(O+p[0]*S,O+p[1]*S):g.moveTo(O+p[0]*S,O+p[1]*S));g.closePath();g.stroke();});
 chains.forEach((ch,ci)=>{let x=0,y=0;const cs=ch.co.slice(0,N);
  cs.sort((a,b)=>Math.abs(a.k)-Math.abs(b.k));
  g.lineWidth=1;
  for(const c of cs){const a=TAU*c.k*t+Math.atan2(c.im,c.re),nx=x+c.r*Math.cos(a),ny=y+c.r*Math.sin(a);
   if(c.k!==0){g.strokeStyle='rgba(236,232,255,0.18)';g.beginPath();g.arc(O+x*S,O+y*S,c.r*S,0,TAU);g.stroke();g.strokeStyle='rgba(94,230,208,0.55)';g.beginPath();g.moveTo(O+x*S,O+y*S);g.lineTo(O+nx*S,O+ny*S);g.stroke();}
   x=nx;y=ny;}
  const tr=trails[ci];if(play)tr.push([x,y]);
  g.lineWidth=3;g.strokeStyle=COL[ci%4];g.beginPath();tr.forEach((p,i)=>i?g.lineTo(O+p[0]*S,O+p[1]*S):g.moveTo(O+p[0]*S,O+p[1]*S));g.stroke();
  g.fillStyle='#fff';g.beginPath();g.arc(O+x*S,O+y*S,4,0,TAU);g.fill();});
 requestAnimationFrame(frame);}
document.querySelectorAll('#shapes button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#shapes button').forEach(x=>x.classList.remove('on'));b.classList.add('on');shape=b.dataset.s;reset();});
nIn.oninput=reset;pp.onclick=()=>{play=!play;pp.textContent=play?'Pause':'Play';};
reset();requestAnimationFrame(frame);
})();
