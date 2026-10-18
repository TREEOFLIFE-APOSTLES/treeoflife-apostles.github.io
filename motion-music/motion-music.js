(function () {
  "use strict";
  var cv = document.getElementById("c");
  var cx = cv.getContext("2d");
  var stage = document.getElementById("stage");
  var readout = document.getElementById("readout");
  var startBtn = document.getElementById("startBtn");
  var stopBtn = document.getElementById("stopBtn");
  var snapBtn = document.getElementById("modeSnap");
  var glideBtn = document.getElementById("modeGlide");
  var motionBtn = document.getElementById("motionBtn");
  var motionNote = document.getElementById("motionNote");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, dpr = 1;
  var px = 0.5, py = 0.5, hasPointer = false;
  var trail = [];
  var stars = [];
  var snap = false;
  var ctx = null, osc = null, gain = null, playing = false;
  var NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  // A minor pentatonic across octaves (MIDI): A C D E G
  var PENTA = [45, 48, 50, 52, 55, 57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81];

  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function freqToNote(f) {
    var m = Math.round(69 + 12 * Math.log2(f / 440));
    return NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1) + " · " + Math.round(f) + " Hz";
  }
  function targetFreq() {
    if (snap) {
      var idx = Math.max(0, Math.min(PENTA.length - 1, Math.round(px * (PENTA.length - 1))));
      return midiToFreq(PENTA[idx]);
    }
    // Continuous: 110 Hz (A2) to 880 Hz (A5), logarithmic
    return 110 * Math.pow(8, px);
  }
  function targetGain() { return Math.max(0, Math.min(0.08, (1 - py) * 0.08)); }
  function makeStars() {
    stars = [];
    for (var i = 0; i < 90; i++) stars.push([Math.random(), Math.random(), Math.random() * 1.4 + 0.3, Math.random() * 6]);
  }
  makeStars();
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth; H = stage.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(0);
  }
  function draw(t) {
    cx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = reduce ? 0.6 : 0.35 + 0.35 * Math.sin(t * 0.0008 + s[3]);
      cx.fillStyle = "rgba(233,230,255," + a + ")";
      cx.fillRect(s[0] * W, s[1] * H, s[2], s[2]);
    }
    if (!hasPointer) return;
    var x = px * W, y = py * H;
    if (!reduce) {
      trail.push({ x: x, y: y });
      if (trail.length > 42) trail.shift();
      for (var j = 0; j < trail.length; j++) {
        var p = trail[j], r = 3 + (j / trail.length) * 11;
        cx.fillStyle = "rgba(94,230,208," + (j / trail.length) * 0.35 + ")";
        cx.beginPath(); cx.arc(p.x, p.y, r, 0, 6.283); cx.fill();
      }
    }
    cx.save();
    cx.shadowColor = "#ffd27a"; cx.shadowBlur = 26;
    cx.fillStyle = "#ffd27a";
    cx.beginPath(); cx.arc(x, y, 14, 0, 6.283); cx.fill();
    cx.restore();
    cx.fillStyle = "rgba(255,210,122,.25)";
    cx.beginPath(); cx.arc(x, y, 26, 0, 6.283); cx.fill();
  }
  function frame(t) { draw(t || 0); if (!reduce) requestAnimationFrame(frame); }
  function updateAudioAndReadout() {
    var f = targetFreq(), g = targetGain();
    if (playing && osc && ctx) {
      osc.frequency.setTargetAtTime(f, ctx.currentTime, snap ? 0.03 : 0.06);
      gain.gain.setTargetAtTime(g, ctx.currentTime, 0.06);
    }
    var vol = Math.round((g / 0.08) * 100);
    readout.textContent = (playing ? "♪ " : "Sound off · ") + freqToNote(f) + " · volume " + vol + "%" + (snap ? " · pentatonic" : " · glide") + (playing ? "" : " — press Start Sound");
  }
  function onMove(ev) {
    var r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    px = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
    py = Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height));
    hasPointer = true;
    if (reduce) draw(0);
    updateAudioAndReadout();
  }
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerdown", onMove);
  function startSound() {
    if (playing) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { readout.textContent = "This browser has no WebAudio — move anyway and watch the orb."; return; }
    if (!ctx) {
      ctx = new AC();
      osc = ctx.createOscillator(); osc.type = "sine";
      gain = ctx.createGain(); gain.gain.value = 0;
      osc.connect(gain); gain.connect(ctx.destination); osc.start();
    }
    ctx.resume(); playing = true;
    startBtn.setAttribute("aria-pressed", "true");
    updateAudioAndReadout();
  }
  function stopSound() {
    if (gain && ctx) gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    playing = false;
    startBtn.setAttribute("aria-pressed", "false");
    readout.textContent = "Stopped. Press Start Sound to play again.";
  }
  startBtn.addEventListener("click", startSound);
  stopBtn.addEventListener("click", stopSound);
  function setMode(isSnap) {
    snap = isSnap;
    snapBtn.setAttribute("aria-pressed", isSnap ? "true" : "false");
    glideBtn.setAttribute("aria-pressed", isSnap ? "false" : "true");
    updateAudioAndReadout();
  }
  snapBtn.addEventListener("click", function () { setMode(true); });
  glideBtn.addEventListener("click", function () { setMode(false); });
  // Optional device motion: only offer it where a permission API exists.
  if (typeof window.DeviceMotionEvent !== "undefined" && typeof window.DeviceMotionEvent.requestPermission === "function") {
    motionBtn.hidden = false;
    motionBtn.addEventListener("click", function () {
      window.DeviceMotionEvent.requestPermission().then(function (res) {
        if (res === "granted") {
          window.addEventListener("devicemotion", function (ev) {
            var acc = ev.accelerationIncludingGravity;
            if (!acc) return;
            if (typeof acc.x === "number") px = Math.max(0, Math.min(1, 0.5 + acc.x / 18));
            if (typeof acc.y === "number") py = Math.max(0, Math.min(1, 0.5 - acc.y / 18));
            hasPointer = true; if (reduce) draw(0); updateAudioAndReadout();
          });
          motionNote.textContent = "Device motion on — tilt gently. Pointer still works too, and Stop silences everything.";
        } else {
          motionNote.textContent = "Motion permission not granted — no problem, pointer and touch work fine.";
        }
      }).catch(function () {
        motionNote.textContent = "Motion permission could not be requested — pointer and touch work fine.";
      });
    });
  } else {
    motionNote.textContent = "Device motion is optional and never required. This browser does not offer a motion-permission request here, so just use mouse, touch, or trackpad — that is the full instrument.";
  }
  window.addEventListener("resize", size);
  size(); updateAudioAndReadout();
  if (!reduce) requestAnimationFrame(frame); else draw(0);
})();
