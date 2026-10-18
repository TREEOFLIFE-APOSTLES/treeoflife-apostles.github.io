(function () {
  "use strict";
  var statusEl = document.getElementById("status");
  var bowlsEl = document.getElementById("bowls");
  var forksEl = document.getElementById("forks");
  var bathLabel = document.getElementById("bathLabel");
  var NOTES = [
    { name: "C", f440: 261.63 }, { name: "D", f440: 293.66 },
    { name: "E", f440: 329.63 }, { name: "F", f440: 349.23 },
    { name: "G", f440: 392.0 }, { name: "A", f440: 440.0 },
    { name: "B", f440: 493.88 }
  ];
  var FORKS = [174, 285, 396, 417, 528, 639, 741, 852, 963];
  var PARTIALS = [1, 2.7, 5.2, 8.3];
  var PARTIAL_GAIN = [1, 0.5, 0.25, 0.12];
  var tuning = 440;
  var ctx = null, master = null;
  var forkOsc = null, forkGain = null, forkFreq = null, forkBtn = null;
  var singing = {}; // name -> {oscs:[], gain}
  var bathTimer = null, bathTick = null, bathEndsAt = 0, bathMinutes = 5, bathIdx = 0;

  function ensureCtx() {
    if (ctx) { if (ctx.resume) ctx.resume(); return true; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { statusEl.textContent = "This browser has no WebAudio — the page stays quiet."; return false; }
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    return true;
  }
  function freqOf(note) { return note.f440 * (tuning / 440); }
  function makeVoice(freq, peak) {
    var gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(master);
    var oscs = [];
    for (var i = 0; i < PARTIALS.length; i++) {
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq * PARTIALS[i];
      var og = ctx.createGain();
      og.gain.value = PARTIAL_GAIN[i];
      o.connect(og); og.connect(gain); o.start();
      oscs.push(o);
    }
    return { oscs: oscs, gain: gain, peak: peak };
  }
  function killVoice(v, fade) {
    if (!v) return;
    var t = ctx.currentTime;
    try {
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setTargetAtTime(0, t, fade);
      v.oscs.forEach(function (o) { try { o.stop(t + fade * 6 + 0.1); } catch (e) {} });
    } catch (e) {}
  }
  function strike(note) {
    if (!ensureCtx()) return;
    var v = makeVoice(freqOf(note), 0.06);
    var t = ctx.currentTime;
    v.gain.gain.setValueAtTime(0, t);
    v.gain.gain.linearRampToValueAtTime(0.06, t + 0.015);
    v.gain.gain.setTargetAtTime(0, t + 0.02, 1.8); // slow ~6s decay
    v.oscs.forEach(function (o) { try { o.stop(t + 9); } catch (e) {} });
    statusEl.textContent = "Bowl " + note.name + " · " + freqOf(note).toFixed(1) + " Hz ringing…";
  }
  function startSing(note, btn) {
    if (!ensureCtx() || singing[note.name]) return;
    var v = makeVoice(freqOf(note), 0.055);
    v.gain.gain.setTargetAtTime(0.055, ctx.currentTime, 0.6); // swell while held
    singing[note.name] = v;
    btn.classList.add("singing"); btn.setAttribute("aria-pressed", "true");
    statusEl.textContent = "Bowl " + note.name + " singing… let go to fade.";
  }
  function stopSing(note, btn) {
    var v = singing[note.name];
    if (!v) return;
    delete singing[note.name];
    killVoice(v, 0.35);
    if (btn) { btn.classList.remove("singing"); btn.setAttribute("aria-pressed", "false"); }
  }
  function stopFork() {
    if (forkGain && ctx) {
      var fg = forkGain, fo = forkOsc;
      try { fg.gain.setTargetAtTime(0, ctx.currentTime, 0.06); fo.stop(ctx.currentTime + 0.6); } catch (e) {}
    }
    forkOsc = null; forkGain = null; forkFreq = null;
    if (forkBtn) { forkBtn.setAttribute("aria-pressed", "false"); forkBtn = null; }
  }
  function playFork(freq, btn) {
    if (forkFreq === freq) { stopFork(); statusEl.textContent = "Tone stopped."; return; }
    if (!ensureCtx()) return;
    stopFork();
    forkOsc = ctx.createOscillator(); forkOsc.type = "sine"; forkOsc.frequency.value = freq;
    forkGain = ctx.createGain(); forkGain.gain.value = 0;
    forkOsc.connect(forkGain); forkGain.connect(master); forkOsc.start();
    forkGain.gain.setTargetAtTime(0.045, ctx.currentTime, 0.08);
    forkFreq = freq; forkBtn = btn; btn.setAttribute("aria-pressed", "true");
    statusEl.textContent = freq + " Hz tone playing — tap again to stop.";
  }
  function stopBath(silent) {
    if (bathTimer) { clearInterval(bathTimer); bathTimer = null; }
    if (bathTick) { clearInterval(bathTick); bathTick = null; }
    document.querySelectorAll("[data-bath]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    if (!silent) bathLabel.textContent = "No sound bath running.";
  }
  function stopAll() {
    stopFork();
    Object.keys(singing).forEach(function (k) {
      var btn = bowlsEl.querySelector('[data-note="' + k + '"]');
      stopSing(NOTES.find(function (n) { return n.name === k; }), btn);
    });
    stopBath(true); bathLabel.textContent = "No sound bath running.";
    statusEl.textContent = "All sound stopped.";
  }
  // Build bowls (SVG circles)
  NOTES.forEach(function (note) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "bowl"; b.dataset.note = note.name;
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", "Bowl " + note.name + " — tap to strike, press and hold to sing");
    b.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="none" stroke="#ffd27a" stroke-width="3"/><circle cx="32" cy="32" r="17" fill="none" stroke="#5ee6d0" stroke-width="2" opacity=".8"/><circle cx="32" cy="32" r="5" fill="#ffd27a"/></svg><span class="nm">' + note.name + '</span><span class="hz">' + freqOf(note).toFixed(1) + " Hz</span>";
    var holdTimer = null, sang = false, suppressClick = false;
    b.addEventListener("pointerdown", function (ev) {
      ev.preventDefault(); sang = false;
      try { b.setPointerCapture(ev.pointerId); } catch (e) {}
      holdTimer = setTimeout(function () { sang = true; startSing(note, b); }, 300);
    });
    function endHold() {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      if (sang) { suppressClick = true; stopSing(note, b); sang = false; }
    }
    b.addEventListener("pointerup", endHold);
    b.addEventListener("pointercancel", endHold);
    b.addEventListener("click", function () {
      if (suppressClick) { suppressClick = false; return; }
      strike(note);
    });
    bowlsEl.appendChild(b);
  });
  function refreshHz() {
    bowlsEl.querySelectorAll(".bowl").forEach(function (b) {
      var note = NOTES.find(function (n) { return n.name === b.dataset.note; });
      b.querySelector(".hz").textContent = freqOf(note).toFixed(1) + " Hz";
    });
  }
  function setTuning(v) {
    tuning = v;
    document.getElementById("tune440").setAttribute("aria-pressed", v === 440 ? "true" : "false");
    document.getElementById("tune432").setAttribute("aria-pressed", v === 432 ? "true" : "false");
    refreshHz();
    statusEl.textContent = "Tuning set to A = " + v + " Hz.";
  }
  document.getElementById("tune440").addEventListener("click", function () { setTuning(440); });
  document.getElementById("tune432").addEventListener("click", function () { setTuning(432); });
  // Build forks
  FORKS.forEach(function (f) {
    var b = document.createElement("button");
    b.type = "button"; b.textContent = f + " Hz"; b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", f + " Hz tone, tap to play or stop");
    b.addEventListener("click", function () { playFork(f, b); });
    forksEl.appendChild(b);
  });
  // Sound bath
  document.querySelectorAll("[data-bath]").forEach(function (b) {
    b.addEventListener("click", function () {
      bathMinutes = parseInt(b.dataset.bath, 10);
      document.querySelectorAll("[data-bath]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      bathLabel.textContent = bathMinutes + " minute sound bath selected — press Start.";
    });
  });
  document.getElementById("bathStart").addEventListener("click", function () {
    if (!ensureCtx()) return;
    stopBath(true);
    document.querySelector('[data-bath="' + bathMinutes + '"]').setAttribute("aria-pressed", "true");
    bathEndsAt = Date.now() + bathMinutes * 60 * 1000; bathIdx = 0;
    strike(NOTES[bathIdx % NOTES.length]); bathIdx++;
    bathTimer = setInterval(function () { strike(NOTES[bathIdx % NOTES.length]); bathIdx++; }, 25000);
    bathTick = setInterval(function () {
      var left = Math.max(0, Math.round((bathEndsAt - Date.now()) / 1000));
      bathLabel.textContent = "Sound bath playing — " + Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0") + " left. Soft bowls every 25 seconds.";
      if (left <= 0) { stopBath(true); bathLabel.textContent = "Sound bath finished. Soft eyes."; statusEl.textContent = "Sound bath finished."; }
    }, 500);
    bathLabel.textContent = bathMinutes + " minute sound bath playing. Soft bowls every 25 seconds.";
  });
  document.getElementById("bathStop").addEventListener("click", function () { stopBath(false); });
  document.getElementById("stopAll").addEventListener("click", stopAll);
})();
