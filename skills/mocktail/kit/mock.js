/* ============================================================
   mock.js — the interaction runtime for mocktail
   ------------------------------------------------------------
   A clickable mock is a tiny state machine over kit markup. This
   file gives you the reusable behaviours so an example only wires
   the script — never re-implements the mechanics. It injects its
   own behaviour CSS (cues, caret, thinking cluster, ticks, fades),
   reading kit.css tokens so it re-skins with the design system.

   API (window.Mock)
     fit(appId, opts)          scale a fixed-size frame to the window (Pattern G)
     follow(scrollEl)          -> scroll() that pins a feed to newest (Pattern H)
     cue(wrapId, label, where) float a CTA cue over a target (Pattern A)  where: top|bottom|left|right
     clearCue()                dismiss the current cue
     type(el, text, opts)      typewriter into an element or input (Pattern B)
     thinking(text)            -> a node: square-cluster "working" indicator (Pattern E)
     tick(stepEl)              mark a .pstep done -> bare green tick (Pattern C)
     reveal(items, opts)       staggered "collecting" reveal (Pattern F)

   CUE TARGETS must be wrapped so the cue scales with the frame:
     <span class="cuewrap" id="sendWrap"><button id="send">Send</button></span>
     Mock.cue('sendWrap', 'Press Enter', 'top');
   ============================================================ */
(function () {
  // ---- inject behaviour CSS once -------------------------------
  const CSS = `
  .cuewrap{ position:relative; display:inline-flex; }
  .cue{ position:absolute; z-index:80; pointer-events:none; }
  .cue .lab{ display:block; white-space:nowrap; font:700 11px/1 var(--font-ui,system-ui);
    color:var(--brand-ink,#3730a3); background:var(--brand-soft,#eef2ff);
    border:1px solid color-mix(in srgb, var(--brand,#4f46e5) 30%, #ffffff);
    border-radius:7px; padding:5px 10px; box-shadow:0 4px 14px rgba(16,24,40,.12); }
  .cue::after{ content:""; position:absolute; border:6px solid transparent; }
  /* top (default): above target, arrow down */
  .cue.top{ left:50%; bottom:calc(100% + 9px); transform:translateX(-50%); animation:cueBobY 1.4s ease-in-out infinite; }
  .cue.top::after{ left:50%; top:100%; transform:translateX(-50%); border-top-color:var(--brand-soft,#eef2ff); }
  .cue.bottom{ left:50%; top:calc(100% + 9px); transform:translateX(-50%); animation:cueBobY 1.4s ease-in-out infinite; }
  .cue.bottom::after{ left:50%; bottom:100%; transform:translateX(-50%); border-bottom-color:var(--brand-soft,#eef2ff); }
  .cue.left{ right:calc(100% + 11px); top:50%; transform:translateY(-50%); animation:cueBobX 1.4s ease-in-out infinite; }
  .cue.left::after{ left:100%; top:50%; transform:translateY(-50%); border-left-color:var(--brand-soft,#eef2ff); }
  .cue.right{ left:calc(100% + 11px); top:50%; transform:translateY(-50%); animation:cueBobX 1.4s ease-in-out infinite; }
  .cue.right::after{ right:100%; top:50%; transform:translateY(-50%); border-right-color:var(--brand-soft,#eef2ff); }
  .cue.gone{ animation:none; opacity:0; transition:opacity .25s ease; }
  @keyframes cueBobY{ 0%,100%{ margin-top:0 } 50%{ margin-top:-5px } }
  @keyframes cueBobX{ 0%,100%{ margin-left:0 } 50%{ margin-left:4px } }

  .caret{ display:inline-block; width:2px; height:1.05em; background:var(--brand,#4f46e5);
    margin-left:1px; vertical-align:text-bottom; animation:cueBlink 1s step-end infinite; }
  @keyframes cueBlink{ 50%{ opacity:0 } }

  .thinking{ display:inline-flex; align-items:center; gap:10px; padding:5px 0 2px; }
  .cowork{ position:relative; width:13px; height:13px; flex-shrink:0; }
  .cowork .sq{ position:absolute; top:50%; left:50%; width:4.5px; height:4.5px; margin:-2.25px 0 0 -2.25px;
    border-radius:1px; background:var(--ink-1,#101828); animation:cwMarch 1.2s steps(1,end) infinite; }
  .cowork .sq:nth-child(2){ animation-delay:-.3s; }
  .cowork .sq:nth-child(3){ animation-delay:-.6s; }
  @keyframes cwMarch{ 0%,100%{ transform:translate(-2.6px,-2.6px) } 25%{ transform:translate(2.6px,-2.6px) }
    50%{ transform:translate(2.6px,2.6px) } 75%{ transform:translate(-2.6px,2.6px) } }
  .thinking .txt{ font-size:13px; font-weight:500; color:var(--ink-3,#667085); }

  .pstep .ico svg{ width:15px; height:15px; opacity:0; transition:opacity .2s ease .05s; }
  .pstep.run .ico{ width:14px; height:14px; border:2px solid var(--line-1,#e4e7ec);
    border-top-color:var(--brand,#4f46e5); border-radius:50%; animation:cwSpin .7s linear infinite; }
  .pstep.done .ico svg{ opacity:1; animation:cwPop .3s ease; }
  @keyframes cwSpin{ to{ transform:rotate(360deg) } }
  @keyframes cwPop{ 0%{ transform:scale(.4) } 60%{ transform:scale(1.15) } 100%{ transform:scale(1) } }

  .fade-up{ opacity:0; transform:translateY(7px); animation:cwFadeUp .4s ease forwards; }
  @keyframes cwFadeUp{ to{ opacity:1; transform:none } }`;

  function injectCSS() {
    if (document.getElementById("mock-css")) return;
    const s = document.createElement("style");
    s.id = "mock-css"; s.textContent = CSS;
    document.head.appendChild(s);
  }

  const TICK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="' +
    'var(--success,#0e9f6e)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M5 12.5l4 4L19 7"/></svg>';

  // ---- Pattern G: scale a fixed frame to the window -----------
  function fit(appId, opts) {
    opts = opts || {};
    const app = document.getElementById(appId);
    if (!app) return;
    const W = opts.w || app.offsetWidth, H = opts.h || app.offsetHeight;
    const rt = opts.reserveTop || 0, rb = opts.reserveBottom || 28;
    const stage = app.parentElement;
    app.style.transformOrigin = "top left";
    function run() {
      const s = Math.min(1, (innerWidth - 28) / W, (innerHeight - rt - rb) / H);
      app.style.transform = `scale(${s})`;
      if (stage) { stage.style.width = W * s + "px"; stage.style.height = H * s + "px"; }
    }
    addEventListener("resize", run); run();
  }

  // ---- Pattern H: keep a feed pinned to newest ----------------
  function follow(scrollEl) {
    const el = typeof scrollEl === "string" ? document.getElementById(scrollEl) : scrollEl;
    return () => { if (el) el.scrollTop = el.scrollHeight; };
  }

  // ---- Pattern A: floating CTA cue ----------------------------
  let curCue = null;
  function clearCue() {
    if (!curCue) return;
    const c = curCue; curCue = null;
    c.classList.add("gone");
    setTimeout(() => c.remove(), 280);
  }
  function cue(wrapId, label, where) {
    clearCue();
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    if (!wrap.classList.contains("cuewrap")) wrap.classList.add("cuewrap");
    const c = document.createElement("div");
    c.className = "cue " + (where || "top");
    c.innerHTML = `<span class="lab">${label}</span>`;
    wrap.appendChild(c);
    curCue = c;
  }

  // ---- Pattern B: typewriter ----------------------------------
  function type(el, text, opts) {
    opts = opts || {};
    const speed = opts.speed || 22, done = opts.done;
    const intoValue = "value" in el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
    let i = 0;
    (function step() {
      if (intoValue) el.value = text.slice(0, i);
      else el.innerHTML = text.slice(0, i) + '<span class="caret"></span>';
      if (i++ < text.length) setTimeout(step, speed * 0.7 + Math.random() * speed);
      else { if (!intoValue) el.innerHTML = text; done && done(); }
    })();
  }

  // ---- Pattern E: "thinking" square cluster -------------------
  function thinking(text) {
    const d = document.createElement("div");
    d.className = "thinking fade-up";
    d.innerHTML = '<span class="cowork"><span class="sq"></span><span class="sq"></span><span class="sq"></span></span>' +
      `<span class="txt">${text || "Working on it"}</span>`;
    return d;
  }

  // ---- Pattern C: bare green tick -----------------------------
  function tick(stepEl) {
    stepEl.classList.remove("run");
    stepEl.classList.add("done");
    let ico = stepEl.querySelector(".ico");
    if (!ico) { ico = document.createElement("span"); ico.className = "ico"; stepEl.prepend(ico); }
    ico.innerHTML = TICK_SVG;
  }

  // ---- Pattern F: staggered "collecting" reveal ---------------
  function reveal(items, opts) {
    opts = opts || {};
    const each = opts.each || 520, gap = opts.gap || 200, onEach = opts.onEach, done = opts.done;
    let i = 0;
    (function next() {
      if (i >= items.length) return done && done();
      const it = items[i];
      it.classList.add("fade-up");
      onEach && onEach(it, "in");
      setTimeout(() => { onEach && onEach(it, "ready"); i++; setTimeout(next, gap); }, each);
    })();
  }

  injectCSS();
  window.Mock = { fit, follow, cue, clearCue, type, thinking, tick, reveal, TICK_SVG };
})();
