// ─── Go-Gyms · Muy pronto ─────────────────────────────────────────────────────────────────────────
// La sala de Gogo (la escena del login elegido, gogyms_fe/docs/propuestas/login-v5/gogo.html, y su
// motor en components/login/scene) convertida en un recorrido: el mismo Gogo, el mismo esqueleto, la
// misma sala con la lámpara, el neón de las GG, la colchoneta, la puerta y los discos. Cada capítulo del
// texto (scroll con snap) le dice a Gogo qué hacer y qué pantalla proyectar. Sin dependencias.
(() => {
"use strict";
document.documentElement.classList.add("js");
const $ = (id) => document.getElementById(id);
const mq = matchMedia("(prefers-reduced-motion: reduce)");
let RM = mq.matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
const V = "#9B5DE5", LAV = "#C9A8FF", RED = "#F53756", GOLD = "#F5B83D", DECO = "#7CC4FF";

// ── Curvas de tiempo y resortes (los del motor de la entrada) ─────────────────
const EZ = {
  lin: (t) => t, in: (t) => t * t * t, out: (t) => 1 - (1 - t) ** 3, in2: (t) => t * t, out2: (t) => 1 - (1 - t) ** 2,
  io: (t) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  back: (t) => { const c = 1.9, c3 = c + 1; return 1 + c3 * (t - 1) ** 3 + c * (t - 1) ** 2; },
  step: (t) => (t < 1 ? 0 : 1),
};
function sample(k, t) {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) {
    const a = k[i - 1], b = k[i], f = (t - a[0]) / (b[0] - a[0] || 1);
    return lerp(a[1], b[1], EZ[b[2] || "io"](f));
  }
  return k[k.length - 1][1];
}
class Spr {
  constructor(v, k = 300, d = 24) { this.x = v; this.t = v; this.v = 0; this.k = k; this.d = d; }
  step(dt) {
    if (RM) { this.x = this.t; this.v = 0; return this.x; }
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) { const a = this.k * (this.t - this.x) - this.d * this.v; this.v += a * h; this.x += this.v * h; }
    return this.x;
  }
  snap(v) { this.x = this.t = v; this.v = 0; }
}

// ── La pose de Gogo (en el dibujo de 200 × 200 de gogo.tsx) ───────────────────
const GZ = 420;
const REST = {
  wx: 0, wz: GZ, lift: 0, bx: 0, rot: 0, sx: 1, sy: 1,
  hLx: 24, hLy: 152, hRx: 176, hRy: 152, hLr: 6.2, hRr: 6.2,
  fLx: 78, fLy: 181, fRx: 122, fRy: 181,
  faceX: 0, faceY: 0, turn: 0, px: 0, py: 0,
  blush: .35, wide: 1, hapL: 0, hapR: 0, lidL: 1, lidR: 1, mark: 0,
  frontL: 0, frontR: 0, feetF: 0, wave: 0, run: 0, strain: 0, sweat: 0,
};
const K = {
  wx: [60, 15.5], wz: [60, 15.5], lift: [1300, 66], bx: [500, 40], rot: [460, 32], sx: [1000, 52], sy: [1000, 52],
  hLx: [430, 26], hLy: [430, 26], hRx: [430, 26], hRy: [430, 26], hLr: [420, 30], hRr: [420, 30],
  fLx: [800, 48], fLy: [800, 48], fRx: [800, 48], fRy: [800, 48],
  faceX: [260, 22], faceY: [260, 22], turn: [240, 28], px: [320, 26], py: [320, 26],
  blush: [90, 16], wide: [340, 15], hapL: [600, 44], hapR: [600, 44], lidL: [900, 50], lidR: [900, 50], mark: [260, 19], sweat: [60, 14],
};
const sp = {}; for (const k in K) sp[k] = new Spr(REST[k], K[k][0], K[k][1]);

// ── Las bocas de Gogo (la biblioteca aprobada) ────────────────────────────────
// Cada boca son 12 puntos = 4 tramos cúbicos cerrados (comisura izq, centro arriba, comisura der, centro abajo);
// cerrada, el labio de abajo repite al de arriba. Se morfean número a número con un resorte por número.
// REGLA FIJA: ninguna boca es redonda, ni más alta que ancha, ni se cierra en un anillo; con ojos abiertos,
// ninguna comisura por arriba de y 130,5 (la risa va solo con ojos felices). El bostezo lo tapa la mano.
const MOUTHS = {
  calma: [86, 131, 89, 135.5, 94, 138.5, 100, 138.5, 106, 138.5, 111, 135.5, 114, 131, 111, 135.5, 106, 138.5, 100, 138.5, 94, 138.5, 89, 135.5],
  alegria: [86, 131, 90, 133.2, 94.8, 134.2, 100, 134.2, 105.2, 134.2, 110, 133.2, 114, 131, 114, 139.8, 108, 146.6, 100, 146.6, 92, 146.6, 86, 139.8],
  risa: [83, 128.5, 88, 131.4, 94, 132.4, 100, 132.4, 106, 132.4, 112, 131.4, 117, 128.5, 117.4, 140.4, 110, 149.4, 100, 149.4, 90, 149.4, 82.6, 140.4],
  oh: [89, 133.5, 92.5, 134.4, 96, 134.6, 100, 134.6, 104, 134.6, 107.5, 134.4, 111, 133.5, 111, 140.4, 106.4, 145.6, 100, 145.6, 93.6, 145.6, 89, 140.4],
  esfuerzo: [91, 136, 94, 136.6, 97, 136.9, 100, 136.9, 103, 136.9, 106, 136.6, 109, 136, 106, 136.6, 103, 136.9, 100, 136.9, 97, 136.9, 94, 136.6],
  pensando: [96, 135.6, 99, 137, 101.5, 137.6, 104, 137.6, 106.5, 137.6, 109, 136.6, 112, 134.6, 109, 136.6, 106.5, 137.6, 104, 137.6, 101.5, 137.6, 99, 137],
  uf: [91, 136.6, 93.6, 135.1, 96.6, 135.1, 100, 136.3, 103.4, 137.5, 106.4, 137.5, 109, 136, 106.4, 137.5, 103.4, 137.5, 100, 136.3, 96.6, 135.1, 93.6, 135.1],
  cansado: [90, 134, 92.5, 136.4, 96, 137.6, 100, 137.6, 104, 137.6, 107.5, 136.4, 110, 134, 107.5, 136.4, 104, 137.6, 100, 137.6, 96, 137.6, 92.5, 136.4],
  picaro: [88, 132.8, 91, 136, 95, 137.8, 100, 137.8, 105, 137.8, 109.8, 135.4, 113, 131, 109.8, 135.4, 105, 137.8, 100, 137.8, 95, 137.8, 91, 136],
  hablaA: [87, 131.5, 90.5, 133.6, 95, 134.4, 100, 134.4, 105, 134.4, 109.5, 133.6, 113, 131.5, 112.6, 138.6, 107.4, 143.4, 100, 143.4, 92.6, 143.4, 87.4, 138.6],
  hablaE: [85.5, 131.5, 90, 133.6, 94.8, 134.4, 100, 134.4, 105.2, 134.4, 110, 133.6, 114.5, 131.5, 113.2, 136.8, 107.4, 139.8, 100, 139.8, 92.6, 139.8, 86.8, 136.8],
  hablaU: [90, 132.5, 93, 134, 96.5, 134.6, 100, 134.6, 103.5, 134.6, 107, 134, 110, 132.5, 109.6, 137.6, 105.6, 141.2, 100, 141.2, 94.4, 141.2, 90.4, 137.6],
  orgullo: [84, 129.5, 88, 135.6, 93.5, 139.6, 100, 139.6, 106.5, 139.6, 112, 135.6, 116, 129.5, 112, 135.6, 106.5, 139.6, 100, 139.6, 93.5, 139.6, 88, 135.6],
  uhoh: [92, 138.4, 94.5, 137.5, 97.2, 137.2, 100, 137.2, 102.8, 137.2, 105.5, 137.5, 108, 138.4, 105.5, 137.5, 102.8, 137.2, 100, 137.2, 97.2, 137.2, 94.5, 137.5],
  chiquita: [90.5, 132.5, 93, 135.4, 96.2, 137, 100, 137, 103.8, 137, 107, 135.4, 109.5, 132.5, 107, 135.4, 103.8, 137, 100, 137, 96.2, 137, 93, 135.4],
  guion: [87.5, 106, 91.7, 106, 95.8, 106, 100, 106, 104.2, 106, 108.3, 106, 112.5, 106, 108.3, 106, 104.2, 106, 100, 106, 95.8, 106, 91.7, 106],
};
/** Las cejas (dos cuadráticas). Se ven del todo o no se ven: nunca a medias. */
const BROWS = {
  arriba: ["M64 77Q76 66 89 73", "M111 73Q124 66 136 77"],
  pensando: ["M65 79Q76 75 88 77", "M111 71Q123 62 136 68"],
  preocupada: ["M64 80Q76 79 87 72", "M136 80Q124 79 113 72"],
  suave: ["M65 79Q77 75 89 78", "M111 78Q123 75 135 79"],
};
const fx2 = (v) => +v.toFixed(2);
function mouthPath(m) {
  const p = (i) => `${fx2(m[(i % 12) * 2])} ${fx2(m[(i % 12) * 2 + 1])}`;
  return `M${p(0)}C${p(1)} ${p(2)} ${p(3)}C${p(4)} ${p(5)} ${p(6)}C${p(7)} ${p(8)} ${p(9)}C${p(10)} ${p(11)} ${p(0)}Z`;
}
/** El relleno entra de a poco, el labio engorda un poco al abrir y la lengua es el piso (solo en las bocas grandes). */
function mouthParts(m) {
  const gap = m[19] - m[7], w = m[12] - m[0];
  return {
    d: mouthPath(m), fillOpacity: clamp((gap - 1) / 3), strokeWidth: fx2(7 + 1.5 * clamp(gap / 8)),
    tongue: { cx: fx2(m[18]), cy: fx2(m[19] - .5), rx: fx2(Math.min(8.5, w * .26)), opacity: fx2(clamp((gap - 12) / 3) * clamp((w - 22) / 6)) },
  };
}
/** Hablar: las vocales de la frase a 7 por segundo; null cuando terminó. */
function talkMouth(text, t, rate = 7) {
  const v = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^aeiou .,;:!?…]/g, "");
  const i = Math.floor(t * rate);
  if (i < 0 || i >= v.length) return null;
  const c = v[i];
  return c === "a" ? "hablaA" : c === "e" || c === "i" ? "hablaE" : c === "o" || c === "u" ? "hablaU" : "calma";
}
const mouthX = MOUTHS.calma.slice(), mouthV = new Array(24).fill(0);
function mouthStep(target, dt, k) {
  const t = MOUTHS[target], d = 2 * Math.sqrt(k), n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
  if (RM) { for (let i = 0; i < 24; i++) { mouthX[i] = t[i]; mouthV[i] = 0; } return mouthX; }
  for (let s2 = 0; s2 < n; s2++) for (let i = 0; i < 24; i++) { const a = k * (t[i] - mouthX[i]) - d * mouthV[i]; mouthV[i] += a * h; mouthX[i] += mouthV[i] * h; }
  return mouthX;
}

const jig = { x: new Spr(0, 380, 9), y: new Spr(0, 380, 9) };
function jiggle(a) { if (RM) return; jig.y.v -= a * 9; jig.x.v += a * 7; }

// ── El mundo ──────────────────────────────────────────────────────────────────
const W = {
  lamp: [0, 0, 0], neon: 0, door: 0, glow: 0, ambient: .07, markGlow: 0, cordGrab: 0,
  barVis: 0, barLift: 0, band: 0, bandFall: 0, tee: 0, tired: 0,
  flash: 0, flashX: 0, flashY: 0, freeze: 0, trauma: 0, plates: [0, 0, 0],
};
const WALL = 900;
const LAMPS = [{ x: 0, y: -262, z: 396 }, { x: 430, y: -380, z: 690 }, { x: -470, y: -380, z: 700 }];
const DOOR = { x0: -330, x1: -190, y0: -262 };
const WINS = [[-860, -520], [300, 700]], WIN_Y = [-610, -380];
const cord = { y: new Spr(-206, 260, 7), x: new Spr(-50, 260, 9) };
const rope = { a: new Spr(0, 30, 2.2) };
const plateY = [0, 1, 2].map(() => new Spr(0, 300, 13));
const cam = { x: new Spr(0, 26, 10.5), y: new Spr(0, 26, 10.5), z: new Spr(0, 26, 10.5) };
const par = { x: new Spr(0, 30, 11), y: new Spr(0, 30, 11) };

const S = { cur: 0, beamA: 0, introDone: false, covering: false, peek: false, pointer: null, pointerT: -1e9, look: null, glance: 0, arrived: false };

// Tweens del mundo (luces, puerta, prendas): con movimiento reducido, directo al final.
const tweens = {};
const getW = (k) => (k.startsWith("lamp") ? W.lamp[+k[4]] : W[k]);
const setW = (k, v) => { if (k.startsWith("lamp")) W.lamp[+k[4]] = v; else W[k] = v; };
function tw(k, to, dur = 1, delay = 0) {
  if (RM || dur <= 0) { setW(k, to); delete tweens[k]; return; }
  tweens[k] = { from: getW(k), to, t: -delay, dur };
}
function stepTweens(dt) {
  for (const k in tweens) {
    const w = tweens[k]; w.t += dt; if (w.t < 0) continue;
    const f = clamp(w.t / w.dur); setW(k, lerp(w.from, w.to, EZ.io(f))); if (f >= 1) delete tweens[k];
  }
}

// ── Lienzos y lugar ───────────────────────────────────────────────────────────
const cvB = $("back"), cB = cvB.getContext("2d"), cvF = $("front"), cF = cvF.getContext("2d");
const lm = document.createElement("canvas"), cL = lm.getContext("2d");
const probe = $("probe"), holo = $("holo"), holoIn = holo.querySelector(".holo-in"), wrap = $("gogoWrap"), bub = $("bubble"), hit = $("gogoHit");
let VW = 0, VH = 0, D = 1;
const phone = () => VW <= 760;
const LY = { k: 1, ax: 0, ground: 0, cx: 0 };
let holoR = { x: 0, y: 0, w: 300, h: 380 };
let Cx0 = 0, Cy0 = 0, F = 1, camX = 0, camY = -150, camZ = 0, shX = 0, shY = 0;
let grain, vign, cone;

function layout() {
  VW = innerWidth; VH = probe.offsetHeight || innerHeight;
  const ph = phone();
  holo.classList.toggle("ph", ph);
  // La caja del dibujo de las pantallas: en el teléfono, más ancha y más baja (cada una guarda una línea secundaria).
  const DW = ph ? 340 : 300, DH = ph ? 290 : 380;
  if (ph) {
    // La escena va entera arriba del texto: se mide dónde empieza el texto de cada parada (con la altura que de
    // verdad se ve, la de la sección: las barras del navegador incluidas) y su degradé de 44 px. La pantalla
    // arriba, a todo el ancho; Gogo abajo, con 24 px de aire. Si no entra, se achican Gogo y la pantalla.
    LY.tops = sections.map((sec) => sec.querySelector(".ch-in").getBoundingClientRect().top - sec.getBoundingClientRect().top);
    const top = 66, B = Math.min(...LY.tops.slice(1, 12)) - 50;
    const k = clamp(Math.min(VW * .0027, (B - top - DH - 24) / 132), .5, 1.05);
    const ax = Math.round(Math.max(16 + 68 * k, VW * .3));
    Object.assign(LY, { k, ax, ground: B, cx: VW / 2 });
    holoR = { x: 14, y: top, w: VW - 28, h: Math.max(90, Math.round(B - 132 * k - 24 - top)) };
  } else {
    // En pantallas muy anchas, la escena va en un marco de 1680 px centrado.
    const FW = Math.min(VW, 1680), FX = (VW - FW) / 2;
    const k = Math.min(VH * .0024, FW * .0015);
    const w = Math.min(FW * .3, VH * .5, 640), h = Math.min(VH * .68, w * 1.3);
    // Sin pisar las etiquetas del riel, a la derecha.
    holoR = { x: Math.round(Math.min(FX + FW * .925, VW - 150) - w), y: Math.round(VH * .47 - h / 2), w: Math.round(w), h: Math.round(h) };
    const textRight = document.querySelector(".ch-in")?.getBoundingClientRect().right || FX + FW * .36;
    const ax = Math.round((textRight + holoR.x) / 2);
    Object.assign(LY, { k, ax, ground: VH * .8, cx: ax });
  }
  Object.assign(holo.style, { width: holoR.w + "px", height: holoR.h + "px" });
  // Con muy poco alto (la pantalla quedaría con escala menor a 0,65), cada pantalla muestra solo su dato
  // principal, en una caja del tamaño real (escala 1).
  const mini = ph && Math.min(holoR.w / DW, holoR.h / DH) < .8;
  holo.classList.toggle("mini", mini);
  holoIn.style.setProperty("--dw", (mini ? holoR.w : DW) + "px"); holoIn.style.setProperty("--dh", (mini ? holoR.h : DH) + "px");
  holoIn.style.setProperty("--s", mini ? "1" : Math.min(holoR.w / DW, holoR.h / DH).toFixed(3));
  // En el teléfono, la barra del recorrido es una guía: fuera del Tab (están el contador, deslizar y "Seguir").
  for (const a of document.querySelectorAll(".rail a")) ph ? a.setAttribute("tabindex", "-1") : a.removeAttribute("tabindex");
  const c = camFor(S.cur); cam.x.t = c.x; cam.y.t = c.y; cam.z.t = c.z;
}
function resize() {
  layout();
  // Tope de densidad: en pantallas enormes, menos píxeles (no se notan y el cuadro a cuadro no se frena).
  D = Math.min(devicePixelRatio || 1, phone() ? 1.5 : VW * VH > 2e6 ? 1.25 : 1.75);
  for (const c of [cvB, cvF]) { c.width = Math.round(VW * D); c.height = Math.round(VH * D); }
  lm.width = Math.ceil(VW / 2); lm.height = Math.ceil(VH / 2);
  vign = document.createElement("canvas"); vign.width = vign.height = 256;
  const v = vign.getContext("2d"), g = v.createRadialGradient(128, 118, 40, 128, 128, 182);
  g.addColorStop(0, "rgba(4,3,8,0)"); g.addColorStop(.7, "rgba(4,3,8,.25)"); g.addColorStop(1, "rgba(4,3,8,.78)");
  v.fillStyle = g; v.fillRect(0, 0, 256, 256);
  aim(true);
  kick();
}
function buildSprites() {
  grain = document.createElement("canvas"); grain.width = grain.height = 192;
  const g = grain.getContext("2d"), id = g.createImageData(192, 192);
  for (let i = 0; i < id.data.length; i += 4) { const n = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = n; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0);
  cone = document.createElement("canvas"); cone.width = 256; cone.height = 512;
  const c = cone.getContext("2d"); c.filter = "blur(14px)";
  const gr = c.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "rgba(255,226,186,.9)"); gr.addColorStop(.35, "rgba(255,214,170,.35)"); gr.addColorStop(1, "rgba(255,200,160,0)");
  c.fillStyle = gr; c.beginPath(); c.moveTo(100, 18); c.lineTo(156, 18); c.lineTo(236, 500); c.lineTo(20, 500); c.closePath(); c.fill();
}

function P3(x, y, z) { const s = F / Math.max(z - camZ, 4); return [Cx0 + (x - camX) * s, Cy0 + (y - camY) * s, s]; }
function setT(ctx, z, d) { const s = F / Math.max(z - camZ, 4); ctx.setTransform(d * s, 0, 0, d * s, d * (Cx0 - camX * s), d * (Cy0 - camY * s)); return s; }

// ── El cuerpo en la pantalla ──────────────────────────────────────────────────
const VB = { x: -100, y: -140 };
let gS = 1, gOX = 0, gOY = 0;
const R = { bx: 0, lift: 0, rot: 0, sxx: 1, syy: 1 };
function sqPt(x, y) { return [100 + (x - 100) * R.sxx, 184 + (y - 184) * R.syy]; }
function rootPt(x, y) {
  const a = R.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), dx = x - 100, dy = y - 184;
  return [100 + dx * c - dy * s + R.bx, 184 + dx * s + dy * c + R.lift];
}
function toScreen(x, y, inSq) { let p = inSq ? sqPt(x, y) : [x, y]; p = rootPt(p[0], p[1]); return [gOX + (p[0] - VB.x) * gS, gOY + (p[1] - VB.y) * gS]; }

// ── Lo que dice ───────────────────────────────────────────────────────────────
// Cada frase dura al menos 1,8 s más 75 ms por letra; si llega otra, espera su turno. La última de la
// parada no se esconde: queda hasta que se pasa a otra parada o Gogo dice otra cosa. Tocar el globo lo fija.
const talk = { q: [], at: 0, need: 0, pinned: false, timer: 0 };
const needFor = (text) => 1800 + 75 * text.length;
function say(text, o = {}) {
  if (!text) { talk.q = []; talk.pinned = false; clearTimeout(talk.timer); bub.classList.remove("on", "pinned"); return; }
  if (o.poke) talk.q = talk.q.filter((x) => !x.poke);
  talk.q.push({ text, poke: !!o.poke }); pump();
}
function pump() {
  clearTimeout(talk.timer);
  if (!talk.q.length || talk.pinned) return;
  const wait = bub.classList.contains("on") ? talk.at + talk.need - performance.now() : 0;
  if (wait > 0) { talk.timer = setTimeout(pump, wait); return; }
  const { text } = talk.q.shift();
  bub.classList.remove("on"); void bub.offsetWidth;
  bub.textContent = text; bub.classList.add("on");
  talk.text = text;
  const li = (LINES[S.cur] || []).indexOf(text); if (li >= 0) S.lineIdx = li;
  talk.at = performance.now(); talk.need = needFor(text);
  const bm = BEAM[S.cur];
  if (bm && LINES[S.cur][bm[0]] === text) S.beam = { sel: bm[1], until: talk.at + talk.need };
  if (talk.q.length) talk.timer = setTimeout(pump, talk.need);
  kick();
}
bub.addEventListener("click", () => { talk.pinned = true; clearTimeout(talk.timer); bub.classList.add("pinned"); });

// ── Partículas ────────────────────────────────────────────────────────────────
const parts = [];
const few = () => (phone() ? .5 : 1);
const floorRings = [];
function ringFloor(a) { if (RM) return; floorRings.push({ wx: sp.wx.x + R.bx, wz: sp.wz.x, a: Math.min(1, a * 4), life: 0 }); }
function sparks(x, y, n, cols, spd = 420, g = 500) { if (RM) return; for (let i = 0; i < n * few(); i++) { const a = Math.random() * TAU, v = spd * (.4 + Math.random() * .8); parts.push({ t: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * .25, g, c: cols[i % cols.length], life: 0, max: .45 + Math.random() * .35 }); } }
function stars(x, y, n, spd = 260) { if (RM) return; if (phone() && holoOn) spd *= .32; for (let i = 0; i < n * few(); i++) { const a = Math.random() * TAU, v = spd * (.3 + Math.random() * .7); parts.push({ t: "star", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, r: 4 + Math.random() * 6, rot: Math.random() * 3, vr: (Math.random() - .5) * 8, c: Math.random() < .7 ? GOLD : "#ffe3a3", life: 0, max: .7 + Math.random() * .4 }); } }
function confetti(x, y, n) { if (RM || (phone() && holoOn)) return; const cols = [V, GOLD, DECO, LAV, RED]; for (let i = 0; i < n * few(); i++) { const a = -Math.PI / 2 + (Math.random() - .5) * 2.4, v = (380 + Math.random() * 520) * (phone() && holoOn ? .45 : 1); parts.push({ t: "conf", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: cols[i % 5], w: 6 + Math.random() * 5, h: 10 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - .5) * 18, life: 0, max: 1.8 }); } }
function ringFx(x, y, r) { if (RM) return; parts.push({ t: "ring", x, y, r, life: 0, max: .42 }); }
function shake(a) { if (!RM) W.trauma = Math.min(1, W.trauma + a); }
function landFx(a) { jiggle(a); ringFloor(a); }

// ── Las acciones: actuadas, con anticipación, golpe y asentamiento ───────────
let act = null;
function play(name, o = {}) {
  const def = ACT[name](o);
  if (act && act.prio > def.prio) return;
  act = Object.assign({ name, t: 0, ev: [], evI: 0, speed: 1, prio: 1 }, def);
  act.ev.sort((a, b) => a[0] - b[0]);
  if (RM) { act.t = act.dur; for (const e of act.ev) e[1](); act.evI = act.ev.length; }
  kick();
}

// Los ejercicios: cada repetición, un movimiento (soga, pesitas, saltos de tijera).
const EX = { type: null, P: 0, T: 0, prevPh: 0 };
const RATE = { rope: 3.1, curl: 3.2, jacks: 2.7 };
const PROP = { rope: new Spr(0, 260, 20), db: new Spr(0, 260, 20) };
let ropeB = 0, ropeSag = 1;
function setEx(type) { if (EX.type === type) return; EX.type = type; EX.P = EX.T = Math.ceil(EX.P); EX.prevPh = 0; }
function applyEx(P) {
  const ty = EX.type; PROP.rope.t = ty === "rope" ? 1 : 0; PROP.db.t = ty === "curl" ? 1 : 0;
  if (!ty) return;
  const n = Math.floor(EX.P), ph = EX.P - n, k = Math.sin(Math.PI * ph);
  if (ty === "rope") {
    P.hLx = 32; P.hLy = 148; P.hRx = 168; P.hRy = 148;
    ropeB = ph <= .76 ? ph / .76 * .75 : .75 + (ph - .76) / .24 * .25; ropeSag = ph === 0 ? 1 : 0;
    if (ph > .45 && ph < .6) { const q = Math.sin(Math.PI * (ph - .45) / .15); P.sy *= 1 - .14 * q; P.sx *= 1 + .1 * q; }
    if (ph >= .58 && ph < .95) { const q = Math.sin(Math.PI * (ph - .58) / .37); P.lift += -26 * q; P.sy *= 1 + .07 * q; P.sx *= 1 - .04 * q; P.fLy -= 3 * q; P.fRy -= 3 * q; }
    if (ph >= .92) { const q = Math.sin(Math.PI * (ph - .92) / .08); P.sy *= 1 - .1 * q; P.sx *= 1 + .07 * q; }
    const a = TAU * ropeB; P.hLx += Math.cos(a) * 4; P.hLy += Math.sin(a) * 4; P.hRx -= Math.cos(a) * 4; P.hRy += Math.sin(a) * 4;
    P.blush = .55;
    if (EX.prevPh < .92 && ph >= .92) landFx(.06);
  } else if (ty === "curl") {
    P.hLx = 30; P.hLy = 150; P.hRx = 170; P.hRy = 150;
    if (ph) { if (n % 2 === 0) { P.hLx = lerp(30, 40, k); P.hLy = lerp(150, 104, k); P.rot -= 3 * k; } else { P.hRx = lerp(170, 160, k); P.hRy = lerp(150, 104, k); P.rot += 3 * k; } P.sy *= 1 + .03 * k; P.blush = .5; }
  } else if (ty === "jacks") {
    P.hLx = lerp(24, 4, k); P.hLy = lerp(152, 46, k); P.hRx = lerp(176, 196, k); P.hRy = lerp(152, 46, k);
    P.fLx = 78 - 16 * k; P.fRx = 122 + 16 * k;
    if (ph) { const h = Math.abs(Math.sin(TAU * ph)); P.lift += -14 * h; P.sy *= 1 + .07 * h - .05 * (1 - h); P.sx *= 1 - .04 * h + .04 * (1 - h); P.blush = .55; }
  }
  EX.prevPh = ph;
}

// ── Las escenas actuadas ──────────────────────────────────────────────────────
const ACT = {
  // Las luces: en lo oscuro solo brillan las GG. Parpadean, son los ojos de Gogo; salta, tira de la cuerda y se prende el gym.
  intro: () => ({
    prio: 9, dur: 4.7,
    tr: {
      mark: [[0, 1], [1.4, 1], [1.8, 0, "back"]],
      "W.markGlow": [[0, 0], [.3, 0], [.32, 1, "lin"], [.38, .15, "lin"], [.44, 1, "lin"], [.56, .4, "lin"], [.62, 1, "lin"], [2.56, 1], [3.1, 0]],
      lidL: [[0, 1], [1.02, 1], [1.1, .06, "in"], [1.22, 1, "out"]], lidR: [[0, 1], [1.02, 1], [1.1, .06, "in"], [1.22, 1, "out"]],
      px: [[0, 0], [1.85, 0], [2.0, -1.5], [2.7, -1.5], [2.95, 0]], py: [[0, 0], [1.85, 0], [2.0, -5.5], [2.7, -5], [2.95, 0]],
      faceY: [[0, 0], [1.85, 0], [2.0, -4], [2.7, -3], [2.95, 0]],
      
      
      sy: [[0, 1], [1.98, 1], [2.1, .84, "out"], [2.22, 1.15, "out"], [2.42, 1.06], [2.5, 1.22], [2.58, 1.12], [2.66, .8, "in"], [2.78, 1.07, "out"], [2.92, 1], [3.12, .9], [3.22, 1.07], [3.36, 1]],
      sx: [[0, 1], [1.98, 1], [2.1, 1.13, "out"], [2.22, .9, "out"], [2.42, .96], [2.5, .86], [2.58, .92], [2.66, 1.17, "in"], [2.78, .96, "out"], [2.92, 1], [3.12, 1.08], [3.22, .95], [3.36, 1]],
      lift: [[0, 0], [2.1, 0], [2.3, -48, "out"], [2.44, -38, "in2"], [2.56, -10, "in"], [2.66, 0, "in"], [3.12, 0], [3.25, -12, "out"], [3.38, 0, "in"]],
      hRx: [[0, 176], [2.0, 176], [2.2, 150], [2.6, 148], [2.85, 176], [3.15, 176], [3.3, 188], [4.4, 188], [4.65, 176]],
      hRy: [[0, 152], [2.0, 152], [2.22, 6, "out"], [2.46, 12], [2.56, 30], [2.62, 40], [2.85, 152, "out"], [3.15, 152], [3.3, 72, "back"], [4.4, 72], [4.65, 152]],
      hLx: [[0, 24], [2.1, 24], [2.3, 10], [2.62, 14], [2.9, 24]], hLy: [[0, 152], [2.1, 152], [2.3, 118], [2.62, 126], [2.9, 152]],
      hRr: [[0, 6.2], [2.0, 6.2], [2.15, 9], [2.8, 9], [2.95, 6.2], [3.2, 6.2], [3.3, 9], [4.4, 9], [4.6, 6.2]],
      wave: [[0, 0], [3.25, 0], [3.35, 1], [4.3, 1], [4.5, 0]],
      blush: [[0, 0], [2.9, .35], [3.3, .6], [4.6, .4]],
      "W.lamp0": [[0, 0], [2.56, 0], [2.57, 1, "lin"], [2.61, .12, "lin"], [2.65, 1, "lin"], [2.7, .55, "lin"], [2.73, 1, "lin"]],
      "W.lamp1": [[0, 0], [2.8, 0], [2.81, 1, "lin"], [2.85, .2, "lin"], [2.9, 1, "lin"]],
      "W.lamp2": [[0, 0], [2.97, 0], [2.98, 1, "lin"], [3.02, .3, "lin"], [3.08, 1, "lin"]],
      "W.neon": [[0, 0], [3.12, 0], [3.14, 1, "lin"], [3.18, .1, "lin"], [3.24, .9, "lin"], [3.28, .3, "lin"], [3.36, 1, "lin"]],
      "W.cordGrab": [[0, 0], [2.25, 0], [2.26, 1, "lin"], [2.63, 1], [2.64, 0, "lin"]],
      "W.ambient": [[0, .07], [2.56, .07], [2.75, .26]],
    },
    ev: [
      [2.57, () => { shake(.32); dustBurst(0); }], [2.66, () => landFx(.28)], [2.81, () => shake(.12)], [2.98, () => shake(.1)],
      [3.3, () => { if (S.cur === 0) say(line(0, 0)); }],
    ],
    face: (t) => ({ m: t < 2.6 ? "calma" : "alegria" }),
    end: () => { S.introDone = true; enterChapter(S.cur, true); },
  }),
  wave: (o) => ({
    face: () => ({ m: "alegria" }), prio: 1, dur: 1.6,
    tr: {
      sy: [[0, 1], [.08, .88], [.2, 1.07], [.34, 1]], sx: [[0, 1], [.08, 1.1], [.2, .95], [.34, 1]], lift: [[0, 0], [.08, 0], [.2, -12, "out"], [.34, 0, "in"]],
      hRx: [[0, 176], [.18, 188], [1.3, 188], [1.6, 176]], hRy: [[0, 152], [.2, 72, "back"], [1.3, 72], [1.6, 152]],
      hRr: [[0, 6.2], [.18, 9], [1.3, 9], [1.6, 6.2]], wave: [[0, 0], [.2, 1], [1.2, 1], [1.4, 0]], blush: [[0, .35], [.3, .6], [1.6, .45]],
    },
    ev: [[.34, () => landFx(.08)], [.12, () => o.text && say(o.text)]],
  }),
  // Un saltito de emoción, con los ojos felices.
  hop: (o) => ({
    face: () => ({ m: o.mouth || "risa" }), prio: 1, dur: .75,
    tr: {
      sy: [[0, 1], [.08, .86, "out"], [.2, 1.1], [.36, .9, "in"], [.5, 1.03], [.62, 1]], sx: [[0, 1], [.08, 1.12, "out"], [.2, .94], [.36, 1.1, "in"], [.5, .98], [.62, 1]],
      lift: [[0, 0], [.08, 0], [.22, -24, "out"], [.36, 0, "in"]],
      hapL: [[0, 0], [.08, 1], [.55, 1], [.65, 0]], hapR: [[0, 0], [.08, 1], [.55, 1], [.65, 0]], blush: [[0, .4], [.2, .75], [.75, .5]],
    },
    ev: [[.36, () => landFx(.1)], [.05, () => o.text && say(o.text)]],
  }),
  // Festeja: salta con los dos brazos arriba y tira papelitos.
  cheer: (o) => ({
    face: () => ({ m: "risa" }), prio: 3, dur: 1.5,
    tr: {
      sy: [[0, 1], [.1, .82, "out"], [.24, 1.12], [.5, 1.02], [.62, .84, "in"], [.74, 1.06], [.9, 1]],
      sx: [[0, 1], [.1, 1.14, "out"], [.24, .92], [.5, .98], [.62, 1.14, "in"], [.74, .96], [.9, 1]],
      lift: [[0, 0], [.1, 0], [.36, -50, "out"], [.62, 0, "in"]],
      hLx: [[0, 24], [.14, 4], [1.15, 4], [1.45, 24]], hLy: [[0, 152], [.14, 46], [1.15, 46], [1.45, 152]],
      hRx: [[0, 176], [.14, 196], [1.15, 196], [1.45, 176]], hRy: [[0, 152], [.14, 46], [1.15, 46], [1.45, 152]],
      hapL: [[0, 0], [.1, 1], [1.2, 1], [1.35, 0]], hapR: [[0, 0], [.1, 1], [1.2, 1], [1.35, 0]],
      blush: [[0, .4], [.2, .85], [1.5, .55]],
    },
    ev: [[.22, () => { const [x, y] = toScreen(100, 40); confetti(x, y, o.n || 46); }], [.62, () => landFx(.18)], [.05, () => o.text && say(o.text)]],
  }),
  // "¡Sí!": levanta el puño (redondo, sin dedos) y lo baja de un golpe, con los ojos felices.
  yes: (o) => ({
    face: (t) => ({ m: t < .5 ? "alegria" : "risa" }), prio: 1, dur: 1.5,
    tr: {
      hRx: [[0, 176], [.16, 186], [.34, 182], [.5, 150, "in"], [1.15, 150], [1.5, 176]],
      hRy: [[0, 152], [.16, 96, "out"], [.34, 92], [.5, 136, "in"], [1.15, 136], [1.5, 152]],
      hRr: [[0, 6.2], [.14, 9], [1.2, 9], [1.5, 6.2]], frontR: [[0, 0], [.44, 1, "step"], [1.2, 1], [1.21, 0, "step"]],
      sy: [[0, 1], [.12, 1.06], [.5, .86, "out"], [.64, 1.06], [.78, 1]], sx: [[0, 1], [.12, .96], [.5, 1.12, "out"], [.64, .96], [.78, 1]],
      hapL: [[0, 0], [.45, 0], [.5, 1], [1.2, 1], [1.35, 0]], hapR: [[0, 0], [.45, 0], [.5, 1], [1.2, 1], [1.35, 0]],
      blush: [[0, .4], [.5, .85], [1.5, .55]],
    },
    ev: [[.1, () => o.text && say(o.text)], [.5, () => { jiggle(.12); const [x, y] = toScreen(150, 136, true); sparks(x, y, 10, [GOLD, DECO, "#fff"], 260, 300); }]],
  }),
  poke: () => ({
    face: () => ({ m: "risa", talk: false }), prio: 1, dur: .9,
    tr: { sy: [[0, 1], [.07, .8, "out"], [.2, 1.12], [.34, .95], [.48, 1.03], [.6, 1]], sx: [[0, 1], [.07, 1.18, "out"], [.2, .92], [.34, 1.04], [.48, .98], [.6, 1]],
      hapL: [[0, 0], [.06, 1], [.7, 1], [.85, 0]], hapR: [[0, 0], [.06, 1], [.7, 1], [.85, 0]], blush: [[0, .4], [.1, .8], [.9, .5]] },
    ev: [[.05, () => say(["¡Jiji! Cosquillas no.", "¡Eh! Yo también entreno.", "¡Qué ganas de que abramos!", "¿Viste todo lo que viene?"][(S.pokes = (S.pokes || 0) + 1) % 4], { poke: true })]],
  }),
  // La barra con los tres discos: la levanta por encima de la cabeza (un récord).
  lift: (o) => ({
    face: (t) => (t < .3 ? { m: "calma" } : t < 1.0 ? { m: "esfuerzo", eyes: "squeeze", talk: false } : t < 2.0 ? { m: "risa" } : { m: "alegria" }), prio: 4, dur: 2.7,
    tr: {
      sy: [[0, 1], [.3, .8], [.62, 1.08], [.74, .9], [1.0, 1.14], [1.75, 1.12], [2.0, .86], [2.2, 1.04], [2.4, 1]], sx: [[0, 1], [.3, 1.14], [.62, .95], [.74, 1.08], [1.0, .92], [1.75, .93], [2.0, 1.12], [2.2, .97], [2.4, 1]],
      lift: [[0, 0], [.74, 0], [1.0, -6], [1.75, -6], [1.95, 0]],
      hLx: [[0, 24], [.3, 50], [1.0, 54], [1.8, 54], [2.0, 50], [2.4, 50], [2.7, 24]], hRx: [[0, 176], [.3, 150], [1.0, 146], [1.8, 146], [2.0, 150], [2.4, 150], [2.7, 176]],
      hLy: [[0, 152], [.3, 184], [.62, 140], [.74, 146], [1.0, 12, "out"], [1.75, 12], [2.0, 184, "in"], [2.4, 184], [2.7, 152]], hRy: [[0, 152], [.3, 184], [.62, 140], [.74, 146], [1.0, 12, "out"], [1.75, 12], [2.0, 184, "in"], [2.4, 184], [2.7, 152]],
      frontL: [[0, 0], [.1, 1, "step"], [2.5, 1], [2.51, 0, "step"]], frontR: [[0, 0], [.1, 1, "step"], [2.5, 1], [2.51, 0, "step"]],
      "W.barLift": [[0, 0], [.32, 0], [.33, 1, "step"], [2.38, 1], [2.39, 0, "step"]],
      hapL: [[0, 0], [1.05, 0], [1.1, 1], [1.7, 1], [1.8, 0]], hapR: [[0, 0], [1.05, 0], [1.1, 1], [1.7, 1], [1.8, 0]],
      blush: [[0, .4], [1.0, .85], [2.7, .5]], strain: [[0, 0], [.62, 1, "step"], [.98, 1], [.99, 0, "step"]],
      py: [[0, 0], [1.0, -4], [1.7, -4], [2.0, 0]],
    },
    ev: [
      [1.02, () => { const [x, y] = toScreen(100, 12); stars(x, y, 18); W.flash = .45; W.flashX = x; W.flashY = y; if (o.big) confetti(x, y, 50); }],
      [1.0, () => o.text && say(o.text)],
      [2.0, () => { shake(.22); ringFloor(.25); jiggle(.18); }],
    ],
  }),
  // Chocala: viene, levanta la mano abierta y choca los cinco con vos (el golpe congela un instante).
  hi5: (o) => ({
    face: (t) => ({ m: t < .62 ? "alegria" : "risa" }), prio: 3, dur: 1.6,
    tr: {
      sy: [[0, 1], [.16, .84, "out"], [.28, 1.1], [.42, 1], [.62, 1.04], [.7, .82, "out"], [.84, 1.08], [1.0, 1]],
      sx: [[0, 1], [.16, 1.13, "out"], [.28, .93], [.42, 1], [.62, .97], [.7, 1.2, "out"], [.84, .94], [1.0, 1]],
      lift: [[0, 0], [.16, 0], [.34, -18, "out"], [.5, 0, "in"]],
      hRx: [[0, 176], [.16, 176], [.5, 140], [.66, 132], [.86, 150], [1.25, 176]],
      hRy: [[0, 152], [.16, 152], [.5, 44, "out"], [.66, 38], [.86, 66], [1.25, 152]],
      hRr: [[0, 6.2], [.4, 9], [.64, 26, "out"], [.74, 22], [1.0, 6.2]], frontR: [[0, 0], [.3, 1, "step"], [1.05, 1], [1.06, 0, "step"]],
      hapL: [[0, 0], [.1, 1], [.4, 1], [.5, 0], [.72, 0], [.78, 1], [1.3, 1], [1.45, 0]], hapR: [[0, 0], [.1, 1], [.4, 1], [.5, 0], [.72, 0], [.78, 1], [1.3, 1], [1.45, 0]],
      blush: [[0, .4], [.2, .8], [1.6, .6]],
    },
    ev: [
      [.06, () => o.text && say(o.text)],
      [.68, () => { W.freeze = .09; const [x, y] = toScreen(132, 28); W.flash = 1; W.flashX = x; W.flashY = y; ringFx(x, y, 40 * gS); sparks(x, y, 30, [GOLD, LAV, DECO, "#fff"], 600); shake(.4); }],
    ],
  }),
  // El vestidor: la vincha cae del cielo girando y se le pone; después le aparece la remera de su gym, y festeja.
  dress: () => ({
    face: (t) => (t < .2 ? { m: "cansado", heavy: 1 } : t < .95 ? { m: "oh", brow: "arriba", talk: false } : t < 2.45 ? { m: "risa" } : { m: "orgullo" }), prio: 4, dur: 3.6,
    tr: {
      "W.tired": [[0, 1], [.2, 0]],
      "W.bandFall": [[0, 0], [.1, 0], [.9, 1, "in2"]], "W.band": [[0, 0], [.89, 0], [.9, 1, "step"]],
      wide: [[0, 1], [.2, 1.22], [.88, 1.18], [1.1, 1]], 
      py: [[0, 0], [.2, -6], [.85, -5.5], [1.0, 0]], faceY: [[0, 0], [.2, -5], [.85, -4], [1.05, 0]], 
      
      sy: [[0, 1], [.88, 1], [.92, .84, "out"], [1.04, 1.1], [1.18, .92], [1.3, 1], [2.38, 1], [2.48, .84, "out"], [2.62, 1.12], [2.9, .86, "in"], [3.02, 1]],
      sx: [[0, 1], [.88, 1], [.92, 1.12, "out"], [1.04, .93], [1.18, 1.06], [1.3, 1], [2.38, 1], [2.48, 1.14, "out"], [2.62, .92], [2.9, 1.12, "in"], [3.02, 1]],
      lift: [[0, 0], [2.48, 0], [2.7, -44, "out"], [2.9, 0, "in"]],
      hapL: [[0, 0], [.96, 0], [1.0, 1], [1.5, 1], [1.6, 0], [2.45, 0], [2.5, 1], [3.6, 1]], hapR: [[0, 0], [.96, 0], [1.0, 1], [1.5, 1], [1.6, 0], [2.45, 0], [2.5, 1], [3.6, 1]],
      hLx: [[0, 24], [1.0, 24], [1.2, 66], [1.9, 66], [2.1, 24], [2.5, 4], [3.6, 4]], hLy: [[0, 152], [1.0, 152], [1.2, 70], [1.9, 70], [2.1, 152], [2.5, 46], [3.6, 46]],
      hRx: [[0, 176], [1.0, 176], [1.2, 134], [1.9, 134], [2.1, 176], [2.5, 196], [3.6, 196]], hRy: [[0, 152], [1.0, 152], [1.2, 70], [1.9, 70], [2.1, 152], [2.5, 46], [3.6, 46]],
      "W.tee": [[0, 0], [1.95, 0], [2.3, 1]], blush: [[0, .3], [1.0, .8], [3.6, .7]],
    },
    ev: [
      [.9, () => { W.bandFall = 0; const [x, y] = toScreen(100, 70, true); stars(x, y, 22); shake(.14); jiggle(.3); W.flash = .5; W.flashX = x; W.flashY = y; }],
      [1.0, () => say(line(11, 1))],
      [2.0, () => { const [x, y] = toScreen(100, 56, true); sparks(x, y, 26, [GOLD, "#fff", LAV], 380, 200); }],
      [2.45, () => say(line(11, 2))],
      [2.55, () => { const [x, y] = toScreen(100, 40); confetti(x, y, 60); }],
      [2.9, () => landFx(.2)],
    ],
  }),
};

// ── El recorrido: qué hace Gogo en cada parada ─────────────────────────────────
const sections = [...document.querySelectorAll(".ch")];
const railLinks = [...document.querySelectorAll(".rail a")];
const countEl = $("count");
let timers = [];
const later = (ms, fn) => timers.push(setTimeout(fn, ms));
const every = (ms, fn, first = ms) => { const run = () => { fn(); timers.push(setTimeout(run, ms * (.85 + Math.random() * .3))); }; timers.push(setTimeout(run, first)); };
function clearTimers() { timers.forEach(clearTimeout); timers = []; }

// Dónde está la cámara y dónde va Gogo en cada parada (en la sala).
function tourCamX() { return (LY.cx - LY.ax) / LY.k; }
function camFor(i) {
  const F0 = LY.k * GZ, Cy0b = LY.ground - 150 * LY.k;
  if (i === 0) {
    if (!phone() || !LY.tops) return { x: 0, y: 0, z: phone() ? 40 : 24 };
    // Teléfono: Gogo grande, centrado y entero arriba del texto, con la lámpara y el neón encima.
    const B0 = LY.tops[0] - 50, gh = clamp((B0 - 66) / 2.25, 60, VW * .5), s0 = gh / 124;
    return { x: 0, y: 150 - (B0 - Cy0b) / s0, z: GZ - F0 / s0 };
  }
  if (i === 12) {
    const z = 180, sw = F0 / (WALL - z);
    const target = phone() ? VW * .5 : VW * .6;
    if (!phone() || !LY.tops) return { x: -260 - (target - LY.cx) / sw, y: 0, z };
    // Teléfono: la puerta y Gogo llenan el lugar que deja el texto del final: los pies de Gogo justo antes
    // del degradé y el marco de la puerta cerca de la barra de arriba (se busca el acercamiento que lo cumple).
    const B12 = LY.tops[12] - 50;
    let best = null;
    for (let zz = 600; zz >= -900; zz -= 10) {
      const y = 150 - (B12 - Cy0b) * (760 - zz) / F0, doorTop = Cy0b + (-262 + 150 - y) * F0 / (WALL - zz);
      // Gogo entero en la pantalla y no más de 1,4 veces su tamaño de siempre.
      const sG = F0 / (760 - zz), camX0 = -260 - (target - LY.cx) / (F0 / (WALL - zz)), gRight = LY.cx + (-150 - camX0) * sG + 70 * sG;
      if (gRight > VW - 8 || sG > LY.k * 1.4) continue;
      const d = Math.abs(doorTop - 84);
      if (!best || d < best.d) best = { d, y, z: zz };
    }
    if (!best) best = { y: 150 - (B12 - Cy0b) * 580 / F0, z: 180 };
    return { x: -260 - (target - LY.cx) / (F0 / (WALL - best.z)), y: best.y, z: best.z };
  }
  return { x: tourCamX(), y: 0, z: 0 };
}
function gogoAt(i) {
  if (i === 10) {
    const c = camFor(10), wz = phone() ? GZ : 340, s = LY.k * GZ / (wz - c.z);
    return { wx: c.x + (holoR.x + holoR.w * .5 - LY.cx) / s, wz };
  }
  if (i === 12) return { wx: -150, wz: 760 };
  return { wx: 0, wz: GZ };
}
const LINES = [
  ["¡Hola! Ya prendí todo. ¿Te muestro lo que viene?", "¡Deslizá! Hay mucho para ver."],
  ["¡Soy Gogo! Y voy con vos a cada gym."],
  ["¡Mirá cómo cambia! Este pase es solo tuyo."],
  ["Una… dos… ¡estas pesitas me encantan!"],
  ["¡Récord nuevo! Directo a la vitrina."],
  ["Nada de promesas mágicas: solo lo que vos hacés.", "¡Ey, llegás! Si seguís así."],
  ["¡Otra semana cumplida! Mirá cómo brilla tu año."],
  ["¡Te guardé el lugar de al lado!"],
  ["¡Chocala! Esto es en equipo."],
  ["Uy… esto todavía no te lo puedo mostrar.", "Bueno… solo un poquito.", "¡No le cuentes a nadie!"],
  ["¡Alto! Esto es para los gyms.", "Si tenés uno… te va a encantar."],
  ["Uf… si no entrenamos, me canso un poco.", "¡Pieza nueva!", "Y la remera de tu gym. ¡A entrenar!", "Hay piezas que ni yo vi todavía."],
  ["Shhh… lo mejor está del otro lado de esta puerta.", "Ya casi. ¡Volvé pronto!"],
];
// Si ya vino antes (solo una marca en este navegador, nada personal), Gogo lo saluda distinto.
let back = false;
try { back = localStorage.getItem("gg-pronto") === "1"; localStorage.setItem("gg-pronto", "1"); } catch { /* sin almacenamiento: el saludo de siempre */ }
if (back) LINES[0][0] = "¡Volviste! La puerta sigue cerrada… pero ya falta menos.";
document.querySelectorAll(".ch").forEach((sec, n) => { const p = sec.querySelector("[data-gogo]") || sec.querySelector(".sr-only"); if (p && LINES[n]) p.textContent = "Gogo dice: " + LINES[n].join(" "); });
const line = (i, n) => LINES[i][n];
// Lo que Gogo destaca en cada pantalla con una línea de luz (con la mano entera), mientras dice esa frase.
const BEAM = { 1: [0, ".s1 .net"], 2: [0, ".s2 .qr-card"], 3: [0, ".s3 .sug"], 4: [0, ".s4 .tro.new"], 5: [1, ".s5 .verdict"], 6: [0, ".s6 .sky"], 7: [0, ".s7 .you"], 8: [0, ".s8 .fz"], 11: [3, ".s11 .q"] };
// Con movimiento reducido, todo lo que dice en la parada, junto y fijo.
const sayAll = (i) => say(LINES[i].join(" "));
const HOLO = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

// La pose que mantiene en cada parada (después de su gesto de entrada).
function holdPose(P, t) {
  const i = S.cur;
  // Muestra la pantalla con el brazo extendido y la mano entera.
  if (i === 1) { P.hRx = 206; P.hRy = 124; P.hRr = 9; P.rot += 4; P.blush = .55; }
  // Aplaude: las dos manos redondas se juntan delante del pecho.
  else if (i === 2) {
    const k = RM ? .55 : Math.abs(Math.sin(t * 6.5)), sep = 1 + 16 * k;
    P.hLx = 90 - sep; P.hRx = 110 + sep; P.hLy = P.hRy = 162 - 5 * k; P.hLr = P.hRr = 10; P.frontL = P.frontR = 1;
    if (k < .12 && !S.clapped && !RM) { S.clapped = 1; const [x, y] = toScreen(100, 150, true); sparks(x, y, 6, [GOLD, DECO, "#fff"], 200, 120); } else if (k > .4) S.clapped = 0;
    P.blush = .65; P.hapL = P.hapR = .7;
  }
  // Habla con la mano en el pecho.
  else if (i === 5) { P.hLx = 84; P.hLy = 150; P.hLr = 9; P.frontL = 1; P.rot -= 2; }
  // "¡No le cuentes a nadie!": pícaro, con la mano entera junto a la boca.
  else if (i === 9 && S.lineIdx >= 2) { P.hRx = 130; P.hRy = 138; P.hRr = 10; P.frontR = 1; P.blush = .7; }
  else if (i === 10 && S.arrived) { P.hLx = 0; P.hLy = 104; P.hRx = 200; P.hRy = 104; P.hLr = 9; P.hRr = 9; P.blush = .5; P.sx *= 1.04; }
  else if (i === 12 && S.arrived) {
    // Se tapa la boca con la mano entera (es un secreto); con "Ya casi. ¡Volvé pronto!" la baja y saluda.
    if (S.lineIdx >= 1) { P.hRx = 188; P.hRy = 72; P.hRr = 9; P.wave = 1; P.blush = .6; }
    else { P.hRx = 100 + sp.turn.x * 24 * .76 + sp.faceX.x; P.hRy = 140; P.hRr = 17; P.frontR = 1; P.blush = .75; }
    P.turn = S.glance ? -.62 : 0;
  }
  if (W.tired > .01) {
    const q = W.tired;
    // Cansado: el párpado pesado (lo pone la cara) y se achica apenas; nunca se derrite.
    P.sy *= 1 - .05 * q + Math.sin(t * 1.2) * .01 * q; P.sx *= 1 + .05 * q; P.hLy += 8 * q; P.hRy += 8 * q; P.hLx += 4 * q; P.hRx -= 4 * q;
    P.sweat = q; P.rot += Math.sin(t * .8) * 2 * q; P.blush *= 1 - .6 * q;
  }
}

// La cara de cada momento (la tabla del analista): boca, cejas, ojos de esfuerzo y párpado pesado.
const FACE_DEF = { 0: "alegria", 1: "calma", 2: "risa", 3: "calma", 4: "alegria", 5: "calma", 6: "alegria", 7: "alegria", 8: "alegria", 9: "calma", 10: "alegria", 11: "orgullo", 12: "alegria" };
function faceFor(now, moving) {
  const i = S.cur, li = S.lineIdx, f = { m: FACE_DEF[i] || "alegria", brow: "", eyes: "", heavy: 0, talk: true };
  if (i === 3 && EX.type === "curl") { const ph = EX.P % 1; f.m = ph && Math.sin(Math.PI * ph) > .35 ? "esfuerzo" : "calma"; }
  else if (i === 5) { f.brow = "suave"; if (li >= 1) f.m = "alegria"; }
  else if (i === 9) { if (li <= 0) { f.m = "uhoh"; f.brow = "preocupada"; } else if (li >= 2) f.m = "picaro"; }
  else if (i === 10 && li <= 0 && talk.at > S.chT && now - talk.at < 900) Object.assign(f, { m: "oh", brow: "arriba", talk: false, keep: true });
  else if (i === 11) { if (W.tired > .5) Object.assign(f, { m: now - S.chT < 1700 ? "uf" : "cansado", heavy: 1 }); else if (li >= 3) Object.assign(f, { m: "pensando", brow: "pensando" }); }
  else if (i === 12 && li < 1) Object.assign(f, { m: "chiquita", talk: false });
  if (moving && !f.keep) Object.assign(f, { m: "calma", brow: "" });
  if (act && act.face) Object.assign(f, act.face(act.t));
  return f;
}

function enterChapter(i, fromIntro) {
  clearTimers();
  if (!fromIntro || S.cur !== 0) say("");
  S.arrived = false; S.glance = 0; S.covering = false; S.peek = false; S.lookLow = 0; S.beam = null; S.lineIdx = -1; S.chT = performance.now();
  const lit = S.introDone;
  const c = camFor(i); cam.x.t = c.x; cam.y.t = c.y; cam.z.t = c.z;
  showHolo(i);
  if (!lit) return; // la intro termina y vuelve a llamar
  // Las luces: prendidas en todo el recorrido; al final, se bajan y queda la puerta entreabierta.
  if (i === 12) {
    tw("lamp0", .2, 1.8, .2); tw("lamp1", .1, 1.8); tw("lamp2", .1, 1.8); tw("ambient", .05, 1.8); tw("neon", 0, .9, .3);
    tw("door", .17, 1.4, 1.1); tw("glow", 1, 1.4, 1.1); tw("markGlow", .5, 1.6, 1.4);
  } else {
    tw("lamp0", 1, .9); tw("lamp1", 1, .9); tw("lamp2", 1, .9); tw("ambient", .26, .9); tw("neon", 1, .6);
    tw("door", 0, .6); tw("glow", 0, .5); tw("markGlow", 0, .5);
  }
  W.barVis = i === 4 ? 1 : 0; if (i !== 4) W.plates = [0, 0, 0];
  if (i < 11) { W.band = 0; W.tee = 0; W.bandFall = 0; }
  if (i === 12) { W.band = 1; W.tee = 1; }
  W.tired = 0;
  setEx(i === 3 ? "curl" : i === 6 ? "jacks" : i === 7 ? "rope" : null);
  if (act && act.prio < 9) act = null;
  const first = fromIntro ? 900 : 350;

  if (RM) {
    // Movimiento reducido: la pose quieta, lo que corresponde a la parada y todo lo que dice, junto.
    if (i === 4) setPlates(3);
    if (i === 9) { S.covering = true; S.peek = true; }
    if (i === 11) { W.band = 1; W.tee = 1; }
    sayAll(i); S.lineIdx = LINES[i].length - 1;
    if (BEAM[i]) S.beam = { sel: BEAM[i][1], until: Infinity };
    kick(); return;
  }
  switch (i) {
    case 0:
      if (!fromIntro) later(250, () => play("hop", { text: "¿Arrancamos? ¡Deslizá y te muestro todo!" }));
      every(4200, () => { if (act) return; const r = Math.random(); play(r < .55 ? "hop" : r < .82 ? "wave" : "cheer", { n: 24 }); }, 3800);
      if (fromIntro) later(9000, () => S.cur === 0 && say(line(0, 1)));
      break;
    case 1:
      later(first, () => play("wave", { text: line(1, 0) }));
      break;
    case 2:
      later(first, () => play("yes", { text: line(2, 0) }));
      every(3000, () => qrNext(), 3000);
      break;
    case 3:
      later(first, () => say(line(3, 0)));
      break;
    case 4:
      setPlates(0);
      [0, 1, 2].forEach((n) => later(200 + n * 260, () => setPlates(n + 1)));
      later(1200, () => play("lift", { text: line(4, 0), big: true }));
      every(5200, () => play("lift", {}), 5600);
      break;
    case 5:
      later(first, () => say(line(5, 0)));
      later(4300, () => play("hop", { text: line(5, 1), mouth: "alegria" }));
      break;
    case 6:
      later(first, () => say(line(6, 0)));
      break;
    case 7:
      later(first, () => say(line(7, 0)));
      break;
    case 8:
      later(first, () => play("hi5", { text: line(8, 0) }));
      every(4600, () => play("hi5", {}), 4800);
      break;
    case 9:
      S.covering = true;
      later(first, () => say(line(9, 0)));
      every(5000, () => { S.peek = true; later(1500, () => { S.peek = false; }); }, 2700);
      later(2800, () => say(line(9, 1)));
      later(3400, () => say(line(9, 2)));
      break;
    case 10:
      later(1400, () => say(line(10, 0)));
      later(4400, () => say(line(10, 1)));
      break;
    case 11:
      W.tired = 1;
      later(first, () => say(line(11, 0)));
      later(4200, () => play("dress"));
      // Después de vestirse, mira las piezas que todavía tienen "?".
      later(9000, () => { S.lookLow = 1; say(line(11, 3)); });
      break;
    case 12:
      later(2600, () => say(line(12, 0)));
      later(6400, () => say(line(12, 1)));
      every(5200, () => { S.glance = 1; later(1500, () => { S.glance = 0; }); }, 8200);
      break;
  }
  kick();
}

function setChapter(i) {
  if (i === S.cur) return;
  S.cur = i;
  sections.forEach((s, n) => s.classList.toggle("on", n === i));
  railLinks.forEach((a, n) => (n === i ? a.setAttribute("aria-current", "step") : a.removeAttribute("aria-current")));
  countEl.innerHTML = i === 0 ? "Inicio" : i === 12 ? "Muy pronto" : `<b>${String(i).padStart(2, "0")}</b> / 11`;
  // El foco acompaña al capítulo en pantalla: el próximo Tab es su "Seguir", no el de otro.
  const inSec = document.activeElement?.closest?.(".ch");
  if (inSec && inSec !== sections[i]) sections[i].focus({ preventScroll: true });
  if (!S.introDone) { if (act && act.name === "intro") act.speed = 4; }
  enterChapter(i);
}

// Qué capítulo está en pantalla: el que cruza la mitad.
function readChapter() {
  const mid = innerHeight * .5;
  for (let n = 0; n < sections.length; n++) { const r = sections[n].getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) return n; }
  return S.cur;
}
let scrollQ = false;
addEventListener("scroll", () => { if (scrollQ) return; scrollQ = true; requestAnimationFrame(() => { scrollQ = false; setChapter(readChapter()); }); }, { passive: true });
// Las flechas a los costados también avanzan (abajo y arriba ya las hace el navegador).
addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey || /input|textarea|select/i.test(document.activeElement?.tagName || "")) return;
  const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
  if (!d) return;
  const n = clamp(S.cur + d, 0, sections.length - 1);
  if (n !== S.cur) { e.preventDefault(); sections[n].scrollIntoView({ behavior: RM ? "auto" : "smooth" }); sections[n].focus({ preventScroll: true }); }
});

// ── La pantalla holográfica ───────────────────────────────────────────────────
const screens = [...holo.querySelectorAll(".scr")];
let holoOn = false;
function showHolo(i) {
  const on = HOLO.has(i);
  screens.forEach((s) => s.classList.toggle("on", +s.dataset.s === i));
  if (on && !holoOn) { holo.classList.remove("boot"); void holo.offsetWidth; holo.classList.add("boot"); }
  holoOn = on; holo.classList.toggle("on", on);
  if (i === 2) qrNext();
}
function placeHolo() {
  const px = RM ? 0 : -par.x.x * 10, py = RM ? 0 : -par.y.x * 6;
  holo.style.transform = `translate(${(holoR.x + px + shX * .5).toFixed(1)}px, ${(holoR.y + py + shY * .5).toFixed(1)}px)`;
}
// El QR que cambia (un dibujo, no un código de verdad) y cuánta gente hay.
let qrSeed = 7;
function rnd(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function qrNext() {
  const r = rnd(qrSeed++), N = 25; let d = "";
  const finder = (x, y) => (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let on;
    if (finder(x, y)) { const fx = x < 7 ? x : x - (N - 7), fy = y < 7 ? y : y - (N - 7); on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4); }
    else if ((x === 7 || y === 7) && (x < 8 && y < 8)) on = false;
    else if ((x === N - 8 && y < 8) || (y === 7 && x >= N - 8) || (x === 7 && y >= N - 8) || (y === N - 8 && x < 8)) on = false;
    else on = r() < .47;
    if (on) d += `M${x} ${y}h1v1h-1z`;
  }
  $("qrPath").setAttribute("d", d);
  const s2 = holo.querySelector(".s2"); s2.classList.remove("scan"); void s2.offsetWidth; s2.classList.add("scan");
  const lv = [["Tranquilo", "#84e35e", 1], ["Movido", "#f5b83d", 2], ["Lleno", "#ff5470", 3]][(qrSeed - 8) % 3];
  const v = $("crowdV"); v.textContent = lv[0]; v.style.color = lv[1];
  [...$("crowdB").children].forEach((b, n) => { b.style.background = n < lv[2] ? lv[1] : ""; b.style.boxShadow = n < lv[2] ? `0 0 10px ${lv[1]}` : ""; });
  const ring = holo.querySelector(".ring .run"); ring.style.animation = "none"; void ring.getBoundingClientRect(); ring.style.animation = "";
}
function buildMocks() {
  // El cielo del año: 52 semanas, las cumplidas prendidas.
  const sky = $("sky"); let h = "";
  const r = rnd(11);
  for (let n = 0; n < 52; n++) {
    const x = 10 + (n % 13) * 20 + (r() - .5) * 6, y = 10 + Math.floor(n / 13) * 17 + (r() - .5) * 6, s = .7 + r() * .5;
    const lit = n < 38 && r() > .12;
    h += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})"><path class="st${lit ? " lit" : ""}" style="--d:${(.25 + n * .045).toFixed(2)}s" d="M0 -5L1.2 -1.2L5 0L1.2 1.2L0 5L-1.2 1.2L-5 0L-1.2 -1.2Z" fill="${n % 5 === 0 ? GOLD : n % 3 ? DECO : LAV}"/></g>`;
  }
  sky.innerHTML = h;
  // La sala de la clase: iniciales en círculos, lugares libres y el tuyo.
  const who = ["AR", "LS", "", "MJ", "DT", "PC", "", "*", "EV", "NR", "", "JB"];
  $("spots").innerHTML = who.map((w) => (w === "*" ? '<span class="av free you"><b>VOS</b></span>' : w ? `<span class="av">${w}</span>` : '<span class="av free"></span>')).join("");
}

// ── El cuadro a cuadro ────────────────────────────────────────────────────────
let last = performance.now(), t0 = last, blinkAt = 3, blink = 0, running = true, wanderAt = 0, wander = null, quiet = 0, raf = 0;
const els = {}; for (const id of "root sq feetB feetF fL fR armsB armsF aLo aLi aRo aRi hL hR fgL fgR face eyeL eyeR sclL sclR browL browR sqL sqR lidL lidR pupL pupR ringL ringR hapL hapR mouth mIn mclip tongue cheeks brows shade key doorRim bounce hl bandIn bandKnot bandFall bar plates dbL dbR rhL rhR ropeB ropeF tee sweat".split(" ")) els[id] = $(id);
const PL = [V, DECO, GOLD];
els.plates.innerHTML = PL.map((c, i) => `<g id="pl${i}" opacity="0"><rect x="${10 + i * 9 - 4}" y="-17" width="8" height="34" rx="3" fill="${c}" stroke="#07060b" stroke-opacity=".35"/><rect x="${190 - i * 9 - 4}" y="-17" width="8" height="34" rx="3" fill="${c}" stroke="#07060b" stroke-opacity=".35"/></g>`).join("");
const plEls = [0, 1, 2].map((i) => $("pl" + i));
function setPlates(n) { for (let i = 0; i < 3; i++) { const on = i < n; if (on && !W.plates[i]) { plateY[i].x = RM ? 0 : -110; plateY[i].v = 0; plateY[i].t = 0; plateY[i].landed = false; } W.plates[i] = on ? 1 : 0; } }
const barV = new Spr(0, 220, 16);

function ringDash(m) { return `${(220 - 40 * m).toFixed(1)} ${(80 * m).toFixed(1)} ${(140 - 40 * m).toFixed(1)} 0`; }
function ringD(cx, s) { const a0 = (s === "L" ? 100 : 280) * Math.PI / 180, r = 18, cy = 106; const p = (a) => `${(cx + r * Math.cos(a)).toFixed(3)} ${(cy + r * Math.sin(a)).toFixed(3)}`; return `M${p(a0)}A18 18 0 1 1 ${p(a0 + Math.PI)}A18 18 0 1 1 ${p(a0)}`; }
els.ringL.setAttribute("d", ringD(78, "L")); els.ringR.setAttribute("d", ringD(122, "R"));

// Con movimiento reducido no hay un bucle: se dibuja hasta que todo se asienta, y para.
function kick() { quiet = 0; if (!raf && running) { last = performance.now(); raf = requestAnimationFrame(frame); } }

function frame(now) {
  raf = 0;
  if (!running) return;
  // Tiempo real (con un tope): aunque haya pocos cuadros, la puerta se abre y Gogo llega a tiempo.
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  const t = (now - t0) / 1000;
  let gdt = dt; if (W.freeze > 0) { W.freeze -= dt; gdt = 0; }
  stepTweens(dt);

  // 1. La pose base: respira, el ejercicio, lo que mantiene en la parada
  const P = { ...REST };
  const at = gogoAt(S.cur); P.wx = at.wx; P.wz = at.wz;
  if (!RM) { P.sy += Math.sin(t * 1.85) * .014; P.sx -= Math.sin(t * 1.85) * .008; P.rot += Math.sin(t * .9) * .5; }
  // Camina (corre a saltitos) a su lugar; al llegar, su pose.
  const dist = Math.abs(sp.wx.x - P.wx) + Math.abs(sp.wz.x - P.wz);
  const moving = dist > 10 && !RM;
  // Señala lo que destaca en la pantalla: el ejercicio se pausa mientras tanto.
  const beam = beamTarget(now, moving);
  if (EX.type && !RM && !beam) { EX.T = EX.P + 1; EX.P = Math.min(EX.T, EX.P + RATE[EX.type] * gdt); }
  if (beam) { PROP.rope.t = 0; PROP.db.t = 0; } else applyEx(P);
  S.arrived = !moving;
  if (moving) { P.run = 1; P.turn = clamp((P.wx - sp.wx.x) / 30, -.85, .85); }
  else holdPose(P, t);
  if (beam) {
    // El brazo extendido hacia lo que muestra, con la mano entera abierta.
    const [sx, sy] = toScreen(160, 126, true), tx = beam.left + beam.width / 2, ty = beam.top + beam.height / 2;
    const dd = Math.hypot(tx - sx, ty - sy) || 1;
    P.hRx = 160 + (tx - sx) / dd * 54; P.hRy = clamp(126 + (ty - sy) / dd * 54, 46, 150); P.hRr = 9; P.frontR = 0; P.wave = 0;
  }
  S.beamRect = beam || S.beamRect;
  S.beamA = RM ? (beam ? 1 : 0) : S.beamA + ((beam ? 1 : 0) - S.beamA) * Math.min(1, dt * 8);
  // 2. La escena actuada encima
  if (act) {
    act.t += gdt * act.speed;
    while (act.evI < act.ev.length && act.ev[act.evI][0] <= act.t) act.ev[act.evI++][1]();
    for (const k in act.tr) { const v = sample(act.tr[k], Math.min(act.t, act.dur)); if (k.startsWith("W.")) setW(k.slice(2), v); else P[k] = v; }
    if (act && act.t >= act.dur) { const a = act; act = null; a.end?.(); }
  }
  if (phone() && act && act.name === "lift") { P.hLy = 152 + (P.hLy - 152) * .55; P.hRy = 152 + (P.hRy - 152) * .55; }
 
  const acting = act && act.prio >= 2;
  // Se tapa los ojos (lo que todavía no te puede mostrar) y espía entre los dedos
  if (S.covering && !acting && !moving && !(S.cur === 9 && S.lineIdx >= 2)) {
    const ex = (x) => 100 + (x + sp.faceX.x - 100) * sp.sx.x, ey = 184 + (106 + sp.faceY.x - 184) * sp.sy.x;
    P.hLx = ex(78); P.hLy = ey; P.hLr = 19.5; P.frontL = 1;
    if (S.peek) { P.hRx = ex(136); P.hRy = ey + 26; P.hRr = 12; } else { P.hRx = ex(122); P.hRy = ey; P.hRr = 19.5; }
    P.frontR = 1; P.blush = .75;
  }
  // Las manos nunca entran en la pantalla holográfica (salvo en la 10, donde Gogo se para delante a propósito).
  if (holoOn && S.cur !== 10 && !moving) keepHandsOut(P);
  // 3. A dónde mira: el puntero, la pantalla que muestra o curiosea
  let target = null;
  if (S.pointer && now - S.pointerT < 2500) target = S.pointer;
  else if (holoOn && S.cur !== 10) target = [holoR.x + holoR.w * .5, holoR.y + holoR.h * (S.lookLow ? .75 : .4)];
  else if (S.cur === 12 && S.glance) target = null;
  else if (!RM && S.cur === 0) { if (t > wanderAt) { wanderAt = t + 2 + Math.random() * 2.5; wander = Math.random() < .4 ? null : [VW * Math.random(), VH * (.2 + Math.random() * .6)]; } target = wander; }
  const haveGaze = !(act && (act.tr.px || act.tr.py));
  if (haveGaze) {
    if (target && !(S.covering && !S.peek)) {
      const [ex, ey] = toScreen(100 + sp.faceX.x, 106, true);
      const dx = target[0] - ex, dy = target[1] - ey, dd = Math.hypot(dx, dy) || 1, kk = Math.min(1, dd / 240);
      P.px = dx / dd * 5.6 * kk; P.py = dy / dd * 4.6 * kk;
    } else { P.px = 0; P.py = 0; }
    if (!(act && act.tr.faceX)) P.faceX = P.px * 1.3;
    if (!(act && act.tr.faceY)) P.faceY += P.py * .7;
  }
  // 4. Los resortes
  for (const k in sp) { sp[k].t = P[k]; if (gdt > 0) sp[k].step(gdt); }
  if (gdt > 0) { jig.x.step(gdt); jig.y.step(gdt); }
  if (RM) for (const k in sp) sp[k].snap(P[k]);

  // 5. Resolver la pose y dibujarla
  R.bx = sp.bx.x; R.lift = sp.lift.x; R.rot = sp.rot.x;
  let sxx = sp.sx.x * (1 + jig.x.x), syy = sp.sy.x * (1 + jig.y.x);
  let fLy = sp.fLy.x, fRy = sp.fRy.x;
  if (P.run > .5 && !RM) {
    const a = Math.sin(t * 15);
    R.lift += -Math.abs(a) * 9; fLy -= Math.max(0, a) * 10; fRy -= Math.max(0, -a) * 10; syy *= 1 + Math.abs(a) * .05; sxx *= 1 - Math.abs(a) * .03; R.rot += a * 3;
  }
  if (P.strain > .5 && !RM) { R.bx += Math.sin(t * 70) * .9; syy *= 1 + Math.sin(t * 46) * .008; }
  R.sxx = sxx; R.syy = syy;
  S.face = faceFor(now, moving);
  world(now, t, dt, gdt);
  render(t, sxx, syy, fLy, fRy, P, gdt);
  placeHolo();
  bubbleAt();
  warm(dt);

  // Parpadeo
  if (!RM) {
    if (t > blinkAt && !S.covering) { blink = 1; blinkAt = t + 2.4 + Math.random() * 3.6; }
    blink = Math.max(0, blink - dt * 7);
  }
  if (RM) { quiet++; if (quiet > 40) return; }
  raf = requestAnimationFrame(frame);
}

// Si una mano cae dentro de la pantalla (con margen), vuelve por la línea del hombro hasta el borde.
function keepHandsOut(P) {
  const px = RM ? 0 : -par.x.x * 10, py = RM ? 0 : -par.y.x * 6;
  for (const k of ["L", "R"]) {
    // Margen: la mano, su vaivén al saludar y lo que el resorte del brazo se pasa al llegar.
    const m = 8 + (Math.max(8.5, P["h" + k + "r"]) + (k === "R" ? 9 * P.wave : 0) + 6) * gS;
    const x0 = holoR.x + px - m, x1 = holoR.x + holoR.w + px + m, y0 = holoR.y + py - m, y1 = holoR.y + holoR.h + py + m;
    const inside = (q) => q[0] > x0 && q[0] < x1 && q[1] > y0 && q[1] < y1;
    const onHolo = (q) => q[0] > x0 + m && q[0] < x1 - m && q[1] > y0 + m && q[1] < y1 - m;
    const sx = k === "L" ? 40 : 160, sy = 126, hx = P["h" + k + "x"], hy = P["h" + k + "y"];
    // (Si el hombro mismo está sobre la pantalla, Gogo está delante: no hay nada que recortar.)
    if (!inside(toScreen(hx, hy)) || onHolo(toScreen(sx, sy))) continue;
    let lo = 0, hi = 1;
    for (let n = 0; n < 12; n++) { const mid = (lo + hi) / 2; if (inside(toScreen(lerp(sx, hx, mid), lerp(sy, hy, mid)))) hi = mid; else lo = mid; }
    P["h" + k + "x"] = lerp(sx, hx, lo); P["h" + k + "y"] = lerp(sy, hy, lo);
  }
}

function beamTarget(now, moving) {
  const b = S.beam;
  if (!b || !holoOn || moving || now > b.until || S.covering || (act && act.tr.hRx)) return null;
  const r = holo.querySelector(b.sel)?.getBoundingClientRect();
  return r && r.width ? r : null;
}

function render(t, sxx, syy, fLy, fRy, P, FDT) {
  const wx = sp.wx.x, wz = sp.wz.x;
  const [fx, fy, s] = P3(wx, 0, wz);
  gS = s; gOX = fx - (100 - VB.x) * s; gOY = fy - (184 - VB.y) * s;
  wrap.style.transform = `translate(${gOX.toFixed(2)}px, ${gOY.toFixed(2)}px) scale(${s.toFixed(4)})`;
  wrap.style.visibility = "visible";
  // Dónde se lo puede tocar
  const [hx, hy] = toScreen(100, 122, true), hr = 66 * gS;
  hit.style.transform = `translate(${(hx - hr).toFixed(1)}px, ${(hy - hr).toFixed(1)}px)`; hit.style.width = hit.style.height = (hr * 2).toFixed(1) + "px";

  els.root.setAttribute("transform", `translate(${R.bx.toFixed(2)} ${R.lift.toFixed(2)}) rotate(${R.rot.toFixed(2)} 100 184)`);
  els.sq.setAttribute("transform", `translate(100 184) scale(${sxx.toFixed(4)} ${syy.toFixed(4)}) translate(-100 -184)`);

  // La luz que le llega: la lámpara de arriba, las del fondo y la puerta
  const nearDoor = clamp((wz - 560) / 200);
  const light = clamp(W.ambient * .9 + W.lamp[0] * .78 + (W.lamp[1] + W.lamp[2]) * .06 + W.glow * .38 * nearDoor);
  els.shade.setAttribute("opacity", ((1 - light) * .9).toFixed(3));
  els.key.setAttribute("opacity", (W.lamp[0] * .9).toFixed(3));
  els.doorRim.setAttribute("opacity", (W.glow * nearDoor * .95).toFixed(3));
  els.bounce.setAttribute("opacity", (W.lamp[0] * .7).toFixed(3));
  const limb = (a) => `rgb(${Math.round(lerp(10, a[0], light))} ${Math.round(lerp(8, a[1], light))} ${Math.round(lerp(18, a[2], light))})`;
  const armC = limb([59, 44, 107]), footC = limb([41, 30, 74]);
  els.aLi.setAttribute("stroke", armC); els.aRi.setAttribute("stroke", armC);
  els.aLo.setAttribute("stroke-opacity", (.5 * light).toFixed(2)); els.aRo.setAttribute("stroke-opacity", (.5 * light).toFixed(2));
  els.fL.setAttribute("fill", footC); els.fR.setAttribute("fill", footC);
  els.cheeks.setAttribute("opacity", (clamp(sp.blush.x) * light).toFixed(3));
  els.hl.setAttribute("transform", `translate(${(sp.turn.x * 18).toFixed(1)} 0) rotate(-30 70 82)`);
  els.tee.setAttribute("opacity", clamp(W.tee).toFixed(3));
  els.sweat.setAttribute("opacity", clamp(sp.sweat.x).toFixed(3));
  { const dd = (t * 9) % 14; els.sweat.setAttribute("transform", `translate(${(52 - dd * .7).toFixed(1)} ${(84 + dd).toFixed(1)})`); }

  // Pies
  const feetFront = P.feetF > .5, fp = feetFront ? els.feetF : els.feetB;
  if (els.fL.parentNode !== fp) fp.append(els.fL, els.fR);
  els.fL.setAttribute("cx", sp.fLx.x.toFixed(1)); els.fL.setAttribute("cy", fLy.toFixed(1)); els.fR.setAttribute("cx", sp.fRx.x.toFixed(1)); els.fR.setAttribute("cy", fRy.toFixed(1));

  // Cara: el giro (3/4), la mirada, la marca
  const turn = sp.turn.x, fsx = 1 - Math.abs(turn) * .24;
  els.face.setAttribute("transform", `translate(${(sp.faceX.x + turn * 24).toFixed(2)} ${sp.faceY.x.toFixed(2)}) translate(100 112) scale(${fsx.toFixed(3)} 1) translate(-100 -112)`);
  const m = sp.mark.x, mc = clamp(m, -.2, 1);
  const blinkK = blink > .5 ? (1 - blink) * 2 : blink * 2;
  for (const s2 of ["L", "R"]) {
    const cx = s2 === "L" ? 78 : 122, shift = (s2 === "L" ? 9.54 : -9.54) * clamp(m);
    const hap = clamp(s2 === "L" ? sp.hapL.x : sp.hapR.x), lid = clamp(s2 === "L" ? sp.lidL.x : sp.lidR.x, .04, 1.2);
    const w = sp.wide.x, sy2 = Math.max(.05, lid * (1 - blinkK * .94) * (1 - hap * .6) * w);
    els["eye" + s2].setAttribute("transform", `translate(${shift.toFixed(2)} 0) translate(${cx} 106) scale(${Math.min(1.18, w).toFixed(3)} ${sy2.toFixed(3)}) translate(${-cx} -106)`);
    els["eye" + s2].setAttribute("opacity", hap > .35 ? 0 : 1);
    els["hap" + s2].setAttribute("opacity", hap > .35 ? 1 : 0);
    const sc = clamp(1 - mc, 0, 1.3);
    els["scl" + s2].setAttribute("transform", `translate(${cx} 106) scale(${sc.toFixed(3)}) translate(${-cx} -106)`);
    els["ring" + s2].setAttribute("stroke-dasharray", ringDash(clamp(m)));
    els["pup" + s2].setAttribute("transform", `translate(${clamp(sp.px.x, -6, 6).toFixed(2)} ${clamp(sp.py.x, -6, 6).toFixed(2)})`);
  }
  // Las cejas: del todo o nada
  const F2 = S.face || { m: "calma", brow: "", eyes: "", heavy: 0, talk: false };
  if (F2.brow) { els.browL.setAttribute("d", BROWS[F2.brow][0]); els.browR.setAttribute("d", BROWS[F2.brow][1]); }
  els.brows.setAttribute("opacity", F2.brow ? 1 : 0);
  // Ojos de esfuerzo (> <) y el párpado pesado de cansado
  const squeeze = F2.eyes === "squeeze";
  for (const s2 of ["L", "R"]) {
    els["sq" + s2].setAttribute("opacity", squeeze ? 1 : 0);
    if (squeeze) { els["eye" + s2].setAttribute("opacity", 0); els["hap" + s2].setAttribute("opacity", 0); }
  }
  S.heavyX = RM ? F2.heavy : (S.heavyX || 0) + (F2.heavy - (S.heavyX || 0)) * Math.min(1, (FDT || 1 / 60) * 7);
  els.lidL.setAttribute("transform", `translate(0 ${((S.heavyX - 1) * 26).toFixed(1)})`); els.lidR.setAttribute("transform", `translate(0 ${((S.heavyX - 1) * 26).toFixed(1)})`);
  // La boca: la de la cara o, mientras habla, las vocales de la frase (con movimiento reducido, quieta)
  const tm = !RM && F2.talk && talk.text && bub.classList.contains("on") ? talkMouth(talk.text, (performance.now() - talk.at) / 1000) : null;
  const mv = mouthStep(tm || F2.m, FDT || 1 / 60, tm ? 900 : 420);
  const mk = clamp(m), G = MOUTHS.guion, MV = mk > 0 ? mv.map((v, i) => lerp(v, G[i], mk)) : mv;
  const MP = mouthParts(MV);
  els.mouth.setAttribute("d", MP.d); els.mouth.setAttribute("stroke-width", MP.strokeWidth);
  els.mIn.setAttribute("d", MP.d); els.mIn.setAttribute("fill-opacity", MP.fillOpacity.toFixed(3)); els.mclip.setAttribute("d", MP.d);
  els.tongue.setAttribute("cx", MP.tongue.cx); els.tongue.setAttribute("cy", MP.tongue.cy); els.tongue.setAttribute("rx", MP.tongue.rx); els.tongue.setAttribute("opacity", MP.tongue.opacity);

  // Brazos: del hombro (que se aplasta con el cuerpo) a la mano
  const H = { L: [sp.hLx.x, sp.hLy.x, sp.hLr.x], R: [sp.hRx.x, sp.hRy.x, sp.hRr.x] };
  if (P.wave > .01 && !RM) { H.R[0] += Math.sin(t * 15) * 9 * P.wave; H.R[1] += Math.cos(t * 15) * 3 * P.wave; }
  // Lo dibujado tampoco entra en la pantalla (el resorte del brazo puede pasarse del objetivo).
  if (holoOn && S.cur !== 10) for (const k of ["L", "R"]) {
    const r = Math.max(8.5, H[k][2]) * gS + 4, px = RM ? 0 : -par.x.x * 10, py = RM ? 0 : -par.y.x * 6;
    const inside = (q) => q[0] > holoR.x + px - r && q[0] < holoR.x + holoR.w + px + r && q[1] > holoR.y + py - r && q[1] < holoR.y + holoR.h + py + r;
    const sx = k === "L" ? 40 : 160, sy = 126;
    if (!inside(toScreen(H[k][0], H[k][1])) || inside(toScreen(sx, sy))) continue;
    let lo = 0, hi = 1;
    for (let n = 0; n < 12; n++) { const mid = (lo + hi) / 2; if (inside(toScreen(lerp(sx, H[k][0], mid), lerp(sy, H[k][1], mid)))) hi = mid; else lo = mid; }
    H[k][0] = lerp(sx, H[k][0], lo); H[k][1] = lerp(sy, H[k][1], lo);
  }
  S.handR = [H.R[0], H.R[1]]; // de acá sale la línea de luz
  const sh = { L: sqPt(40, 126), R: sqPt(160, 126) };
  for (const k of ["L", "R"]) {
    const [hx2, hy2, hr2] = H[k], [ax, ay] = sh[k];
    const mx = (ax + hx2) / 2 + (k === "L" ? -7 : 7), my = (ay + hy2) / 2 + 7;
    const ad = `M${ax.toFixed(1)} ${ay.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${hx2.toFixed(1)} ${hy2.toFixed(1)}`;
    els["a" + k + "o"].setAttribute("d", ad); els["a" + k + "i"].setAttribute("d", ad);
    const front = (k === "L" ? P.frontL : P.frontR) > .5, grp = front ? els.armsF : els.armsB;
    if (els["a" + k + "o"].parentNode !== grp) grp.append(els["a" + k + "o"], els["a" + k + "i"]);
    // Con el brazo arriba, la mano redonda se ve siempre (nunca un brazo que termina en punta).
    const raised = hy2 < 116 && hr2 < 8.5, hr3 = raised ? 8.5 : hr2;
    const hand = els["h" + k], big = hr3 > 6.8;
    hand.setAttribute("cx", hx2.toFixed(1)); hand.setAttribute("cy", hy2.toFixed(1)); hand.setAttribute("r", Math.max(3, hr3).toFixed(2));
    hand.setAttribute("opacity", big ? 1 : 0); hand.setAttribute("fill", armC);
    const f = clamp((hr2 - 12) / 6);
    els["fg" + k].setAttribute("d", [-.42, 0, .42].map((u) => `M${(hx2 + u * hr2).toFixed(1)} ${(hy2 - hr2 * .95).toFixed(1)}v${(hr2 * .42).toFixed(1)}`).join(""));
    els["fg" + k].setAttribute("opacity", f.toFixed(2));
  }
  // Mancuernitas y soga
  const dbV = clamp(PROP.db.step(FDT || 1 / 60)), rpV = clamp(PROP.rope.step(FDT || 1 / 60));
  for (const k of ["L", "R"]) {
    els["db" + k].setAttribute("transform", `translate(${H[k][0].toFixed(1)} ${H[k][1].toFixed(1)}) scale(${dbV.toFixed(3)})`); els["db" + k].setAttribute("opacity", dbV > .02 ? 1 : 0);
    els["rh" + k].setAttribute("transform", `translate(${H[k][0].toFixed(1)} ${H[k][1].toFixed(1)}) scale(${rpV.toFixed(3)})`); els["rh" + k].setAttribute("opacity", rpV > .02 ? 1 : 0);
  }
  if (rpV > .02) {
    const Y = -Math.cos(TAU * (ropeB - .25)), Dp = Math.sin(TAU * (ropeB - .25));
    let yo = Y > 0 ? Y * 56 : Y * (phone() ? 70 : 132), front = Dp > 0;
    if (ropeSag || EX.type !== "rope") { yo = 42; front = false; }
    yo *= rpV;
    let path = "", px0, py0;
    for (let i = 0; i <= 18; i++) {
      const u = i / 18, b = Math.sin(Math.PI * u);
      const x = lerp(H.L[0], H.R[0], u) + (u - .5) * 2 * 14 * Math.abs(Y) * b, y = lerp(H.L[1], H.R[1], u) + yo * b;
      if (!i) path = `M${x.toFixed(1)} ${y.toFixed(1)}`; else path += `Q${px0.toFixed(1)} ${py0.toFixed(1)} ${((x + px0) / 2).toFixed(1)} ${((y + py0) / 2).toFixed(1)}`;
      px0 = x; py0 = y;
    }
    path += `L${px0.toFixed(1)} ${py0.toFixed(1)}`;
    els.ropeF.setAttribute("d", front ? path : ""); els.ropeB.setAttribute("d", front ? "" : path);
  } else { els.ropeF.setAttribute("d", ""); els.ropeB.setAttribute("d", ""); }

  // La barra (el récord): en el piso o en las manos
  barV.t = clamp(W.barVis); barV.step(FDT || 1 / 60);
  const bvv = clamp(barV.x), by = W.barLift > .5 ? (H.L[1] + H.R[1]) / 2 : 189;
  els.bar.setAttribute("opacity", bvv > .02 ? Math.min(1, bvv * 1.5).toFixed(2) : 0);
  els.bar.setAttribute("transform", `translate(${W.barLift > .5 ? ((H.L[0] + H.R[0]) / 2 - 100).toFixed(1) : 0} ${by.toFixed(1)}) translate(100 0) scale(${(.6 + .4 * bvv).toFixed(3)}) translate(-100 0)`);
  for (let i = 0; i < 3; i++) {
    const y = plateY[i].step(FDT || 1 / 60);
    if (W.plates[i] && !plateY[i].landed && y > -3) { plateY[i].landed = true; if (bvv > .5) { shake(.1); jiggle(.06); } }
    plEls[i].setAttribute("opacity", W.plates[i] ? 1 : 0);
    plEls[i].setAttribute("transform", `translate(0 ${W.plates[i] ? y.toFixed(1) : 0})`);
  }

  // La vincha: cae del cielo, girando, y se le pone en la cabeza
  els.bandIn.setAttribute("opacity", W.band > .5 ? 1 : 0); els.bandKnot.setAttribute("opacity", W.band > .5 ? 1 : 0);
  if (W.bandFall > 0 && W.band < .5) {
    const f = W.bandFall, y = lerp(-420, 76, f) + R.lift, r = (1 - f) * 380;
    els.bandFall.setAttribute("opacity", 1);
    els.bandFall.setAttribute("transform", `translate(${(100 + R.bx + Math.sin(f * 7) * 10 * (1 - f)).toFixed(1)} ${y.toFixed(1)}) rotate(${(Math.sin(r / 60) * 26).toFixed(1)}) scale(${(1 - .3 * Math.abs(Math.sin(r / 40))).toFixed(3)} 1)`);
  } else els.bandFall.setAttribute("opacity", 0);
}

// ── La sala: perspectiva real, luz que se multiplica y lo que brilla ─────────
const dust = [];
function seedDust() {
  dust.length = 0;
  const n = phone() ? 46 : 120;
  for (let i = 0; i < n; i++) { const L0 = LAMPS[i % 3]; dust.push({ l: i % 3, x: L0.x + (Math.random() - .5) * 300, y: -160 - Math.random() * 160, z: L0.z + (Math.random() - .5) * 120, vx: (Math.random() - .5) * 6, vy: -2 - Math.random() * 5, r: .8 + Math.random() * 1.8, ph: Math.random() * 7 }); }
}
function dustBurst(l) { if (RM) return; for (const d of dust) if (d.l === l) { d.vy -= 14 + Math.random() * 20; d.vx += (Math.random() - .5) * 30; } }
const STARS = Array.from({ length: 70 }, () => [Math.random() * 3600 - 1800, -900 - Math.random() * 900, Math.random()]);
const crackX = () => DOOR.x0 + (DOOR.x1 - DOOR.x0) * Math.cos(clamp(W.door) * Math.PI / 2 * .92);

function aim(snap) {
  if (snap) { const c = camFor(S.cur); cam.x.snap(c.x); cam.y.snap(c.y); cam.z.snap(c.z); const g = gogoAt(S.cur); sp.wx.snap(g.wx); sp.wz.snap(g.wz); }
}

function world(now, t, dt, gdt) {
  par.x.t = S.pointer && !RM && now - S.pointerT < 6000 ? (S.pointer[0] / VW - .5) : 0; par.y.t = S.pointer && !RM && now - S.pointerT < 6000 ? (S.pointer[1] / VH - .5) : 0;
  par.x.step(dt); par.y.step(dt); cam.x.step(dt); cam.y.step(dt); cam.z.step(dt);
  camX = cam.x.x + par.x.x * 14; camY = -150 + cam.y.x + par.y.x * 8; camZ = cam.z.x;
  W.trauma = Math.max(0, W.trauma - dt * 1.7);
  const tr = W.trauma * W.trauma; shX = tr * 16 * (Math.sin(t * 61) + Math.sin(t * 37) * .5); shY = tr * 12 * (Math.sin(t * 53 + 1) + Math.sin(t * 29) * .5);
  F = LY.k * GZ; Cx0 = LY.cx + shX; Cy0 = LY.ground - 150 * LY.k + shY;

  const c = cB; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
  c.fillStyle = "#07060b"; c.fillRect(0, 0, cvB.width, cvB.height);
  // Pared del fondo
  setT(c, WALL, D);
  const wg = c.createLinearGradient(0, -900, 0, 0); wg.addColorStop(0, "#3a3456"); wg.addColorStop(1, "#56507a");
  c.fillStyle = wg; c.fillRect(-2600, -2400, 5200, 2400);
  c.fillStyle = "rgba(0,0,0,.18)"; for (let x = -2560; x < 2600; x += 170) c.fillRect(x, -2400, 3, 2400);
  c.fillStyle = "#2c2742"; c.fillRect(-2600, -36, 5200, 36);
  // La franja de la marca: violeta, el guion rojo, lavanda
  c.fillStyle = "#6c45a6"; c.fillRect(-2600, -168, 2560, 12); c.fillStyle = "#b8344c"; c.fillRect(-24, -166, 48, 8); c.fillStyle = "#8f7bbf"; c.fillRect(40, -168, 2560, 12);
  for (const [a, b] of WINS) { c.fillStyle = "#1a1730"; c.fillRect(a - 10, WIN_Y[0] - 10, b - a + 20, WIN_Y[1] - WIN_Y[0] + 20); }
  // Los discos de colores y las pesas rusas aparecen al acercarse a la puerta, con su luz: en el recorrido no
  // quedan detrás del texto.
  const decoA = clamp(cam.z.x / 180);
  c.globalAlpha = decoA;
  // Discos de colores colgados, a la izquierda de la puerta
  for (const [x, col, r] of [[-120, "#7b4cc0", 46], [-36, "#4f8cc4", 40], [44, "#c4932f", 34]]) { c.fillStyle = col; c.beginPath(); c.arc(x - 470, -110, r, 0, TAU); c.fill(); c.fillStyle = "#1c1830"; c.beginPath(); c.arc(x - 470, -110, r * .32, 0, TAU); c.fill(); c.fillStyle = "#8a84aa"; c.fillRect(x - 474, -116, 8, 6); }
  c.globalAlpha = 1;
  // Puerta: el marco
  c.fillStyle = "#77709c"; c.fillRect(DOOR.x0 - 12, DOOR.y0 - 12, DOOR.x1 - DOOR.x0 + 24, -DOOR.y0 + 12);
  c.fillStyle = "#14111f"; c.fillRect(DOOR.x0, DOOR.y0, DOOR.x1 - DOOR.x0, -DOOR.y0);
  // El rack de mancuernas
  setT(c, 872, D);
  c.fillStyle = "#3b3558"; c.fillRect(200, -118, 360, 10); c.fillRect(200, -62, 360, 10); c.fillRect(204, -118, 10, 118); c.fillRect(546, -118, 10, 118);
  for (let row = 0; row < 2; row++) for (let i = 0; i < 6; i++) {
    const x = 236 + i * 56, y = row ? -48 : -104, h = 22 - i * 1.6;
    c.fillStyle = "#9c96bb"; c.fillRect(x - 14, y - 2, 28, 4);
    c.fillStyle = "#231f36"; c.fillRect(x - 24, y - h / 2, 11, h); c.fillRect(x + 13, y - h / 2, 11, h);
    c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(x - 24, y - h / 2, 11, 3); c.fillRect(x + 13, y - h / 2, 11, 3);
  }
  // Cajones de salto, apilados
  setT(c, 820, D);
  for (const [x, y, w, h, col] of [[600, -150, 190, 150, "#4b3d74"], [626, -260, 140, 110, "#5a4886"]]) { c.fillStyle = col; c.fillRect(x, y, w, h); c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(x, y, w, 6); c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(x + w * .3, y + h * .35, w * .4, 14); }
  c.globalAlpha = decoA;
  // Pesas rusas, en el piso
  setT(c, 830, D);
  for (const [x, r, col] of [[-640, 34, "#3a3456"], [-560, 28, "#7b4cc0"], [-492, 24, "#c4932f"]]) { c.fillStyle = col; c.beginPath(); c.arc(x, -r, r, 0, TAU); c.fill(); c.strokeStyle = col; c.lineWidth = 9; c.beginPath(); c.arc(x, -r * 1.75, r * .55, Math.PI, 0); c.stroke(); c.fillStyle = "rgba(255,255,255,.14)"; c.beginPath(); c.arc(x - r * .35, -r * 1.25, r * .25, 0, TAU); c.fill(); }
  c.globalAlpha = 1;
  // El piso: goma oscura con juntas, en perspectiva
  const zN = Math.max(camZ + 24, 30);
  const fp = [P3(-3000, 0, zN), P3(3000, 0, zN), P3(3000, 0, WALL), P3(-3000, 0, WALL)];
  c.setTransform(D, 0, 0, D, 0, 0);
  c.fillStyle = "#3a3450"; c.beginPath(); fp.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill();
  c.strokeStyle = "rgba(10,8,20,.4)"; c.lineWidth = 1.2; c.beginPath();
  for (let z = 100; z < WALL; z += 100) { if (z <= zN) continue; const a = P3(-3000, 0, z), b = P3(3000, 0, z); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  for (let x = -3000; x <= 3000; x += 150) { const a = P3(x, 0, zN), b = P3(x, 0, WALL); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
  c.stroke();
  // La colchoneta de Gogo
  if (352 > zN) {
    const mat = [P3(-130, 0, 352), P3(130, 0, 352), P3(130, 0, 492), P3(-130, 0, 492)];
    c.fillStyle = "#4b3c7d"; c.beginPath(); mat.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill();
    const e1 = P3(-130, 5, 352), e2 = P3(130, 5, 352); c.fillStyle = "#2c2350"; c.fillRect(e1[0], mat[0][1], e2[0] - e1[0], (e1[1] - mat[0][1]) * -1 + 2);
    c.strokeStyle = "rgba(201,168,255,.35)"; c.lineWidth = 1.4 * mat[0][2] / 2.2; c.beginPath(); const i1 = P3(-116, 0, 362), i2 = P3(116, 0, 362), i3 = P3(116, 0, 482), i4 = P3(-116, 0, 482); c.moveTo(i1[0], i1[1]); c.lineTo(i2[0], i2[1]); c.lineTo(i3[0], i3[1]); c.lineTo(i4[0], i4[1]); c.closePath(); c.stroke();
  }
  // Sombra de contacto de Gogo (se achica cuando salta)
  {
    const [x, y, ss] = P3(sp.wx.x + R.bx, 0, sp.wz.x + 6);
    const k = clamp(1 + R.lift / 110, .4, 1.1), rx = 64 * ss * k, ry = rx * .2;
    const g = c.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, `rgba(0,0,0,${.75 * k})`); g.addColorStop(1, "rgba(0,0,0,0)");
    c.save(); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y); c.fillStyle = g; c.beginPath(); c.arc(x, y, rx, 0, TAU); c.fill(); c.restore();
  }
  // El aterrizaje: un anillo plano en el piso, bajo los dos pies, que se abre hacia los costados
  for (let i = floorRings.length - 1; i >= 0; i--) {
    const r = floorRings[i]; r.life += gdt / .5; if (r.life >= 1) { floorRings.splice(i, 1); continue; }
    const [x, y, ss] = P3(r.wx, 0, r.wz + 6), rx = (44 + 46 * EZ.out(r.life)) * ss, ry = rx * .16;
    c.save(); c.setTransform(D, 0, 0, D, 0, 0); c.strokeStyle = `rgba(201,186,240,${((1 - r.life) * .5 * r.a).toFixed(3)})`; c.lineWidth = 2.2;
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.stroke(); c.restore();
  }
  // La soga de trepar
  rope.a.t = RM ? 0 : Math.sin(t * .7) * .015; rope.a.step(dt);
  if (640 > camZ + 30) {
    setT(c, 640, D); const a = rope.a.x, bx = 330 + Math.sin(a) * 1500;
    c.strokeStyle = "#8c7650"; c.lineWidth = 9; c.lineCap = "round"; c.beginPath(); c.moveTo(330, -1800); c.quadraticCurveTo(330 + Math.sin(a) * 800, -800, bx, -40); c.stroke();
    c.strokeStyle = "rgba(0,0,0,.25)"; c.setLineDash([6, 8]); c.stroke(); c.setLineDash([]);
    c.fillStyle = "#7a6644"; c.beginPath(); c.ellipse(bx + 16, -10, 46, 12, 0, 0, TAU); c.fill();
  }

  // ── La luz: un mapa que se multiplica sobre todo lo anterior
  const l = cL; l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = "source-over";
  const amb = W.ambient;
  l.fillStyle = `rgb(${Math.round(36 + amb * 140)},${Math.round(30 + amb * 120)},${Math.round(64 + amb * 150)})`; l.fillRect(0, 0, lm.width, lm.height);
  l.globalCompositeOperation = "lighter";
  const hs = .5;
  for (let i = 0; i < 3; i++) {
    const I = W.lamp[i]; if (I < .01) continue; const Lp = LAMPS[i];
    poolE(l, hs, Lp.x, Lp.z, i ? 300 : 250, "255,222,180", .95 * I);
    const [wx, wy, ws] = P3(Lp.x, -150, WALL); const rr = (i ? 520 : 460) * ws;
    const g = l.createRadialGradient(wx * hs, wy * hs, 0, wx * hs, wy * hs, rr * hs); g.addColorStop(0, `rgba(255,214,170,${.62 * I})`); g.addColorStop(1, "rgba(255,214,170,0)");
    l.fillStyle = g; l.fillRect(0, 0, lm.width, lm.height);
  }
  const G = W.glow * clamp(W.door * 8);
  if (G > .01) {
    // La luz de la rendija: una cuña en el piso que sale de la puerta entreabierta
    const cx0 = crackX(), a = P3(cx0, 0, WALL), b = P3(DOOR.x1, 0, WALL), cc = P3(DOOR.x1 + 230, 0, 330), d2 = P3(cx0 + 40, 0, 330);
    const g = l.createLinearGradient(0, a[1] * hs, 0, cc[1] * hs); g.addColorStop(0, `rgba(255,240,215,${G})`); g.addColorStop(1, "rgba(255,240,215,0)");
    l.fillStyle = g; l.beginPath(); l.moveTo(a[0] * hs, a[1] * hs); l.lineTo(b[0] * hs, b[1] * hs); l.lineTo(cc[0] * hs, cc[1] * hs); l.lineTo(d2[0] * hs, d2[1] * hs); l.closePath(); l.fill();
    const [dx, dy, ds] = P3((cx0 + DOOR.x1) / 2, -130, WALL); const gg = l.createRadialGradient(dx * hs, dy * hs, 0, dx * hs, dy * hs, 300 * ds * hs); gg.addColorStop(0, `rgba(255,236,205,${.7 * G})`); gg.addColorStop(1, "rgba(255,236,205,0)"); l.fillStyle = gg; l.fillRect(0, 0, lm.width, lm.height);
  }
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = "multiply";
  c.drawImage(lm, 0, 0, cvB.width, cvB.height);
  c.globalCompositeOperation = "source-over";

  // ── Lo que brilla solo: el cielo, la puerta, el neón, las lámparas
  setT(c, WALL, D);
  for (const [a, b] of WINS) {
    c.save(); c.beginPath(); c.rect(a, WIN_Y[0], b - a, WIN_Y[1] - WIN_Y[0]); c.clip();
    const sg = c.createLinearGradient(0, WIN_Y[0], 0, WIN_Y[1]); sg.addColorStop(0, "#0c0b26"); sg.addColorStop(.6, "#241a4c"); sg.addColorStop(1, "#4a2153");
    c.fillStyle = sg; c.fillRect(a, WIN_Y[0], b - a, WIN_Y[1] - WIN_Y[0]);
    c.fillStyle = "rgba(255,255,255,.75)";
    for (const [x, y, k] of STARS) { const sx2 = x * .32 - camX * .6, sy2 = WIN_Y[0] + (y + 1800) * .14; if (sx2 > a && sx2 < b && sy2 < WIN_Y[1] - 30) { c.globalAlpha = RM ? .7 : (.4 + .6 * Math.abs(Math.sin(t * (1 + k * 2) + k * 9))); c.fillRect(sx2, sy2, 2.4 * k + 1, 2.4 * k + 1); } }
    c.globalAlpha = 1; c.restore();
    c.fillStyle = "#0e0c18"; const mid = (a + b) / 2; c.fillRect(mid - 4, WIN_Y[0], 8, WIN_Y[1] - WIN_Y[0]); c.fillRect(a, (WIN_Y[0] + WIN_Y[1]) / 2 - 3, b - a, 6);
    c.fillStyle = "rgba(255,255,255,.05)"; c.beginPath(); c.moveTo(a + 30, WIN_Y[1]); c.lineTo(a + 90, WIN_Y[0]); c.lineTo(a + 120, WIN_Y[0]); c.lineTo(a + 60, WIN_Y[1]); c.fill();
  }
  // La puerta: la hoja de vidrio esmerilado; entreabierta, la luz del otro lado por la rendija
  {
    const w0 = DOOR.x1 - DOOR.x0, h0 = -DOOR.y0, cx0 = crackX(), lw = cx0 - DOOR.x0;
    if (W.door > .003) {
      const g = c.createLinearGradient(cx0, 0, DOOR.x1, 0); g.addColorStop(0, `rgba(255,253,244,${W.glow})`); g.addColorStop(1, `rgba(255,214,150,${.85 * W.glow})`);
      c.fillStyle = g; c.fillRect(cx0, DOOR.y0, DOOR.x1 - cx0, h0);
    }
    c.fillStyle = "#191527"; c.fillRect(DOOR.x0, DOOR.y0, lw, h0);
    c.fillStyle = "rgba(201,168,255,.14)"; c.fillRect(DOOR.x0, DOOR.y0, lw, h0);
    c.strokeStyle = "#8d86b4"; c.lineWidth = 6; c.strokeRect(DOOR.x0 + 3, DOOR.y0 + 3, Math.max(0, lw - 6), h0 - 6);
    c.fillStyle = "#b9b3da"; c.fillRect(DOOR.x0 + lw * .12, -128, lw * .76, 8);
    c.fillStyle = `rgba(255,214,160,${clamp(.5 + .15 * Math.sin(RM ? 0 : t * 2) + W.glow * .5)})`; c.fillRect(DOOR.x0, -4, w0, 4);
  }
  neon(c, t);
  for (let i = 1; i < 3; i++) lamp(c, i);

  // ── Lo que está delante de Gogo (en el teléfono, con la pantalla prendida, su lámpara queda detrás de ella)
  const f = cF; f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, cvF.width, cvF.height);
  const behind = phone() && holoOn;
  lamp(behind ? c : f, 0);
  {
    const L0 = LAMPS[0]; const [tx, ty, ts] = P3(L0.x - 50, L0.y + 4, L0.z);
    if (L0.z - camZ > 40) {
      let ex, ey;
      if (W.cordGrab > .5) { const hand = toScreen(sp.hRx.x, sp.hRy.x - 6); ex = hand[0]; ey = hand[1]; const [, by0] = P3(0, -206, L0.z); cord.y.x = -206 + (ey - by0) / ts; cord.y.v = 0; cord.x.x = -50 + (ex - tx) / ts; }
      else { cord.y.t = -206; cord.x.t = -50; cord.y.step(dt); cord.x.step(dt); const p = P3(L0.x + cord.x.x, cord.y.x, L0.z); ex = p[0]; ey = p[1]; }
      const q = behind ? c : f;
      q.setTransform(D, 0, 0, D, 0, 0); q.strokeStyle = "#cfc6ee"; q.globalAlpha = .45 + .5 * clamp(W.lamp[0] + W.ambient * 2); q.lineWidth = Math.max(1, 1.4 * ts); q.beginPath(); q.moveTo(tx, ty); q.lineTo(ex, ey); q.stroke();
      q.fillStyle = GOLD; q.beginPath(); q.arc(ex, ey + 4 * ts, 5.5 * ts, 0, TAU); q.fill(); q.globalAlpha = 1;
      q.setTransform(1, 0, 0, 1, 0, 0);
    }
  }
  f.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    const I = W.lamp[i]; if (I < .01 || (i === 0 && behind)) continue; const Lp = LAMPS[i]; if (Lp.z - camZ < 40) continue;
    const [x0, y0, s0] = P3(Lp.x, Lp.y, Lp.z), [, y1] = P3(Lp.x, 0, Lp.z);
    f.globalAlpha = (i ? .22 : .26) * I; const wB = 420 * s0;
    f.drawImage(cone, (x0 - wB / 2) * D, (y0 - 8 * s0) * D, wB * D, (y1 - y0 + 60 * s0) * D);
  }
  f.globalAlpha = 1;
  if (G > .01) {
    // El chorro de luz que sale por la rendija (con aire, como una lámpara)
    const cx0 = crackX(), a = P3(cx0, DOOR.y0, WALL), b = P3(DOOR.x1, DOOR.y0, WALL), cc = P3(DOOR.x1 + 230, 0, 330), dd = P3(cx0 + 40, 0, 330);
    const g = f.createLinearGradient(a[0] * D, a[1] * D, cc[0] * D, cc[1] * D); g.addColorStop(0, `rgba(255,236,205,${.3 * G})`); g.addColorStop(1, "rgba(255,236,205,0)");
    f.fillStyle = g; f.beginPath(); f.moveTo(a[0] * D, a[1] * D); f.lineTo(b[0] * D, b[1] * D); f.lineTo(cc[0] * D, cc[1] * D); f.lineTo(dd[0] * D, dd[1] * D); f.closePath(); f.fill();
    const [dx, dy, ds] = P3((cx0 + DOOR.x1) / 2, -130, WALL);
    bloom(f, dx, dy, 220 * ds, [255, 236, 205], .55 * G * (RM ? 1 : .92 + .08 * Math.sin(t * 3)));
    bloom(f, dx, dy, 60 * ds, [255, 250, 240], .7 * G);
  }
  for (const d of dust) {
    if (!RM) { d.x += (d.vx + Math.sin(t * .6 + d.ph) * 4) * dt; d.y += d.vy * dt; d.vy = lerp(d.vy, -3, dt * .5); d.vx *= 1 - dt * .5; if (d.y < -320) { d.y = -160; d.x = LAMPS[d.l].x + (Math.random() - .5) * 300; } if (d.y > -160) d.y = -320; }
    const Lp = LAMPS[d.l], I = W.lamp[d.l]; if (I < .02 || d.z - camZ < 30) continue;
    const spread = 60 + (-d.y / 260) * -40 + 150 * (1 + d.y / 260); const inC = clamp(1 - Math.abs(d.x - Lp.x) / spread);
    const [x, y, s2] = P3(d.x, d.y, d.z); const a = inC * I * (.4 + .6 * Math.abs(Math.sin(t * 1.3 + d.ph)));
    if (a < .02) continue;
    f.fillStyle = `rgba(255,236,210,${a.toFixed(3)})`; f.beginPath(); f.arc(x * D, y * D, d.r * s2 * D * .9, 0, TAU); f.fill();
  }
  for (let i = 0; i < 3; i++) { const I = W.lamp[i]; if (I < .01 || (i === 0 && behind)) continue; const Lp = LAMPS[i]; if (Lp.z - camZ < 40) continue; const [x, y, s2] = P3(Lp.x, Lp.y + 2, Lp.z); bloom(f, x, y, 150 * s2, [255, 222, 180], .5 * I); bloom(f, x, y, 30 * s2, [255, 250, 235], .8 * I); }
  // En lo oscuro, las GG de su cara brillan: es el logo
  if (W.markGlow > .01) {
    const m = clamp(sp.mark.x), gl = W.markGlow * (1 - W.lamp[0] * .85);
    const eL = toScreen(78 + 9.54 * m + sp.faceX.x, 106 + sp.faceY.x, true), eR = toScreen(122 - 9.54 * m + sp.faceX.x, 106 + sp.faceY.x, true), mo = toScreen(100, lerp(131, 106, m), true);
    bloom(f, eL[0], eL[1], 52 * gS, [155, 93, 229], .85 * gl); bloom(f, eR[0], eR[1], 52 * gS, [61, 214, 203], .7 * gl); bloom(f, mo[0], mo[1], 34 * gS, [245, 55, 86], .55 * gl);
    bloom(f, (eL[0] + eR[0]) / 2, toScreen(100, 190)[1], 90 * gS, [155, 93, 229], .25 * gl);
  }
  // Partículas
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; if (gdt > 0) p.life += gdt; const k = p.life / p.max;
    if (k >= 1) { parts.splice(i, 1); continue; }
    if (p.t === "spark") { f.globalCompositeOperation = "lighter"; if (gdt) { p.vy += p.g * gdt; p.x += p.vx * gdt; p.y += p.vy * gdt; } f.strokeStyle = p.c; f.globalAlpha = 1 - k; f.lineWidth = 2.4 * D; f.beginPath(); f.moveTo(p.x * D, p.y * D); f.lineTo((p.x - p.vx * .03) * D, (p.y - p.vy * .03) * D); f.stroke(); f.globalAlpha = 1; }
    else if (p.t === "star") { f.globalCompositeOperation = "lighter"; if (gdt) { p.vy += 240 * gdt; p.x += p.vx * gdt; p.y += p.vy * gdt; p.vx *= .97; p.rot += p.vr * gdt; } f.save(); f.translate(p.x * D, p.y * D); f.rotate(p.rot); const r = p.r * D * (1 - k * .5); f.fillStyle = p.c; f.globalAlpha = 1 - k; f.beginPath(); f.moveTo(0, -r); f.lineTo(r * .25, -r * .25); f.lineTo(r, 0); f.lineTo(r * .25, r * .25); f.lineTo(0, r); f.lineTo(-r * .25, r * .25); f.lineTo(-r, 0); f.lineTo(-r * .25, -r * .25); f.closePath(); f.fill(); f.restore(); f.globalAlpha = 1; }
    else if (p.t === "conf") { f.globalCompositeOperation = "source-over"; if (gdt) { p.vy += 900 * gdt; p.vx *= .985; p.vy *= .985; p.x += p.vx * gdt; p.y += p.vy * gdt; p.rot += p.vr * gdt; } f.save(); f.translate(p.x * D, p.y * D); f.rotate(p.rot); f.scale(1, Math.cos(p.life * 9)); f.fillStyle = p.c; f.globalAlpha = Math.min(1, (1 - k) * 2); f.fillRect(-p.w / 2 * D, -p.h / 2 * D, p.w * D, p.h * D); f.restore(); f.globalAlpha = 1; }
    else if (p.t === "ring") { f.globalCompositeOperation = "lighter"; f.strokeStyle = `rgba(255,240,210,${(1 - k).toFixed(3)})`; f.lineWidth = (6 * (1 - k) + 1) * D; f.beginPath(); f.arc(p.x * D, p.y * D, p.r * (1 + k * 3.2) * D, 0, TAU); f.stroke(); }
  }
  f.globalCompositeOperation = "source-over";
  if (W.flash > .01) { bloom(f, W.flashX, W.flashY, 260 * gS / 2, [255, 248, 230], W.flash); W.flash = Math.max(0, W.flash - dt * 4); }
  // La línea de luz: de la mano de Gogo a lo que destaca en la pantalla, y un marco que lo resalta.
  if (S.beamA > .01 && S.beamRect) {
    const r = S.beamRect, a = S.beamA, [hx, hy] = toScreen(...(S.handR || [sp.hRx.x, sp.hRy.x]));
    // La línea llega hasta el borde de la pantalla (nunca la cruza ni tapa nada); adentro, el recuadro marca lo que muestra.
    const hb = holo.getBoundingClientRect(), ex = clamp(clamp(hx, r.left, r.right), hb.left, hb.right), ey = clamp(clamp(hy, r.top, r.bottom), hb.top, hb.bottom);
    const ex2 = hx < hb.left ? hb.left : hx > hb.right ? hb.right : ex, ey2 = hy > hb.bottom ? hb.bottom : hy < hb.top ? hb.top : ey;
    f.save(); f.globalCompositeOperation = "lighter"; f.lineCap = "round";
    f.strokeStyle = `rgba(124,196,255,${(.14 * a).toFixed(3)})`; f.lineWidth = 9 * D;
    f.beginPath(); f.moveTo(hx * D, hy * D); f.lineTo(ex2 * D, ey2 * D); f.stroke();
    const g = f.createLinearGradient(hx * D, hy * D, ex2 * D, ey2 * D); g.addColorStop(0, `rgba(200,232,255,${(.95 * a).toFixed(3)})`); g.addColorStop(1, `rgba(124,196,255,${(.6 * a).toFixed(3)})`);
    f.strokeStyle = g; f.lineWidth = 2.4 * D; if (!RM) { f.setLineDash([12 * D, 7 * D]); f.lineDashOffset = -t * 70 * D; }
    f.beginPath(); f.moveTo(hx * D, hy * D); f.lineTo(ex2 * D, ey2 * D); f.stroke(); f.setLineDash([]);
    f.strokeStyle = `rgba(124,196,255,${(.85 * a).toFixed(3)})`; f.lineWidth = 2 * D; f.fillStyle = `rgba(124,196,255,${(.07 * a).toFixed(3)})`;
    f.beginPath(); f.roundRect((r.left - 6) * D, (r.top - 6) * D, (r.width + 12) * D, (r.height + 12) * D, 12 * D); f.fill(); f.stroke();
    f.restore();
    bloom(f, hx, hy, 26 * gS / 2.2, [124, 196, 255], .5 * a); bloom(f, ex2, ey2, 22, [160, 214, 255], .7 * a);
  }
  // Viñeta y grano
  f.globalAlpha = 1; f.drawImage(vign, 0, 0, cvF.width, cvF.height);
  f.globalAlpha = .05; f.globalCompositeOperation = "overlay"; const ox = RM ? 0 : (Math.random() * 192) | 0, oy = RM ? 0 : (Math.random() * 192) | 0; f.fillStyle = f.createPattern(grain, "repeat"); f.translate(-ox, -oy); f.fillRect(ox, oy, cvF.width, cvF.height); f.setTransform(1, 0, 0, 1, 0, 0); f.globalAlpha = 1; f.globalCompositeOperation = "source-over";
}
function bloom(ctx, x, y, r, c, a) { if (a < .005 || r < 1) return; const g = ctx.createRadialGradient(x * D, y * D, 0, x * D, y * D, r * D); g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`); g.addColorStop(.4, `rgba(${c[0]},${c[1]},${c[2]},${a * .35})`); g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`); const prev = ctx.globalCompositeOperation; ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect((x - r) * D, (y - r) * D, r * 2 * D, r * 2 * D); ctx.globalCompositeOperation = prev; }
function poolE(l, hs, x, z, r, col, a) {
  const zn = Math.max(z - r, camZ + 20); const [cx] = P3(x, 0, z), yN = P3(x, 0, zn)[1], yF = P3(x, 0, z + r)[1], s = P3(x, 0, z)[2];
  const rx = r * s, ry = Math.max(2, (yN - yF) / 2), cy = (yN + yF) / 2;
  l.save(); l.translate(cx * hs, cy * hs); l.scale(1, ry / rx); const g = l.createRadialGradient(0, 0, 0, 0, 0, rx * hs); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.55, `rgba(${col},${a * .45})`); g.addColorStop(1, `rgba(${col},0)`); l.fillStyle = g; l.beginPath(); l.arc(0, 0, rx * hs, 0, TAU); l.fill(); l.restore();
}
function lamp(ctx, i) {
  const Lp = LAMPS[i]; if (Lp.z - camZ < 40) return; const I = W.lamp[i];
  setT(ctx, Lp.z, D);
  ctx.strokeStyle = "#0c0a14"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(Lp.x, Lp.y - 44); ctx.lineTo(Lp.x, Lp.y - 2400); ctx.stroke();
  const g = ctx.createLinearGradient(Lp.x - 48, 0, Lp.x + 48, 0); g.addColorStop(0, "#15121f"); g.addColorStop(.35, I > .05 ? "#5c5480" : "#2a2540"); g.addColorStop(1, "#15121f");
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(Lp.x - 48, Lp.y); ctx.quadraticCurveTo(Lp.x - 46, Lp.y - 44, Lp.x, Lp.y - 48); ctx.quadraticCurveTo(Lp.x + 46, Lp.y - 44, Lp.x + 48, Lp.y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#0c0a14"; ctx.fillRect(Lp.x - 7, Lp.y - 56, 14, 10);
  ctx.fillStyle = I > .05 ? `rgba(255,240,215,${.25 + .75 * I})` : "#1e1a2c"; ctx.beginPath(); ctx.ellipse(Lp.x, Lp.y, 47, 7, 0, 0, TAU); ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
// El neón de la pared: las GG del gym (decorativo: violeta, lavanda y el guion rojo, como el EnlaceLink en neón)
function neon(c, t) {
  const on = W.neon; if (on < .01) return;
  const s = setT(c, WALL - 6, D);
  const fl = (k) => (RM ? 1 : (Math.sin(t * 50 + k) > .97 ? .65 : 1));
  c.save(); c.lineCap = "round"; c.lineJoin = "round";
  c.translate(-362, -472); c.scale(1.7, 1.7);
  for (const [d, col] of [["M46.51 14.4A26 26 0 1 0 68 40", "#a66bf0"], ["M73.49 65.6A26 26 0 1 0 52 40", "#cdb0ff"], ["M42 40H78", "#ff4a68"]]) {
    const p = new Path2D(d);
    c.globalAlpha = on * fl(col.length); c.shadowColor = col; c.shadowBlur = 22 * s * D; c.strokeStyle = col; c.lineWidth = 9; c.stroke(p);
    c.shadowBlur = 0; c.strokeStyle = "rgba(255,248,255,.85)"; c.lineWidth = 2.6; c.stroke(p);
  }
  c.restore(); c.globalAlpha = 1; c.setTransform(1, 0, 0, 1, 0, 0);
}

// El globo, anclado a un punto fijo de la escena: la cabeza de Gogo en reposo (su lugar en la sala, sin
// saltos, ni gestos, ni temblor). Si Gogo cambia de lugar, se desliza con él una vez, sin rebotar.
function bubbleAt() {
  if (!bub.classList.contains("on")) return;
  const s = LY.k * GZ / Math.max(sp.wz.x - cam.z.x, 4);
  const gx = LY.cx + (sp.wx.x - cam.x.x) * s, top = LY.ground - 150 * LY.k + (150 - cam.y.x) * s - 124 * s;
  let x, y, flip = false;
  const side = phone();
  // Al costado de la cabeza, el ancho es el que queda hasta el borde (nunca se da vuelta sobre su cara).
  // En la parada 4, después de los discos de la barra (no se pisan).
  const sideX = gx + (S.cur === 4 ? 100 : 58) * s + 4;
  bub.style.maxWidth = side ? Math.max(120, Math.round(VW - 10 - sideX)) + "px" : "";
  let bw = bub.offsetWidth, bh = bub.offsetHeight;
  if (side) {
    const tt = (LY.tops ? LY.tops[S.cur] : VH) - 50, face = { x: gx - 42 * s, r: gx + 42 * s, y: top + 26 * s, b: top + 92 * s }; // los ojos y la boca
    const hits = (bx, by, w2, h2) => bx < face.r && bx + w2 > face.x && by < face.b && by + h2 > face.y;
    const room = VW - 10 - sideX;
    bub.style.maxWidth = room >= 120 ? Math.round(room) + "px" : "";
    bw = bub.offsetWidth; bh = bub.offsetHeight;
    const yHead = Math.max(70, Math.min(Math.max(top - 6, holoOn ? holoR.y + holoR.h + 8 : 70), tt - bh));
    const cands = [
      room >= 120 ? [Math.min(sideX, VW - 10 - bw), yHead] : null,                                   // a la derecha de la cabeza
      [clamp(gx - bw * .5, 10, VW - 10 - bw), Math.max(70, Math.min(top - bh - 10, tt - bh))],         // arriba
      [Math.max(10, gx - 64 * s - 6 - bw), yHead],                                                    // a la izquierda
    ].filter(Boolean);
    [x, y] = cands.find(([cx2, cy2]) => !hits(cx2, cy2, bw, bh)) || cands[0];
    flip = x + bw < gx;
  } else {
    // Arriba de la cabeza, con aire para los saltos; nunca sobre la pantalla ni sobre la columna de texto.
    const right = holoOn ? holoR.x - 8 : VW - 10;
    const inn = document.querySelector(".ch.on .ch-in");
    const left = phone() ? 10 : (inn ? inn.getBoundingClientRect().right + 12 : 10);
    if (!phone() && right - left < bw) { bub.style.maxWidth = Math.max(160, right - left) + "px"; bw = bub.offsetWidth; bh = bub.offsetHeight; }
    x = gx - bw * .22;
    if (x + bw > right) { x = gx - bw * .78; flip = true; }
    x = clamp(x, left, Math.max(left, right - bw));
    y = clamp(top - bh - 12 - 22 * s, 70, VH - bh - 8);
    // En el teléfono, nunca sobre el texto de la parada.
    if (phone() && inn) y = Math.max(70, Math.min(y, inn.getBoundingClientRect().top - bh - 10));
  }
  bub.classList.toggle("flip", flip);
  bub.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
}

// "Preparando todo…": la barra se acerca al final, late y nunca llega.
const warmB = $("warmB");
let warmT = 0;
function warm(dt) {
  if (S.cur !== 12) { warmT = 0; return; }
  warmT += dt;
  const p = RM ? 96 : Math.min(99.2, 95 + 3.4 * (1 - Math.exp(-warmT / 16)) + .5 * Math.sin(warmT * 2.4));
  warmB.style.setProperty("--p", p.toFixed(2) + "%");
}

// Compartir la página (o copiar el enlace, si el navegador no comparte).
const shareOk = $("shareOk"); let shareT = 0;
$("shareB").addEventListener("click", async () => {
  const url = location.origin + location.pathname;
  if (navigator.share) { try { await navigator.share({ title: document.title, text: "Go-Gyms: muy pronto.", url }); } catch { /* lo cerró */ } return; }
  let msg = "Enlace copiado";
  try { await navigator.clipboard.writeText(url); } catch { msg = "Copiá el enlace de la barra de direcciones"; }
  shareOk.textContent = msg; shareOk.classList.add("on"); clearTimeout(shareT);
  shareT = setTimeout(() => shareOk.classList.remove("on"), 2600);
});

// ── Puntero, toques y la vista ────────────────────────────────────────────────
addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { S.pointer = [e.clientX, e.clientY]; S.pointerT = performance.now(); } }, { passive: true });
hit.addEventListener("click", () => { if (S.introDone && !(act && act.prio > 1)) { play("poke"); jiggle(.2); } });
let rzT = 0, lastW = 0;
addEventListener("resize", () => {
  clearTimeout(rzT);
  // En el teléfono, la barra del navegador cambia el alto al hacer scroll: solo se rehace si cambia el ancho.
  rzT = setTimeout(() => { if (innerWidth === lastW && phone()) { layout(); kick(); return; } lastW = innerWidth; resize(); seedDust(); }, 120);
});
window.visualViewport?.addEventListener("resize", () => { if (phone()) { clearTimeout(rzT); rzT = setTimeout(() => { layout(); kick(); }, 120); } });
document.fonts?.ready.then(() => { layout(); kick(); });
document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) kick(); });
mq.addEventListener?.("change", (e) => { RM = e.matches; enterChapter(S.cur); kick(); });

// ── Arranque ──────────────────────────────────────────────────────────────────
buildSprites(); buildMocks(); lastW = innerWidth; resize(); seedDust();
hit.classList.add("on");
S.cur = -1;
const startAt = readChapter();
setChapter(startAt);
aim(true);
if (startAt === 0 && !RM) {
  // Desde el principio: en lo oscuro solo brillan sus GG; parpadea, salta, tira de la cuerda y prende la sala.
  for (const k in sp) sp[k].snap(REST[k]);
  sp.mark.snap(1); sp.blush.snap(0);
  play("intro");
} else {
  // Llegó a la mitad del recorrido (o con movimiento reducido): la sala ya prendida.
  Object.assign(W, { neon: 1, ambient: .26 }); W.lamp = [1, 1, 1];
  S.introDone = true; enterChapter(S.cur, true);
  if (S.cur === 0 && !RM) say(line(0, 0));
}
kick();
})();
