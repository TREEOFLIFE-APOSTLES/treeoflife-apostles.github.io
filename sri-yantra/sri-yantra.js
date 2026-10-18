(function(){
"use strict";
var cv=document.getElementById("c"),cx=cv.getContext("2d"),st=document.getElementById("stage"),sl=document.getElementById("s"),lb=document.getElementById("lbl");
var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var W,H,R,dpr,t0=performance.now(),manual=-1,dragging=false,moved=false;
var stars=[];for(var i=0;i<90;i++)stars.push([Math.random(),Math.random(),Math.random()*1.4+.3,Math.random()*6]);
// Nine interlocking triangles, original stylised coordinates in units of R.
// Each entry: [direction (+1 apex up / -1 apex down), apexY, baseY, baseHalfWidth]
// Canvas y grows downward, so an upward triangle has apexY < baseY.
var TRI=[
 [ 1,-0.96, 0.55,0.84],
 [-1, 0.96,-0.55,0.84],
 [ 1,-0.78, 0.72,0.64],
 [-1, 0.78,-0.72,0.64],
 [ 1,-0.42, 0.40,0.54],
 [-1, 0.50,-0.32,0.58],
 [ 1,-0.24, 0.60,0.34],
 [-1, 0.26,-0.50,0.40],
 [-1, 0.14,-0.18,0.22]
];
function label(n){
 if(n===0)return "0 of 9 · No triangles yet";
 var d=TRI[n-1][0]>0?"Upward triangle":"Downward triangle";
 var up=0;for(var i=0;i<n;i++)if(TRI[i][0]>0)up++;
 return n+" of 9 · "+d+" ("+up+" up · "+(n-up)+" down"+(n===9?" · the weave is complete":"")+")";
}
function size(){dpr=Math.min(window.devicePixelRatio||1,2);W=st.clientWidth;H=st.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0);R=Math.min(W,H)/2.75;}
window.addEventListener("resize",size);size();
function ease(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
function pts(t){
 var apex=[0,t[1]*R],half=t[3]*R,by=t[2]*R;
 return [apex,[-half,by],[half,by]];
}
function drawTri(t,prog,mx,my){
 if(prog<=0)return;
 var p=pts(t),col=t[0]>0?"#ffd27a":"#5ee6d0";
 var total=prog*3;
 cx.beginPath();cx.strokeStyle=col;cx.lineWidth=1.8;cx.shadowColor=col;cx.shadowBlur=12;cx.lineJoin="round";
 for(var side=0;side<3;side++){
  var a=p[side],b=p[(side+1)%3],f=Math.max(0,Math.min(1,total-side));
  if(f<=0)break;
  cx.moveTo(mx+a[0],my+a[1]);cx.lineTo(mx+a[0]+(b[0]-a[0])*f,my+a[1]+(b[1]-a[1])*f);
 }
 cx.stroke();cx.shadowBlur=0;
}
function drawFrame(a,mx,my){
 if(a<=0)return;
 cx.save();cx.globalAlpha=a;cx.strokeStyle="#ffd27a";cx.lineWidth=2;cx.shadowColor="#ffd27a";cx.shadowBlur=10;
 var s=1.18*R,g=0.16*R,w=0.30*R;
 // circle
 cx.beginPath();cx.arc(mx,my,R,0,Math.PI*2);cx.stroke();
 cx.beginPath();cx.arc(mx,my,1.06*R,0,Math.PI*2);cx.globalAlpha=a*.55;cx.stroke();cx.globalAlpha=a;
 // Drawn explicitly for clarity: outer square, interrupted at gate centres, plus gate steps.
 var S=s;
 cx.beginPath();
 // top side (gate at top centre, stepping outward/up)
 cx.moveTo(mx-S,my-S);cx.lineTo(mx-w,my-S);cx.lineTo(mx-w,my-S-g);cx.lineTo(mx+w,my-S-g);cx.lineTo(mx+w,my-S);cx.lineTo(mx+S,my-S);
 // right side
 cx.lineTo(mx+S,my-w);cx.lineTo(mx+S+g,my-w);cx.lineTo(mx+S+g,my+w);cx.lineTo(mx+S,my+w);cx.lineTo(mx+S,my+S);
 // bottom side
 cx.lineTo(mx+w,my+S);cx.lineTo(mx+w,my+S+g);cx.lineTo(mx-w,my+S+g);cx.lineTo(mx-w,my+S);cx.lineTo(mx-S,my+S);
 // left side
 cx.lineTo(mx-S,my+w);cx.lineTo(mx-S-g,my+w);cx.lineTo(mx-S-g,my-w);cx.lineTo(mx-S,my-w);cx.closePath();
 cx.stroke();
 cx.restore();
}
var PER=0.85,FRAMEAT=TRI.length*PER;
function frame(now){
 var t=(now-t0)/1000;
 var count,frameA;
 if(manual>=0){count=manual;frameA=manual>=9?1:0;}
 else if(reduce){count=9;frameA=1;}
 else{
  count=0;frameA=ease((t-FRAMEAT)/1.2);
  for(var i=0;i<9;i++){
   var p=(t-i*PER)/PER;
   if(p>0)count=i+ease(Math.min(1,p));
  }
  if(t<FRAMEAT)frameA=0;
 }
 var shown=Math.floor(count);
 if(manual>=0)lb.textContent=label(manual);
 else if(reduce)lb.textContent=label(9);
 if(manual<0&&!reduce&&t<FRAMEAT)lb.textContent=label(Math.min(9,Math.max(0,Math.ceil(count))));
 if(manual<0&&!reduce&&t>=FRAMEAT)lb.textContent="9 of 9 · Circle and gated frame · the bindu glows";
 if(manual<0)sl.value=Math.min(9,Math.round(count));
 cx.clearRect(0,0,W,H);
 for(var j=0;j<stars.length;j++){var s2=stars[j],al=reduce?.6:.35+.35*Math.sin(t*.8+s2[3]);cx.fillStyle="rgba(233,230,255,"+al+")";cx.fillRect(s2[0]*W,s2[1]*H,s2[2],s2[2]);}
 var mx=W/2,my=H/2;
 // frame behind triangles when complete, so the weave stays on top
 if(frameA>0)drawFrame(frameA,mx,my);
 for(var k=0;k<9;k++){
  var prog;
  if(manual>=0)prog=k<manual?1:0;
  else if(reduce)prog=1;
  else prog=ease((t-k*PER)/PER);
  drawTri(TRI[k],prog,mx,my);
 }
 // bindu: gentle gold pulse at the centre once triangles are present
 var complete=manual>=0?manual>=9:(reduce||t>=FRAMEAT);
 var any=manual>=0?manual>0:(reduce||count>0);
 if(any){
  var pulse=reduce?.5:.5+.5*Math.sin(t*1.6),br=(complete?5:3.5)+2*pulse;
  cx.save();cx.beginPath();cx.arc(mx,my,br,0,Math.PI*2);cx.fillStyle="#ffd27a";cx.shadowColor="#ffd27a";cx.shadowBlur=complete?16+18*pulse:8;cx.fill();cx.restore();
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
st.addEventListener("pointerdown",function(e){dragging=true;moved=false;st.setPointerCapture(e.pointerId);});
st.addEventListener("pointermove",function(e){
 if(!dragging)return;
 var r=st.getBoundingClientRect(),x=e.clientX-r.left;
 if(Math.abs(x-W/2)>8)moved=true;
 if(moved){manual=Math.max(0,Math.min(9,Math.round((x/r.width)*9)));sl.value=manual;lb.textContent=label(manual);}
});
st.addEventListener("pointerup",function(){
 dragging=false;
 if(!moved){manual=-1;t0=performance.now();sl.value=9;}
});
sl.addEventListener("input",function(){manual=+sl.value;lb.textContent=label(manual);});
})();
