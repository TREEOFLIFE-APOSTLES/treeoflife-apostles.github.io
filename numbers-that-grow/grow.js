const $=id=>document.getElementById(id),GOLD='#ffd27a',TEAL='#5ee6d0',PINK='#ff8fc8',GREEN='#8fe08a';
function ctx(id){const c=$(id),x=c.getContext('2d');return [c,x];}
// 1 triangles
let triMode='t';
function drawTri(){const [c,x]=ctx('tri'),n=+$('trir').value;$('trin').textContent=n;x.clearRect(0,0,600,600);
 const cols=triMode=='t'?n:n+1,rows=n,cell=Math.min(540/cols,540/rows),r=cell*0.38,ox=(600-cols*cell)/2,oy=(600-rows*cell)/2;
 const dot=(i,j,col)=>{x.fillStyle=col;x.beginPath();x.arc(ox+(j+.5)*cell,oy+(i+.5)*cell,r,0,7);x.fill();};
 const T=k=>k*(k+1)/2;let h;
 if(triMode=='t'){for(let i=0;i<n;i++)for(let j=0;j<=i;j++)dot(i,j,GOLD);h=`T${n} = ${T(n)}`;}
 else if(triMode=='s'){const s=n;const cs=540/s,o=(600-s*cs)/2;for(let i=0;i<s;i++)for(let j=0;j<s;j++){x.fillStyle=j<=i?GOLD:TEAL;x.beginPath();x.arc(o+(j+.5)*cs,o+(i+.5)*cs,cs*.38,0,7);x.fill();}
  h=`T${n-1} + T${n} = ${T(n-1)} + ${T(n)} = ${n*n} = ${n}²`;}
 else{for(let i=0;i<n;i++)for(let j=0;j<=n;j++)dot(i,j,j<=i?GOLD:PINK);h=`2 × T${n} = 2 × ${T(n)} = ${n} × ${n+1} = ${n*(n+1)}`;}
 $('trih').textContent=h;}
document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{triMode=b.dataset.m;document.querySelectorAll('[data-m]').forEach(o=>o.classList.toggle('on',o==b));drawTri();});
$('trir').oninput=drawTri;
// 2 squares & cubes
function drawSq(){const [c,x]=ctx('sq'),n=+$('sqr').value;$('sqn').textContent=n;x.clearRect(0,0,600,600);
 const s=250/n,o=25,oy=175;for(let i=0;i<n;i++)for(let j=0;j<n;j++){x.fillStyle=(i==n-1||j==n-1)?GOLD:TEAL;x.fillRect(o+j*s+1,oy+i*s+1,s-2,s-2);}
 // isometric cube
 const a=130/n,cx=450,cy=250,P=(i,j,k)=>[cx+(i-j)*a*.87,cy+(i+j)*a*.5-k*a];
 const face=(pts,col)=>{x.fillStyle=col;x.strokeStyle='#0a0d2a';x.beginPath();pts.forEach((p,q)=>q?x.lineTo(...p):x.moveTo(...p));x.closePath();x.fill();x.stroke();};
 for(let k=0;k<n;k++)for(let i=0;i<n;i++)for(let j=0;j<n;j++){if(i<n-1&&j<n-1&&k<n-1)continue;
  face([P(i,j,k+1),P(i+1,j,k+1),P(i+1,j+1,k+1),P(i,j+1,k+1)],GOLD);
  face([P(i,j+1,k),P(i+1,j+1,k),P(i+1,j+1,k+1),P(i,j+1,k+1)],'#c99a3c');
  face([P(i+1,j,k),P(i+1,j+1,k),P(i+1,j+1,k+1),P(i+1,j,k+1)],'#8a6a2a');}
 x.fillStyle='#ece8ff';x.font='28px Georgia';x.textAlign='center';x.fillText(`${n}² = ${n*n}`,150,470);x.fillText(`${n}³ = ${n**3}`,450,470);
 let odd=[];for(let k=1;k<=n;k++)odd.push(2*k-1);$('sqh').textContent=`${odd.join(' + ')} = ${n*n}`;}
$('sqr').oninput=drawSq;
// 3 fibonacci
let fn=6;
function drawFib(){const [c,x]=ctx('fib');$('fibn').textContent=fn;x.clearRect(0,0,600,600);
 const F=[1,1];while(F.length<fn)F.push(F[F.length-1]+F[F.length-2]);
 // build squares in unit coords, spiralling: right, up, left, down
 let sq=[{x:0,y:0,s:1}],minx=0,miny=0,maxx=1,maxy=1;
 for(let i=1;i<fn;i++){const s=F[i],d=i%4;let q;
  if(d==1)q={x:maxx,y:miny,s};else if(d==2)q={x:minx,y:miny-s,s};else if(d==3)q={x:minx-s,y:miny,s};else q={x:minx,y:maxy,s};
  if(i==1)q={x:1,y:0,s:1};sq.push(q);minx=Math.min(minx,q.x);miny=Math.min(miny,q.y);maxx=Math.max(maxx,q.x+s);maxy=Math.max(maxy,q.y+s);}
 const k=540/Math.max(maxx-minx,maxy-miny),ox=(600-(maxx-minx)*k)/2-minx*k,oy=(600-(maxy-miny)*k)/2-miny*k;
 const cols=[TEAL,GOLD,PINK,GREEN,'#a99cff'];
 sq.forEach((q,i)=>{x.fillStyle=cols[i%5]+'33';x.strokeStyle=cols[i%5];x.lineWidth=2;x.fillRect(ox+q.x*k,oy+q.y*k,q.s*k,q.s*k);x.strokeRect(ox+q.x*k,oy+q.y*k,q.s*k,q.s*k);
  if(q.s*k>22){x.fillStyle='#ece8ff';x.font=`${Math.min(40,q.s*k/3)}px Georgia`;x.textAlign='center';x.textBaseline='middle';x.fillText(q.s,ox+(q.x+q.s/2)*k,oy+(q.y+q.s/2)*k);}});
 // arcs: corner choice per direction
 x.strokeStyle='#fff';x.lineWidth=3;x.beginPath();
 sq.forEach((q,i)=>{const d=i==0?0:(i%4);let cx,cy,a0;const L=q.x,T=q.y,R=q.x+q.s,B=q.y+q.s;
  if(d==0){cx=R;cy=T;a0=Math.PI/2;} // centre top-right, arc from bottom to left
  if(d==1){cx=L;cy=T;a0=0;}
  if(d==2){cx=L;cy=B;a0=-Math.PI/2;}
  if(d==3){cx=R;cy=B;a0=Math.PI;}
  x.moveTo(ox+(cx+q.s*Math.cos(a0))*k,oy+(cy+q.s*Math.sin(a0))*k);x.arc(ox+cx*k,oy+cy*k,q.s*k,a0,a0+Math.PI/2);});
 x.stroke();
 const r=fn>1?F[fn-1]/F[fn-2]:1;$('fibh').textContent=`${F.join(', ')}   ·   ${F[fn-1]}/${fn>1?F[fn-2]:1} = ${r.toFixed(6)} (φ ≈ 1.618034)`;}
$('fibp').onclick=()=>{if(fn<14){fn++;drawFib();}};$('fibm').onclick=()=>{if(fn>1){fn--;drawFib();}};
// 4 seeds
function drawSeed(){const [c,x]=ctx('seed'),n=+$('seedr').value,ang=+$('angr').value;$('seedn').textContent=n;$('angn').textContent=ang.toFixed(2);x.clearRect(0,0,600,600);
 const sc=280/Math.sqrt(n),rr=Math.max(2,sc*.45);
 for(let i=0;i<n;i++){const t=i*ang*Math.PI/180,r=sc*Math.sqrt(i);x.fillStyle=`hsl(${40+60*i/n},90%,${55+15*Math.sin(i)}%)`;x.beginPath();x.arc(300+r*Math.cos(t),300+r*Math.sin(t),rr,0,7);x.fill();}}
$('seedr').oninput=drawSeed;$('angr').oninput=drawSeed;$('angg').onclick=()=>{$('angr').value=137.51;drawSeed();};
// 5 tree
function drawTree(){const [c,x]=ctx('tree'),d=+$('treer').value,sp=+$('sprr').value*Math.PI/180;$('treen').textContent=d;$('sprn').textContent=$('sprr').value;x.clearRect(0,0,600,600);
 // trunk length so total height fits: L*(1+.72+.72^2..)<=520
 const L=150;x.lineCap='round';
 const br=(px,py,a,len,lv)=>{const nx=px+len*Math.sin(a),ny=py-len*Math.cos(a);const f=lv/(d||1);
  x.strokeStyle=lv==d&&d>0?GREEN:`hsl(${35+60*f},70%,${45+15*f}%)`;x.lineWidth=Math.max(1,10*Math.pow(.72,lv));x.beginPath();x.moveTo(px,py);x.lineTo(nx,ny);x.stroke();
  if(lv<d){br(nx,ny,a-sp,len*.72,lv+1);br(nx,ny,a+sp,len*.72,lv+1);}else if(d>0){x.fillStyle=GOLD;x.beginPath();x.arc(nx,ny,2.5,0,7);x.fill();}};
 br(300,585,0,L,0);$('treeh').textContent=`depth ${d}: ${2**d} tips, ${2**(d+1)-1} branches`;}
$('treer').oninput=drawTree;$('sprr').oninput=drawTree;
// 6 lambdoma
const N=8;let AC;const g=(a,b)=>b?g(b,a%b):a;
function drawLam(hi){const [c,x]=ctx('lam');x.clearRect(0,0,600,600);const s=580/N,o=10;
 for(let m=1;m<=N;m++)for(let n=1;n<=N;n++){const v=m/n,gg=g(m,n),i=m-1,j=n-1;
  x.fillStyle=v==1?GOLD+'aa':hi&&hi[0]==m&&hi[1]==n?TEAL:`hsl(${200+Math.log2(v)*40},50%,${18+8*(gg==1)}%)`;x.fillRect(o+j*s+1,o+i*s+1,s-2,s-2);
  x.fillStyle='#ece8ff';x.font=`${s*.3}px Georgia`;x.textAlign='center';x.textBaseline='middle';x.fillText(`${m}/${n}`,o+(j+.5)*s,o+(i+.5)*s);}}
$('lam').onclick=e=>{const c=$('lam'),b=c.getBoundingClientRect(),px=(e.clientX-b.left)*600/b.width,py=(e.clientY-b.top)*600/b.height,s=580/N;
 const n=Math.floor((px-10)/s)+1,m=Math.floor((py-10)/s)+1;if(m<1||n<1||m>N||n>N)return;
 const names={'1':'unison','2':'octave','1.5':'perfect fifth','1.3333':'perfect fourth','0.5':'octave below','0.6667':'fifth below','0.75':'fourth below','1.25':'major third','1.2':'minor third'};
 const v=m/n,f=220*v,nm=names[(+v.toFixed(4)).toString()]||'';$('lamh').textContent=`${m}/${n} = ${v.toFixed(4)} → ${f.toFixed(1)} Hz ${nm?'· '+nm:''}`;drawLam([m,n]);
 try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime,os=AC.createOscillator(),gn=AC.createGain();os.type='sine';os.frequency.value=f;gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(.2,t+.03);gn.gain.exponentialRampToValueAtTime(.001,t+1.2);os.connect(gn).connect(AC.destination);os.start(t);os.stop(t+1.3);}catch(_){}};
drawTri();drawSq();drawFib();drawSeed();drawTree();drawLam();
