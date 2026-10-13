(function(){
"use strict";
var cv=document.getElementById("c"),cx=cv.getContext("2d"),st=document.getElementById("stage"),sl=document.getElementById("s"),lb=document.getElementById("lbl");
var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var W,H,R,dpr,t0=performance.now(),manual=-1;
var LABELS=["1 · One circle","2 · The vesica piscis","3 · The Seed of Life (7 circles)","4 · The Flower of Life (19 circles)","5 · The Tree of Life rests inside"];
var stars=[];for(var i=0;i<90;i++)stars.push([Math.random(),Math.random(),Math.random()*1.4+.3,Math.random()*6]);
// circle centers in units of R, in bloom order
var S3=Math.sqrt(3),C=[[0,0],[0,-1]];
for(var k=0;k<6;k++){var a=-Math.PI/2+k*Math.PI/3;if(k)C.push([Math.cos(a),Math.sin(a)]);}
// seed: index 0..6 ; flower ring: 12 more
for(k=0;k<6;k++){var b=-Math.PI/2+k*Math.PI/3;C.push([2*Math.cos(b),2*Math.sin(b)]);var c2=b+Math.PI/6;C.push([S3*Math.cos(c2),S3*Math.sin(c2)]);}
var COUNT=[1,2,7,19,19];
// Tree of Life sephirot (units of R)
var T=[[0,-2],[.866,-1.5],[-.866,-1.5],[.866,-.5],[-.866,-.5],[0,0],[.866,.5],[-.866,.5],[0,1],[0,2]];
var P=[[0,1],[0,2],[0,5],[1,2],[1,3],[1,5],[2,4],[2,5],[3,4],[3,5],[3,6],[4,5],[4,7],[5,6],[5,7],[5,8],[6,7],[6,8],[6,9],[7,8],[7,9],[8,9]];
var DUR=[1.2,1.2,3,4.5,2.5],START=[];var acc=0;for(k=0;k<5;k++){START.push(acc);acc+=DUR[k];}
function size(){dpr=Math.min(window.devicePixelRatio||1,2);W=st.clientWidth;H=st.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0);R=Math.min(W,H)/6.8;}
window.addEventListener("resize",size);size();
function ease(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
function ring(x,y,r,col,a,w){if(a<=0)return;cx.globalAlpha=a;cx.beginPath();cx.arc(x,y,r,0,Math.PI*2);cx.strokeStyle=col;cx.lineWidth=w||1.8;cx.shadowColor=col;cx.shadowBlur=14;cx.stroke();cx.shadowBlur=0;cx.globalAlpha=1;}
var lastStage=-1;
function frame(now){
 var t=(now-t0)/1000,stage,prog;
 if(manual>=0||reduce){stage=manual>=0?manual:4;prog=1;}
 else{stage=0;for(var k=0;k<5;k++)if(t>=START[k])stage=k;prog=Math.min(1,(t-START[stage])/DUR[stage]);}
 if(stage!==lastStage){lastStage=stage;lb.textContent=LABELS[stage];if(manual<0)sl.value=stage;}
 cx.clearRect(0,0,W,H);
 for(var i=0;i<stars.length;i++){var s=stars[i],al=reduce?.6:.35+.35*Math.sin(t*.8+s[3]);cx.fillStyle="rgba(233,230,255,"+al+")";cx.fillRect(s[0]*W,s[1]*H,s[2],s[2]);}
 var mx=W/2,my=H/2,prev=stage?COUNT[stage-1]:0,n=COUNT[stage],newN=n-prev;
 for(i=0;i<n;i++){
  var a=1,sc=1;
  if(i>=prev&&newN>0){var p=(prog*newN)-(i-prev);a=ease(p);sc=.6+.4*ease(p);}
  var gold=(i===0||i===1)&&stage>=1&&stage<=2;
  ring(mx+C[i][0]*R,my+C[i][1]*R,R*sc,gold?"#ffd27a":"#5ee6d0",a);
 }
 if(stage>=3){var ra=stage===3?ease((prog-.7)/.3):1;ring(mx,my,3*R,"#ffd27a",ra,2.4);}
 if(stage===4){
  var ta=ease(prog),pulse=reduce?.5:.5+.5*Math.sin(t*1.6);
  cx.globalAlpha=ta;cx.strokeStyle="rgba(255,210,122,.85)";cx.lineWidth=2;
  cx.beginPath();P.forEach(function(q){cx.moveTo(mx+T[q[0]][0]*R,my+T[q[0]][1]*R);cx.lineTo(mx+T[q[1]][0]*R,my+T[q[1]][1]*R);});cx.stroke();
  T.forEach(function(q){cx.beginPath();cx.arc(mx+q[0]*R,my+q[1]*R,R*.13,0,7);cx.fillStyle="#0b1236";cx.fill();cx.strokeStyle="#ffd27a";cx.shadowColor="#ffd27a";cx.shadowBlur=10+14*pulse;cx.stroke();cx.shadowBlur=0;});
  cx.globalAlpha=1;
 }
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
st.addEventListener("click",function(){manual=-1;t0=performance.now();});
sl.addEventListener("input",function(){manual=+sl.value;lb.textContent=LABELS[manual];lastStage=manual;});
})();
