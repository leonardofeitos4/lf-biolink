/* =========================================================
   LF fx — camada de interação compartilhada (biolink + portfólio)
   - grade de pontos que reage ao cursor/toque + ondas de choque
   - cursor customizado (só mouse)
   - tilt 3D + spotlight em [data-tilt]
   - olhos que seguem o cursor em [data-eye] (filho .pupil)
   - reveal no scroll em [data-reveal]
   - confete: LF.confetti(x, y)
   ========================================================= */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const root = document.documentElement;
  const css = n => getComputedStyle(root).getPropertyValue(n).trim();

  /* ---------- estilos injetados ---------- */
  const st = document.createElement("style");
  st.textContent = `
    .fx-canvas{position:fixed;inset:0;width:100%;height:100%;pointer-events:none}
    .fx-cur,.fx-cur-dot{position:fixed;left:0;top:0;pointer-events:none;z-index:90;border-radius:50%}
    .fx-cur{width:36px;height:36px;margin:-18px 0 0 -18px;border:1.5px solid var(--text,#F4F4F2);opacity:.55;
      transition:width .25s,height .25s,margin .25s,background .25s,border-color .25s,opacity .25s}
    .fx-cur-dot{width:6px;height:6px;margin:-3px 0 0 -3px;background:var(--lime,#C8F25A)}
    html.fx-hover .fx-cur{width:62px;height:62px;margin:-31px 0 0 -31px;opacity:1;border-color:var(--lime,#C8F25A);background:rgba(200,242,90,.12)}
    html.fx-down .fx-cur{width:28px;height:28px;margin:-14px 0 0 -14px}
    html.fx-has-cur, html.fx-has-cur a, html.fx-has-cur button, html.fx-has-cur summary, html.fx-has-cur label{cursor:none}
    html.fx-has-cur input[type=text], html.fx-has-cur input:not([type]), html.fx-has-cur textarea{cursor:text}
    [data-tilt]{position:relative;--mx:50%;--my:50%;will-change:transform}
    [data-tilt]>.fx-glow{position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .3s;
      background:radial-gradient(220px circle at var(--mx) var(--my),rgba(200,242,90,.18),transparent 70%)}
    [data-tilt]:hover>.fx-glow{opacity:1}
    [data-reveal]{opacity:0;transform:translateY(26px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}
    [data-reveal].fx-in{opacity:1;transform:none}
    .fx-ripple{position:absolute;border-radius:50%;pointer-events:none;background:rgba(255,255,255,.18);transform:scale(0);animation:fxrip .6s ease-out forwards}
    @keyframes fxrip{to{transform:scale(1);opacity:0}}
    @media (prefers-reduced-motion:reduce){[data-reveal]{opacity:1;transform:none}}
  `;
  document.head.appendChild(st);

  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

  /* ---------- canvases ---------- */
  const mk = z => { const c = document.createElement("canvas"); c.className = "fx-canvas"; c.style.zIndex = z; c.setAttribute("aria-hidden", "true"); return c; };
  const grid = mk(0), fx = mk(85);
  document.body.prepend(grid); document.body.appendChild(fx);
  const g = grid.getContext("2d"), f = fx.getContext("2d");
  let W = 0, H = 0, pts = [], waves = [], parts = [];
  let colDot = "rgba(255,255,255,.09)", colLime = "#C8F25A", colText = "#F4F4F2";
  function colors() {
    colDot = css("--grid-dot") || colDot; colLime = css("--lime") || colLime; colText = css("--text") || colText;
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    for (const c of [grid, fx]) { c.width = W * dpr; c.height = H * dpr; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); f.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gap = W < 600 ? 24 : 30; pts = [];
    for (let y = gap / 2; y < H + gap; y += gap) for (let x = gap / 2; x < W + gap; x += gap) pts.push(x, y);
    if (reduce) staticGrid();
  }
  function staticGrid() {
    g.clearRect(0, 0, W, H); g.fillStyle = colDot;
    for (let i = 0; i < pts.length; i += 2) g.fillRect(pts[i] - .6, pts[i + 1] - .6, 1.2, 1.2);
  }

  /* ---------- ponteiro ---------- */
  let mx = -999, my = -999, cx = -999, cy = -999, lastMove = 0;
  addEventListener("pointermove", e => { mx = e.clientX; my = e.clientY; lastMove = performance.now(); }, { passive: true });
  addEventListener("pointerdown", e => {
    mx = e.clientX; my = e.clientY; lastMove = performance.now();
    if (!e.target.closest("a,button,input,summary,label,[data-tilt],[data-eye],.no-shock")) shock(mx, my, 1);
  }, { passive: true });
  document.addEventListener("pointerleave", () => { mx = my = -999; });
  addEventListener("blur", () => { mx = my = -999; });

  function shock(x, y, p = 1) { if (!reduce) waves.push({ x, y, t: performance.now(), p }); }
  function confetti(x, y, n = 90) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, r: 2.5 + Math.random() * 5.5, life: 1, lime: Math.random() > .3, sq: Math.random() > .6, rot: Math.random() * 6 });
    }
  }

  /* ---------- cursor ---------- */
  let cur, curDot;
  if (fine && !reduce) {
    cur = document.createElement("div"); cur.className = "fx-cur";
    curDot = document.createElement("div"); curDot.className = "fx-cur-dot";
    document.body.append(cur, curDot);
    root.classList.add("fx-has-cur");
    addEventListener("pointerdown", () => root.classList.add("fx-down"));
    addEventListener("pointerup", () => root.classList.remove("fx-down"));
    document.addEventListener("pointerover", e => {
      root.classList.toggle("fx-hover", !!e.target.closest("a,button,summary,label,input,[data-tilt],[data-eye],[role=button]"));
    });
  }

  /* ---------- tilt + spotlight + ripple ---------- */
  function bindTilt(el) {
    if (el.__fx) return; el.__fx = 1;
    const glow = document.createElement("span"); glow.className = "fx-glow"; glow.setAttribute("aria-hidden", "true");
    el.appendChild(glow);
    const max = +(el.dataset.tilt || 6);
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty("--mx", x + "px"); el.style.setProperty("--my", y + "px");
      if (!reduce && e.pointerType === "mouse" && max > 0) {
        const rx = (y / r.height - .5) * -max, ry = (x / r.width - .5) * max * 1.2;
        el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      }
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    el.addEventListener("pointerdown", e => {
      const r = el.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2;
      const rp = document.createElement("span"); rp.className = "fx-ripple";
      rp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
      if (getComputedStyle(el).overflow !== "hidden") el.style.overflow = "hidden";
      el.appendChild(rp); setTimeout(() => rp.remove(), 650); buzz(8);
    });
  }
  const scan = () => {
    document.querySelectorAll("[data-tilt]").forEach(bindTilt);
    document.querySelectorAll("[data-reveal]:not(.fx-obs)").forEach(el => { el.classList.add("fx-obs"); io ? io.observe(el) : el.classList.add("fx-in"); });
  };

  /* ---------- reveal ---------- */
  const io = (!reduce && "IntersectionObserver" in window)
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("fx-in"); io.unobserve(e.target); } }), { threshold: .12, rootMargin: "0px 0px -40px 0px" })
    : null;

  /* ---------- olhos ---------- */
  const eyes = () => [...document.querySelectorAll("[data-eye]")].map(el => ({ el, p: el.querySelector(".pupil"), max: +(el.dataset.eye || 5), x: 0, y: 0 }));
  let eyeList = [];
  function blinkAll() {
    eyeList.forEach(e => { e.el.classList.add("fx-blink"); setTimeout(() => e.el.classList.remove("fx-blink"), 140); });
  }
  (function autoBlink() { setTimeout(() => { if (!reduce) blinkAll(); autoBlink(); }, 2600 + Math.random() * 3400); })();

  /* ---------- loop ---------- */
  function frame(now) {
    cx += (mx - cx) * .2; cy += (my - cy) * .2;
    if (cur) { cur.style.transform = `translate(${cx}px,${cy}px)`; curDot.style.transform = `translate(${mx}px,${my}px)`; }

    // olhos
    const idle = now - lastMove > 3500 || mx < -900;
    for (const e of eyeList) {
      if (!e.p) continue;
      let tx, ty;
      if (idle) { const t = now / 1000; tx = Math.cos(t * .9) * e.max * .8; ty = Math.sin(t * 1.3) * e.max * .55; }
      else {
        const r = e.el.getBoundingClientRect(), dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1;
        const m = Math.min(d / 25, e.max); tx = dx / d * m; ty = dy / d * m;
      }
      e.x += (tx - e.x) * .15; e.y += (ty - e.y) * .15;
      e.p.style.transform = `translate(${e.x.toFixed(2)}px,${e.y.toFixed(2)}px)`;
    }

    // grade
    g.clearRect(0, 0, W, H);
    waves = waves.filter(w => now - w.t < 1400);
    const R = 160, R2 = R * R, hot = [];
    g.fillStyle = colDot;
    for (let i = 0; i < pts.length; i += 2) {
      let x = pts[i], y = pts[i + 1], s = 1.2, inf = 0;
      const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
      if (d2 < R2) { const d = Math.sqrt(d2) || 1; inf = 1 - d / R; const p = inf * inf * 22; x += dx / d * p; y += dy / d * p; s += inf * 2.4; }
      for (const w of waves) {
        const age = now - w.t, wr = age * .6, wx = pts[i] - w.x, wy = pts[i + 1] - w.y, wd = Math.hypot(wx, wy) || 1, diff = Math.abs(wd - wr);
        if (diff < 48) { const a = (1 - diff / 48) * (1 - age / 1400) * 16 * w.p; x += wx / wd * a; y += wy / wd * a; s += a * .13; inf = Math.max(inf, a / 22); }
      }
      if (inf > .04) hot.push(x, y, s, inf); else g.fillRect(x - s / 2, y - s / 2, s, s);
    }
    g.fillStyle = colLime;
    for (let i = 0; i < hot.length; i += 4) { g.globalAlpha = Math.min(1, .2 + hot[i + 3] * 1.1); g.beginPath(); g.arc(hot[i], hot[i + 1], hot[i + 2], 0, 6.283); g.fill(); }
    g.globalAlpha = 1;

    // confete
    f.clearRect(0, 0, W, H);
    if (parts.length) {
      parts = parts.filter(p => p.life > 0 && p.y < H + 40);
      for (const p of parts) {
        p.vy += .3; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.life -= .008; p.rot += .1;
        f.globalAlpha = Math.max(0, p.life); f.fillStyle = p.lime ? colLime : colText;
        if (p.sq) { f.save(); f.translate(p.x, p.y); f.rotate(p.rot); f.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); f.restore(); }
        else { f.beginPath(); f.arc(p.x, p.y, p.r, 0, 6.283); f.fill(); }
      }
      f.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }

  function init() {
    colors(); resize(); scan(); eyeList = eyes();
    addEventListener("resize", resize);
    if (!reduce) requestAnimationFrame(frame);
    else staticGrid();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  window.LF = { shock, confetti, buzz, rescan: () => { scan(); eyeList = eyes(); }, refreshColors: colors, reduce };
})();
