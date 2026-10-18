(function () {
  "use strict";
  var cv = document.getElementById("c");
  var cx = cv.getContext("2d");
  var st = document.getElementById("stage");
  var nSl = document.getElementById("n");
  var mSl = document.getElementById("m");
  var nVal = document.getElementById("nv");
  var mVal = document.getElementById("mv");
  var lb = document.getElementById("lbl");
  var toneBtn = document.getElementById("tone");
  var scatterBtn = document.getElementById("scatter");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, dpr = 1, side = 0, ox = 0, oy = 0;
  var N = 2, M = 3;
  var particles = [];
  var stars = [];
  var audioCtx = null, osc = null, gain = null, toneOn = false;

  function makeStars() {
    stars = [];
    for (var i = 0; i < 90; i++) stars.push([Math.random(), Math.random(), Math.random() * 1.4 + 0.3, Math.random() * 6]);
  }
  makeStars();

  function count() {
    // Keep phones comfortable: fewer grains on small screens.
    return Math.min(2600, Math.max(1200, Math.floor((W * H) / 260)));
  }
  function scatter() {
    particles = [];
    var c = count();
    for (var i = 0; i < c; i++) {
      particles.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 });
    }
    if (reduce) settleStatic();
  }
  function field(x, y) {
    var px = Math.PI * x, py = Math.PI * y;
    return Math.cos(N * px) * Math.cos(M * py) - Math.cos(M * px) * Math.cos(N * py);
  }
  function gradient(x, y) {
    var px = Math.PI * x, py = Math.PI * y;
    var gx = -N * Math.PI * Math.sin(N * px) * Math.cos(M * py) + M * Math.PI * Math.sin(M * px) * Math.cos(N * py);
    var gy = -M * Math.PI * Math.cos(N * px) * Math.sin(M * py) + N * Math.PI * Math.cos(M * px) * Math.sin(N * py);
    return [gx, gy];
  }
  function step(p, calm) {
    var f = field(p.x, p.y);
    var g = gradient(p.x, p.y);
    // Move downhill on |f|: direction is -sign(f) * grad(f).
    var s = f >= 0 ? -1 : 1;
    var k = 0.0035;
    p.x += s * g[0] * k;
    p.y += s * g[1] * k;
    if (!calm) {
      // Vibrating regions shake grains; nodal regions barely tremble.
      var shake = Math.min(0.012, Math.abs(f) * 0.010);
      p.x += (Math.random() - 0.5) * 2 * shake;
      p.y += (Math.random() - 0.5) * 2 * shake;
    }
    if (p.x < -1) p.x = -1; if (p.x > 1) p.x = 1;
    if (p.y < -1) p.y = -1; if (p.y > 1) p.y = 1;
  }
  function settleStatic() {
    for (var t = 0; t < 160; t++) {
      for (var i = 0; i < particles.length; i++) step(particles[i], true);
    }
    draw(0);
  }
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = st.clientWidth; H = st.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    side = Math.min(W, H) * 0.86;
    ox = W / 2; oy = H / 2;
    if (!particles.length) scatter();
    if (reduce) settleStatic();
  }
  function freq() {
    return Math.round(55 * Math.sqrt(N * N + M * M));
  }
  function label() {
    nVal.textContent = String(N);
    mVal.textContent = String(M);
    if (N === M) {
      lb.textContent = "n = m = " + N + " · the two terms cancel — choose two different numbers";
    } else {
      lb.textContent = "Chladni pattern · n = " + N + ", m = " + M + (toneOn ? " · tone ≈ " + freq() + " Hz" : "");
    }
  }
  function draw(t) {
    cx.clearRect(0, 0, W, H);
    var i, s;
    for (i = 0; i < stars.length; i++) {
      s = stars[i];
      var a = reduce ? 0.6 : 0.35 + 0.35 * Math.sin(t * 0.0008 + s[3]);
      cx.fillStyle = "rgba(233,230,255," + a + ")";
      cx.fillRect(s[0] * W, s[1] * H, s[2], s[2]);
    }
    // The plate.
    cx.save();
    cx.fillStyle = "rgba(8,12,34,0.92)";
    cx.strokeStyle = "#ffd27a";
    cx.lineWidth = 2;
    cx.shadowColor = "#ffd27a";
    cx.shadowBlur = 14;
    var x0 = ox - side / 2, y0 = oy - side / 2;
    cx.beginPath();
    cx.rect(x0, y0, side, side);
    cx.fill();
    cx.stroke();
    cx.restore();
    // Sand: gold where settled, teal while still travelling.
    for (i = 0; i < particles.length; i++) {
      var p = particles[i];
      var settled = Math.abs(field(p.x, p.y)) < 0.08;
      cx.fillStyle = settled ? "rgba(255,210,122,0.95)" : "rgba(94,230,208,0.55)";
      var px = ox + (p.x * side) / 2;
      var py = oy + (p.y * side) / 2;
      cx.fillRect(px, py, settled ? 1.7 : 1.3, settled ? 1.7 : 1.3);
    }
  }
  function frame(now) {
    if (!reduce) {
      for (var i = 0; i < particles.length; i++) step(particles[i], false);
    }
    draw(now || 0);
    if (!reduce) requestAnimationFrame(frame);
  }
  function syncAudio() {
    if (toneOn && osc) {
      osc.frequency.setTargetAtTime(freq(), audioCtx.currentTime, 0.05);
    }
    label();
  }
  function setMode(n, m) {
    N = n; M = m;
    nSl.value = String(n); mSl.value = String(m);
    if (reduce) settleStatic();
    syncAudio();
  }
  nSl.addEventListener("input", function () { setMode(parseInt(nSl.value, 10), M); });
  mSl.addEventListener("input", function () { setMode(N, parseInt(mSl.value, 10)); });
  var presets = document.querySelectorAll("[data-n][data-m]");
  for (var b = 0; b < presets.length; b++) {
    presets[b].addEventListener("click", function () {
      setMode(parseInt(this.getAttribute("data-n"), 10), parseInt(this.getAttribute("data-m"), 10));
    });
  }
  scatterBtn.addEventListener("click", scatter);
  st.addEventListener("pointerup", function () { scatter(); });
  toneBtn.addEventListener("click", function () {
    if (!toneOn) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { lb.textContent = "This browser has no WebAudio tone — the sand still dances."; return; }
      if (!audioCtx) {
        audioCtx = new AC();
        osc = audioCtx.createOscillator();
        gain = audioCtx.createGain();
        osc.type = "sine";
        gain.gain.value = 0.0;
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start();
      }
      audioCtx.resume();
      osc.frequency.setTargetAtTime(freq(), audioCtx.currentTime, 0.05);
      gain.gain.setTargetAtTime(0.035, audioCtx.currentTime, 0.1);
      toneOn = true;
      toneBtn.setAttribute("aria-pressed", "true");
      toneBtn.textContent = "🔊 Tone: on (quiet)";
    } else {
      gain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.08);
      toneOn = false;
      toneBtn.setAttribute("aria-pressed", "false");
      toneBtn.textContent = "🔇 Tone: off";
    }
    label();
  });
  window.addEventListener("resize", size);
  size();
  label();
  if (reduce) { settleStatic(); } else { requestAnimationFrame(frame); }
})();
