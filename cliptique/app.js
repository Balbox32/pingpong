// Cliptique shop: catalogue, 3D stages, product dialog and bag.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CLIP_BUILDERS, BOTTLE_BUILDERS, makeMaterials, setClipLook, drawLabel, shadowTexture, logoPath } from './models.js';
import { SHAPES } from './brand-shapes.js';

const T = THREE, PI = Math.PI;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const eur = n => '€' + n.toFixed(2);
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// ---------- catalogue
const COLOURS = [
  { id: 'plum', name: 'Plum', hex: '#30232E' }, { id: 'cloud', name: 'Cloud', hex: '#EDE7DC' }, { id: 'sage', name: 'Sage', hex: '#A8B89A' },
  { id: 'lilac', name: 'Lilac', hex: '#B9A6D3' }, { id: 'terracotta', name: 'Terracotta', hex: '#C8775A' }, { id: 'bamboo', name: 'Bamboo', hex: '#D9B98A' },
  { id: 'lime', name: 'Lime', hex: '#D5EF68' },
  { id: 'tortoise', name: 'Tortoise', hex: 'tortoise', swatch: 'radial-gradient(circle at 30% 30%, #e3b56e 0 18%, #6b3415 30%, #c98d47 46%, #2a130a 62%, #b77a3a 78%)' },
];
const FELTS = [
  { id: 'cream', name: 'Cream', hex: '#F2EBDD' }, { id: 'lime', name: 'Lime', hex: '#D5EF68' }, { id: 'lilac', name: 'Lilac', hex: '#C9B8E0' },
  { id: 'rose', name: 'Rose', hex: '#E8A9A0' }, { id: 'stone', name: 'Stone', hex: '#9B948C' },
];
const ALL = ['plum', 'cloud', 'sage', 'lilac', 'terracotta', 'bamboo', 'lime'];
const CLIPS = [
  { id: 'oval', name: 'The Oval', type: 'Snap clip', colour: 'plum', felt: 'cream', colours: ALL, premium: 0,
    blurb: 'Our everyday clip. A long, quiet oval that sits above the ear and holds a strip of felt along its length.', view: { spin: -0.42, tilt: 0.62 } },
  { id: 'leaf', name: 'The Leaf', type: 'Snap clip', colour: 'sage', felt: 'cream', colours: ALL, premium: 0,
    blurb: 'Drawn from an olive leaf, with the felt set along its centre like a vein.', view: { spin: 0.4, tilt: 0.62 } },
  { id: 'sigc', name: 'Signature C', type: 'Snap clip', colour: 'plum', felt: 'lime', colours: ALL, premium: 0, badge: 'Signature',
    blurb: 'The plum from the Cliptique mark, cut as a clip. Our house shape.', view: { spin: 0.1, tilt: 0.7 } },
  { id: 'sigq', name: 'Signature Q', type: 'Snap clip', colour: 'lime', felt: 'cream', colours: ALL, premium: 0, badge: 'Signature',
    blurb: 'The pear from the Cliptique mark, with its little tail. Wear it beside Signature C.', view: { spin: -0.15, tilt: 0.7 } },
  { id: 'claw', name: 'The Claw', type: 'Claw clip', colour: 'tortoise', felt: 'cream', colours: ['tortoise', ...ALL], premium: 3, badge: 'New',
    blurb: 'A full claw for twists and half-up styles, with a felt inlay along the front jaw.', view: { yaw: -0.85, pitch: 0.16 } },
  { id: 'bar', name: 'The Line', type: 'Barrette', colour: 'cloud', felt: 'stone', colours: ALL, premium: 0,
    blurb: 'A slim barrette on a French clasp. It holds a fine line of felt and a lot of hair.', view: { spin: -0.5, tilt: 0.62 } },
  { id: 'shell', name: 'The Paphos Shell', type: 'Snap clip', colour: 'bamboo', felt: 'rose', colours: ALL, premium: 2, badge: 'New',
    blurb: 'A ribbed scallop with a round felt heart at the hinge, named for the coast where Aphrodite came ashore.', view: { spin: 0, tilt: 0.78 } },
];
const SCENTS = [
  { id: 'citrus', name: 'Citrus Grove', notes: 'Bright, green and sunlit', bottle: 'Amber glass dropper',
    blend: [['Citronella', 40], ['Lemongrass', 30], ['Geranium', 20], ['Lavender', 10]],
    glass: { color: '#e0a35a', attenuation: '#9a5512', distance: 11, thickness: 1.3 }, liquid: '#d79b3c', cap: { color: '#211c1f', roughness: 0.42 },
    label: { paper: '#F3EEDF', ink: '#30232E', dot: '#B9CF4A', stack: true, big: 15 }, view: { yaw: -0.3 } },
  { id: 'lavender', name: 'Lavender Dusk', notes: 'Soft, floral and calm', bottle: 'Frosted glass, bamboo cap',
    blend: [['Lavender', 40], ['Geranium', 30], ['Citronella', 30]],
    glass: { color: '#ece5f4', roughness: 0.4, thickness: 2.4 }, liquid: '#9d86c4', cap: { wood: ['#d6b688', '#8a6a3e', 11] },
    label: { ink: '#ffffff', dot: '#ffffff', style: 'print', stack: true, big: 15 }, labelStyle: 'print', view: { yaw: -0.2 } },
  { id: 'geranium', name: 'Rose Geranium', notes: 'Rosy, green and warm', bottle: 'Blush glass, porcelain stopper',
    blend: [['Geranium', 40], ['Citronella', 30], ['Lemongrass', 20], ['Lavender', 10]],
    glass: { color: '#fbe7e2', attenuation: '#f0bfb5', distance: 26, roughness: 0.02, thickness: 2 }, liquid: '#df8f84', cap: { color: '#f1ece4', roughness: 0.26, clearcoat: 0.8 },
    label: { paper: '#F6EFE6', ink: '#30232E', dot: '#E8A9A0', stack: true, big: 15 }, view: { yaw: -0.25 } },
  { id: 'fig', name: 'Winter Cedar', notes: 'Cedarwood, sweet orange, quiet spice', bottle: 'Smoked glass, carob-wood cap', limited: true,
    blend: [['Cedarwood', 40], ['Sweet orange', 30], ['Lavender', 20], ['Frankincense', 10]],
    glass: { color: '#a29a92', attenuation: '#4d443d', distance: 12, roughness: 0.05, thickness: 1.8 }, liquid: '#7a4128', cap: { wood: ['#5d3d29', '#22140b', 23] },
    label: { paper: '#ECE6DA', ink: '#30232E', dot: '#9BA86A', stack: true, big: 15 }, view: { yaw: -0.5 } },
];
const SIZES = [{ id: '5', name: '5 ml', price: 6.9, note: 'Refill' }, { id: '10', name: '10 ml', price: 11.9, note: 'Full bottle' }];
const SETS = [
  { id: 'single', name: 'Single', clips: 1, refills: 1, base: 11.9, items: ['One clip in your colour', 'One 5 ml blend', 'Wool felt pad, fitted'] },
  { id: 'pair', name: 'Pair', clips: 2, refills: 1, base: 19.9, items: ['Two clips, mixed or matched', 'One 5 ml blend', 'Backing card and sticker'], tag: 'Most chosen' },
  { id: 'family', name: 'Family', clips: 4, refills: 2, base: 34.9, items: ['Four clips for everyone', 'Two 5 ml blends', 'Any mix of shapes and colours'] },
];
const colour = id => COLOURS.find(c => c.id === id), felt = id => FELTS.find(f => f.id === id);
const setPrice = (clip, set) => +(set.base + clip.premium * set.clips).toFixed(2);

// ---------- products: geometry + materials, built on demand
const products = new Map();
function product(kind, id) {
  const key = kind + ':' + id; if (products.has(key)) return products.get(key);
  let p;
  if (kind === 'clip') {
    const def = CLIPS.find(c => c.id === id), model = CLIP_BUILDERS[id](), mats = makeMaterials('clip');
    p = { kind, id, def, model, mats, state: { colour: def.colour, felt: def.felt, set: 'single', scent: 'citrus' } };
    setClipLook(mats, colour(def.colour).hex, felt(def.felt).hex);
  } else {
    const def = SCENTS.find(s => s.id === id), model = BOTTLE_BUILDERS[id]();
    const mats = makeMaterials('bottle', { glass: def.glass, liquid: def.liquid, cap: def.cap, labelStyle: def.labelStyle, labelAspect: model.label.h / model.label.w });
    p = { kind, id, def, model, mats, state: { size: '5' } };
    paintLabel(p);
  }
  products.set(key, p); return p;
}
function paintLabel(p) { drawLabel(p.mats.labelCanvas, p.def, p.state.size === '10' ? '10 ML' : '5 ML'); p.mats.labelTex.needsUpdate = true; }

// An oriented copy of a product's meshes (geometry and materials are shared).
function instance(p, o = {}) {
  const inner = new T.Group(), v = p.def.view || {};
  for (const part of p.model.parts) { const m = new T.Mesh(part.geo, p.mats[part.mat]); if (part.mat === 'label') m.renderOrder = 2; inner.add(m); }
  if (p.kind === 'clip' && !p.model.upright) inner.rotation.set(-PI / 2 + (o.tilt ?? v.tilt ?? 0.62), 0, o.spin ?? v.spin ?? 0, 'XYZ');
  else if (p.kind === 'clip') inner.rotation.set(v.pitch ?? 0.15, v.yaw ?? -0.5, 0, 'YXZ');
  else inner.rotation.set(0, v.yaw ?? -0.3, 0);
  const holder = new T.Group(); holder.add(inner);
  const box = new T.Box3().setFromObject(holder), c = box.getCenter(new T.Vector3()); inner.position.sub(c);
  holder.userData.box = new T.Box3().setFromObject(holder);
  return holder;
}

// ---------- rendering
const backdrop = { tex: null, version: 0 };
function backdropTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 24, 2, 32, 30, 46); g.addColorStop(0, cssVar('--stage-top')); g.addColorStop(1, cssVar('--stage-bottom'));
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
function refreshBackdrop() {
  const old = backdrop.tex; backdrop.tex = backdropTexture(); backdrop.version++;
  for (const s of allStages) { s.bg.material.map = backdrop.tex; s.bg.material.needsUpdate = true; s.dirty = true; }
  old && old.dispose();
}

function makeGL(canvas) {
  const r = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  r.toneMapping = T.NeutralToneMapping; r.toneMappingExposure = 0.8;
  const pm = new T.PMREMGenerator(r); const env = pm.fromScene(new RoomEnvironment(r), 0.035).texture; pm.dispose();
  return { r, env };
}

const allStages = [];
// A scene with lights, a theme-coloured backdrop that glass can refract, a soft contact shadow and a camera fitted to its contents.
function makeStage(gl, groups, o = {}) {
  const scene = new T.Scene(); scene.environment = gl.env;
  const key = new T.DirectionalLight('#fff3e6', 2.0); key.position.set(-0.6, 1, 0.75); scene.add(key);
  const rim = new T.DirectionalLight('#ffffff', 1.4); rim.position.set(0.8, 0.5, -0.9); scene.add(rim);
  const fill = new T.DirectionalLight('#f1f0ff', 0.5); fill.position.set(0.9, 0.2, 1); scene.add(fill);
  const world = new T.Group(); scene.add(world);
  const box = new T.Box3(); groups.forEach(g => { world.add(g.obj); g.obj.updateMatrixWorld(true); box.union(new T.Box3().setFromObject(g.obj)); });
  const size = box.getSize(new T.Vector3()), center = box.getCenter(new T.Vector3());
  // radius in the horizontal plane (the stage sways around Y) and half height
  let rH = 0; for (const x of [box.min.x, box.max.x]) for (const z of [box.min.z, box.max.z]) rH = Math.max(rH, Math.hypot(x - center.x, z - center.z));
  const shadow = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, toneMapped: false, opacity: o.shadow ?? 0.85 }));
  shadow.rotation.x = -PI / 2; shadow.position.set(center.x, box.min.y - size.y * 0.16 - 2, center.z);
  shadow.scale.set(Math.max(size.x, 10) * 1.15, Math.max(size.z, size.x * 0.45) * 1.15, 1); scene.add(shadow);
  const cam = new T.PerspectiveCamera(o.fov ?? 24, 1, 1, 5000); scene.add(cam);
  const bg = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: backdrop.tex, toneMapped: false, depthWrite: false }));
  bg.renderOrder = -10; cam.add(bg);
  const st = { gl, scene, cam, world, groups, shadow, bg, center, rH, halfH: size.y / 2 + size.y * 0.1 + 3, elev: o.elev ?? 0.2, pad: o.pad ?? 1.1, aspect: 0, dirty: true, visible: false, hover: { x: 0, y: 0, tx: 0, ty: 0, on: false }, phase: Math.random() * 6 };
  st.fit = aspect => {
    if (aspect === st.aspect) return; st.aspect = aspect;
    const v = T.MathUtils.degToRad(cam.fov), h = 2 * Math.atan(Math.tan(v / 2) * aspect);
    const d = Math.max(st.rH / Math.tan(h / 2), st.halfH / Math.tan(v / 2)) * st.pad + st.rH;
    const look = st.center.clone(); look.y -= st.halfH * 0.08;
    cam.position.set(look.x, look.y + Math.sin(st.elev) * d, look.z + Math.cos(st.elev) * d); cam.lookAt(look);
    cam.aspect = aspect; cam.near = d * 0.05; cam.far = d * 10; cam.updateProjectionMatrix();
    const D = d * 4; bg.position.set(0, 0, -D); bg.scale.set(2 * D * Math.tan(v / 2) * aspect * 1.05, 2 * D * Math.tan(v / 2) * 1.05, 1);
    st.dist = d;
  };
  allStages.push(st); return st;
}
// Gentle turntable sway, float and pointer tilt.
function animateStage(st, t) {
  const h = st.hover; h.x += (h.tx - h.x) * 0.08; h.y += (h.ty - h.y) * 0.08;
  const sway = reduce ? 0 : Math.sin(t * 0.45 + st.phase) * 0.36;
  st.world.rotation.y = sway + h.x * 0.55; st.world.rotation.x = h.y * 0.12;
  st.groups.forEach((g, i) => {
    const f = reduce ? 0 : Math.sin(t * 0.9 + st.phase + i * 1.7) * (g.float ?? 1.2);
    g.obj.position.y = g.y0 + f; if (g.spin && !reduce) g.obj.rotation.y = g.ry0 + Math.sin(t * 0.35 + i) * g.spin;
  });
  const lift = st.groups[0].obj.position.y - st.groups[0].y0; st.shadow.material.opacity = (st.shadowBase ?? 0.85) * (1 - lift * 0.05);
}
function bindHover(el, st) {
  el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); st.hover.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; st.hover.ty = ((e.clientY - r.top) / r.height - 0.5) * 2; st.hover.on = true; });
  el.addEventListener('pointerleave', () => { st.hover.tx = 0; st.hover.ty = 0; st.hover.on = false; });
}

// One offscreen renderer draws every product card, then copies its pixels into the card's own canvas.
let cardGL = null;
const cards = [];
function cardRenderer() {
  if (!cardGL) cardGL = makeGL(document.createElement('canvas'));
  return cardGL;
}
function registerCard(el, build) {
  const canvas = el.querySelector('canvas'), ctx = canvas.getContext('2d');
  const card = { el, canvas, ctx, build, st: null, visible: false, near: false, w: 0, h: 0 };
  cards.push(card);
  new ResizeObserver(() => { const dpr = Math.min(devicePixelRatio || 1, 1.75); card.w = Math.round(canvas.clientWidth * dpr); card.h = Math.round(canvas.clientHeight * dpr); canvas.width = card.w; canvas.height = card.h; if (card.st) card.st.dirty = true; }).observe(canvas);
  return card;
}
const nearObs = new IntersectionObserver(es => es.forEach(e => { const c = cards.find(k => k.el === e.target); if (c) { c.near = e.isIntersecting || c.near; c.visible = e.isIntersecting; if (c.st) c.st.dirty = true; } }), { rootMargin: '300px 0px' });

// ---------- UI: clip and scent grids
function swatchBtn(c, checked, label, big) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'sw' + (big ? ' lg' : ''); b.setAttribute('role', 'radio');
  b.setAttribute('aria-checked', String(checked)); b.setAttribute('aria-label', label); b.title = label; b.style.background = c.swatch || c.hex; return b;
}
function clipCard(def) {
  const el = document.createElement('article'); el.className = 'card reveal pending'; el.dataset.id = def.id;
  el.innerHTML = `
    <button class="stage" type="button" aria-label="Open ${def.name} in 3D"><canvas></canvas>${def.badge ? `<span class="badge">${def.badge}</span>` : ''}<span class="view">View in 3D</span></button>
    <div class="meta">
      <div class="row"><h3>${def.name}</h3><span class="price">${def.premium ? eur(11.9 + def.premium) : '€11.90'}</span></div>
      <p class="spec"><span class="t">${def.type}</span><span class="opt"> · <span class="cn"></span></span></p>
      <div class="swatches" role="radiogroup" aria-label="${def.name} colour"></div>
    </div>`;
  const sw = el.querySelector('.swatches'), cn = el.querySelector('.cn');
  const sync = () => {
    const s = clipState(def.id); cn.textContent = `${colour(s.colour).name}, ${felt(s.felt).name.toLowerCase()} felt`;
    sw.querySelectorAll('.sw').forEach(b => b.setAttribute('aria-checked', String(b.dataset.c === s.colour)));
  };
  def.colours.forEach(cid => { const b = swatchBtn(colour(cid), cid === def.colour, colour(cid).name); b.dataset.c = cid; b.onclick = () => recolour(def.id, cid, null); sw.appendChild(b); });
  el.querySelector('.stage').onclick = () => openProduct('clip', def.id);
  el._sync = sync; sync();
  registerCard(el.querySelector('.stage'), () => product('clip', def.id));
  return el;
}
const clipStates = {}; CLIPS.forEach(c => (clipStates[c.id] = { colour: c.colour, felt: c.felt }));
const clipState = id => clipStates[id];
function recolour(id, c, f) {
  const s = clipStates[id]; if (c) s.colour = c; if (f) s.felt = f;
  const p = products.get('clip:' + id); if (p) { setClipLook(p.mats, colour(s.colour).hex, felt(s.felt).hex); markDirty(); }
  document.querySelector(`#clip-grid [data-id="${id}"]`)?._sync();
}
function markDirty() { allStages.forEach(s => (s.dirty = true)); }

const scentStates = {}; SCENTS.forEach(s => (scentStates[s.id] = { size: '5' }));
function scentCard(def) {
  const el = document.createElement('article'); el.className = 'card reveal pending'; el.dataset.id = def.id;
  el.innerHTML = `
    <button class="stage" type="button" aria-label="Open ${def.name} in 3D"><canvas></canvas>${def.limited ? '<span class="badge">Limited · winter</span>' : ''}<span class="view">View in 3D</span></button>
    <div class="meta">
      <div class="row"><h3>${def.name}</h3><span class="price"></span></div>
      <p class="notes">${def.notes}</p>
      <ul class="blend">${def.blend.map(([n, v]) => `<li><span>${n}</span><span class="pct">${v}%</span><span class="bar" style="--w:${v}%"></span></li>`).join('')}</ul>
      <div class="add-row"><div class="sizes" role="group" aria-label="Bottle size">${SIZES.map(z => `<button type="button" data-z="${z.id}">${z.name}</button>`).join('')}</div><button class="btn" type="button">Add</button></div>
    </div>`;
  const price = el.querySelector('.price');
  const sync = () => { const z = SIZES.find(z => z.id === scentStates[def.id].size); price.textContent = eur(z.price); el.querySelectorAll('.sizes button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.z === z.id))); };
  el.querySelectorAll('.sizes button').forEach(b => (b.onclick = () => setSize(def.id, b.dataset.z)));
  el.querySelector('.add-row .btn').onclick = () => addScent(def.id);
  el.querySelector('.stage').onclick = () => openProduct('bottle', def.id);
  el._sync = sync; sync();
  registerCard(el.querySelector('.stage'), () => product('bottle', def.id));
  return el;
}
function setSize(id, z) {
  scentStates[id].size = z; const p = products.get('bottle:' + id); if (p) { p.state.size = z; paintLabel(p); markDirty(); }
  document.querySelector(`#scent-grid [data-id="${id}"]`)?._sync(); if (dlg.kind === 'bottle' && dlg.id === id) renderPanel();
}

function buildGrids() {
  const cg = $('#clip-grid'); CLIPS.forEach(d => cg.appendChild(clipCard(d)));
  const promo = document.createElement('article'); promo.className = 'card reveal pending';
  promo.innerHTML = `<div class="promo"><p class="eyebrow">The pair set</p><h3>Two clips and a blend.</h3><p>Mix any two shapes and colours. Comes with a 5 ml blend, packed on a backing card ready to give.</p><span class="big">€19.90</span><a class="link" href="#sets">See all sets</a></div>`;
  cg.appendChild(promo);
  const sg = $('#scent-grid'); SCENTS.forEach(d => sg.appendChild(scentCard(d)));
  const sl = $('#sets-list');
  SETS.forEach(s => {
    const d = document.createElement('div'); d.className = 'set reveal pending';
    d.innerHTML = `${s.tag ? `<span class="tag">${s.tag}</span>` : '<span class="tag" aria-hidden="true">&nbsp;</span>'}<h3>${s.name}</h3><span class="p">${eur(s.base)}</span><ul>${s.items.map(i => `<li>${i}</li>`).join('')}</ul><button class="btn ghost" type="button">Choose a clip</button>`;
    d.querySelector('button').onclick = () => { const c = CLIPS[s.id === 'pair' ? 2 : s.id === 'family' ? 0 : 1]; clipStatesSet(c.id, s.id); openProduct('clip', c.id); };
    sl.appendChild(d);
  });
  cards.forEach(c => nearObs.observe(c.el));
}
const clipSet = {}; const clipStatesSet = (id, set) => (clipSet[id] = set);

// ---------- hero still life
let heroGL = null, hero = null;
function buildHero() {
  const canvas = $('#hero-canvas'); heroGL = makeGL(canvas);
  const sig = product('clip', 'sigc'), leaf = product('clip', 'leaf'), rose = product('bottle', 'geranium');
  const g1 = instance(sig, { tilt: 0.78, spin: 0.22 }), g2 = instance(leaf, { tilt: 0.5, spin: 0.55 }), g3 = instance(rose);
  g1.scale.setScalar(1.25); g1.position.set(4, 6, 12); g2.position.set(26, -20, 26); g2.rotation.y = -0.3; g3.position.set(-24, -6, -16); g3.scale.setScalar(1.12);
  const groups = [g1, g2, g3].map((obj, i) => ({ obj, y0: obj.position.y, ry0: obj.rotation.y, float: [1.8, 1.3, 0.9][i], spin: [0.18, 0.22, 0.14][i] }));
  hero = makeStage(heroGL, groups, { fov: 22, elev: 0.16, pad: 0.8 }); hero.shadowBase = 0.7;
  hero.shadow.scale.multiplyScalar(0.9);
  bindHover($('#hero-stage'), hero);
  new IntersectionObserver(es => es.forEach(e => (hero.visible = e.isIntersecting))).observe($('#hero-stage'));
  const ro = () => { const dpr = Math.min(devicePixelRatio || 1, 2); heroGL.r.setPixelRatio(dpr); heroGL.r.setSize(canvas.clientWidth, canvas.clientHeight, false); hero.fit(canvas.clientWidth / Math.max(1, canvas.clientHeight)); hero.dirty = true; };
  new ResizeObserver(ro).observe(canvas); ro();
}

// ---------- exploded view (how it works)
let explode = null;
function buildExplode() {
  const stage = $('#explode-stage');
  const p = product('clip', 'oval'), inner = new T.Group(), sep = { felt: 11, steel: -9 };
  for (const part of p.model.parts) { const m = new T.Mesh(part.geo, p.mats[part.mat]); m.position.z = sep[part.mat] || 0; inner.add(m); }
  // three drops of oil above the felt
  const dropGeo = new T.LatheGeometry(new T.SplineCurve([[0, 0], [1.25, 0.5], [1.6, 1.7], [1.1, 3], [0.35, 4.2], [0, 4.7]].map(q => new T.Vector2(q[0], q[1]))).getPoints(24), 32);
  dropGeo.rotateX(PI / 2);
  const dropMat = new T.MeshPhysicalMaterial({ color: '#e5ad55', roughness: 0.05, clearcoat: 1, transmission: 0.0, envMapIntensity: 1.4 });
  const drops = [-14, 0, 14].map((x, i) => { const d = new T.Mesh(dropGeo, dropMat); d.position.set(x, 0, 24); d.userData.i = i; inner.add(d); return d; });
  inner.rotation.set(-PI / 2 + 0.58, 0, -0.18, 'XYZ');
  const holder = new T.Group(); holder.add(inner);
  const box = new T.Box3().setFromObject(holder), c = box.getCenter(new T.Vector3()); inner.position.sub(c);
  const card = registerCard(stage, null); card.custom = true;
  card.st = makeStage(cardRenderer(), [{ obj: holder, y0: 0, float: 0.6 }], { fov: 22, elev: 0.12, pad: 1.0 });
  card.st.shadowBase = 0.55;
  // callouts are pinned to points in the clip's own space
  const labels = [
    { text: '3–5 drops of blend', short: '3–5 drops', p: [17, 0, 21], side: 'right' },
    { text: 'Wool felt pad · 3 mm', short: 'Wool felt', p: [-21, 0, sep.felt + 3.4], side: 'left' },
    { text: 'Plant-based PLA top · 65 × 17 mm', short: 'PLA top', p: [27, -5, 3], side: 'right' },
    { text: 'Steel snap clip · 56 mm', short: 'Steel clip', p: [-16, -3, sep.steel - 2], side: 'left' },
  ].map(l => { const e = document.createElement('div'); e.className = 'callout' + (l.side === 'left' ? ' left' : ''); e.innerHTML = `<i></i><span>${l.text}</span>`; stage.appendChild(e); return { ...l, e, span: e.querySelector('span') }; });
  explode = { card, inner, drops, labels, sep };
  bindHover(stage, card.st);
  nearObs.observe(stage);
}
const _v = new T.Vector3();
function placeCallouts() {
  const { card, inner, labels, drops } = explode, st = card.st;
  if (!reduce) { const t = performance.now() / 1000; drops.forEach((d, i) => { const k = (t * 0.35 + i * 0.33) % 1; d.position.z = 24 - k * 9; d.scale.setScalar(Math.max(0.001, k > 0.8 ? 1 - (k - 0.8) / 0.2 : Math.min(1, k * 6))); }); }
  st.scene.updateMatrixWorld(); st.cam.updateMatrixWorld();
  const w = card.canvas.clientWidth, h = card.canvas.clientHeight;
  labels.forEach(l => {
    const txt = w < 480 ? l.short : l.text; if (l.span.textContent !== txt) l.span.textContent = txt;
    _v.set(l.p[0], l.p[1], l.p[2]); inner.localToWorld(_v); _v.project(st.cam);
    const x = (_v.x * 0.5 + 0.5) * w, y = (-_v.y * 0.5 + 0.5) * h, ew = l.e.offsetWidth;
    const left = Math.max(6, Math.min(w - ew - 6, l.side === 'left' ? x - ew + 3.5 : x - 3.5));
    l.e.style.transform = `translate(${left}px, ${y - l.e.offsetHeight / 2}px)`;
  });
}

// ---------- product dialog
const dlg = { el: null, gl: null, st: null, controls: null, kind: null, id: null, open: false };
function openProduct(kind, id) {
  dlg.kind = kind; dlg.id = id; const p = product(kind, id);
  if (kind === 'clip' && clipSet[id]) { p.state.set = clipSet[id]; delete clipSet[id]; }
  if (!dlg.gl) {
    dlg.gl = makeGL($('#pd-canvas'));
    dlg.controls = new OrbitControls(new T.PerspectiveCamera(), $('#pd-canvas'));
  }
  const holder = instance(p); const st = makeStage(dlg.gl, [{ obj: holder, y0: 0, float: 0.6 }], { fov: 26, elev: 0.22, pad: 1.0 });
  if (dlg.st) disposeStage(dlg.st);
  dlg.st = st;
  dlg.controls.object = st.cam; dlg.controls.enablePan = false; dlg.controls.enableDamping = true; dlg.controls.dampingFactor = 0.08; dlg.controls.autoRotate = !reduce; dlg.controls.autoRotateSpeed = 0.9;
  renderPanel();
  dlg.el.showModal(); dlg.open = true; document.documentElement.style.overflow = 'hidden';
  requestAnimationFrame(sizeDialog);
}
function disposeStage(st) { const i = allStages.indexOf(st); if (i >= 0) allStages.splice(i, 1); st.bg.geometry.dispose(); st.bg.material.dispose(); st.shadow.geometry.dispose(); st.shadow.material.dispose(); }
function sizeDialog() {
  const c = $('#pd-canvas'), w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
  dlg.gl.r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); dlg.gl.r.setSize(w, h, false);
  dlg.st.aspect = 0; dlg.st.fit(w / h);
  const ctr = dlg.st.center.clone(); ctr.y -= dlg.st.halfH * 0.08; dlg.controls.target.copy(ctr);
  dlg.controls.minDistance = dlg.st.dist * 0.45; dlg.controls.maxDistance = dlg.st.dist * 1.6; dlg.controls.update();
}
function closeProduct() { dlg.el.close(); }
function renderPanel() {
  const p = product(dlg.kind, dlg.id), d = p.def, panel = $('#pd-panel');
  if (dlg.kind === 'clip') {
    const s = clipStates[d.id], set = SETS.find(x => x.id === p.state.set) || SETS[0];
    panel.innerHTML = `
      <p class="eyebrow">${d.type}${d.badge ? ' · ' + d.badge : ''}</p>
      <h2 id="pd-title">${d.name}</h2>
      <p class="lead">${d.blurb}</p>
      <span class="pp">${eur(setPrice(d, set))}</span>
      <div class="opt-group"><span>Colour <b>${colour(s.colour).name}</b></span><div class="swatches" role="radiogroup" aria-label="Colour" id="pd-col"></div></div>
      <div class="opt-group"><span>Felt <b>${felt(s.felt).name}</b></span><div class="swatches" role="radiogroup" aria-label="Felt colour" id="pd-felt"></div></div>
      <div class="opt-group"><span>Set</span><div class="choice" id="pd-set">${SETS.map(x => `<button type="button" data-v="${x.id}" aria-pressed="${x.id === set.id}">${x.name} · ${eur(setPrice(d, x))}<small>${x.clips} clip${x.clips > 1 ? 's' : ''} + ${x.refills === 1 ? 'one' : 'two'} 5 ml blend${x.refills > 1 ? 's' : ''}</small></button>`).join('')}</div></div>
      <div class="opt-group"><span>Blend</span><div class="choice" id="pd-scent">${SCENTS.map(x => `<button type="button" data-v="${x.id}" aria-pressed="${x.id === p.state.scent}">${x.name}</button>`).join('')}</div></div>
      <button class="btn" type="button" id="pd-add">Add to bag · ${eur(setPrice(d, set))}</button>
      <dl class="specs"><dt>Size</dt><dd>${p.model.dims}</dd><dt>Top</dt><dd>Plant-based PLA, hand finished</dd><dt>Felt</dt><dd>100% wool, 3 mm</dd><dt>Base</dt><dd>${p.model.base}</dd><dt>Care</dt><dd>Wipe dry. Keep oil on the felt only.</dd></dl>`;
    const col = $('#pd-col'); d.colours.forEach(cid => { const b = swatchBtn(colour(cid), cid === s.colour, colour(cid).name, true); b.onclick = () => { recolour(d.id, cid, null); renderPanel(); }; col.appendChild(b); });
    const fe = $('#pd-felt'); FELTS.forEach(f => { const b = swatchBtn(f, f.id === s.felt, f.name + ' felt', true); b.onclick = () => { recolour(d.id, null, f.id); renderPanel(); }; fe.appendChild(b); });
    panel.querySelectorAll('#pd-set button').forEach(b => (b.onclick = () => { p.state.set = b.dataset.v; renderPanel(); }));
    panel.querySelectorAll('#pd-scent button').forEach(b => (b.onclick = () => { p.state.scent = b.dataset.v; renderPanel(); }));
    $('#pd-add').onclick = () => { addClip(d.id, p.state.set, p.state.scent); closeProduct(); };
  } else {
    const z = SIZES.find(z => z.id === scentStates[d.id].size);
    panel.innerHTML = `
      <p class="eyebrow">Botanical blend${d.limited ? ' · Limited, winter' : ''}</p>
      <h2 id="pd-title">${d.name}</h2>
      <p class="lead">${d.notes}. For the wool felt in your Cliptique clip.</p>
      <span class="pp">${eur(z.price)}</span>
      <div class="opt-group"><span>The recipe</span><ul class="blend" style="display:flex">${d.blend.map(([n, v]) => `<li><span>${n}</span><span class="pct">${v}%</span><span class="bar" style="--w:${v}%"></span></li>`).join('')}</ul></div>
      <div class="opt-group"><span>Size</span><div class="choice" id="pd-size">${SIZES.map(x => `<button type="button" data-v="${x.id}" aria-pressed="${x.id === z.id}">${x.name} · ${eur(x.price)}<small>${x.note}, about ${x.id === '5' ? '3–4' : '7–8'} weeks</small></button>`).join('')}</div></div>
      <button class="btn" type="button" id="pd-add">Add to bag · ${eur(z.price)}</button>
      <dl class="specs"><dt>Bottle</dt><dd>${d.bottle}, ${p.model.dims}</dd><dt>Use</dt><dd>3–5 drops on the felt. Not for skin.</dd><dt>Batch</dt><dd>Mixed by hand in Cyprus, batch 001</dd></dl>`;
    panel.querySelectorAll('#pd-size button').forEach(b => (b.onclick = () => setSize(d.id, b.dataset.v)));
    $('#pd-add').onclick = () => { addScent(d.id); closeProduct(); };
  }
}

// ---------- bag
const BAG_KEY = 'cliptique-bag-v1';
let bag = [];
try { bag = JSON.parse(localStorage.getItem(BAG_KEY) || '[]'); if (!Array.isArray(bag)) bag = []; } catch (e) { bag = []; }
const saveBag = () => { try { localStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch (e) { /* storage unavailable: the bag lasts for this visit */ } };
function addLine(line) {
  const same = bag.find(l => l.key === line.key); if (same) same.qty++; else bag.push({ ...line, qty: 1 });
  saveBag(); renderBag(); toast(`${line.name} added to your bag`);
  const b = $('#bag-open'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
}
// A small picture of the product as it looks right now, taken from its 3D card.
function snapshot(grid, id) {
  const src = document.querySelector(`${grid} [data-id="${id}"] canvas`), card = cards.find(c => c.canvas === src);
  if (!src || !src.width) return null;
  if (card && card.st && card.w && card.h) { // redraw first: cards pause while the dialog is open
    const gl = card.st.gl.r; if (gl.domElement.width !== card.w || gl.domElement.height !== card.h) gl.setSize(card.w, card.h, false);
    card.st.fit(card.w / card.h); gl.render(card.st.scene, card.st.cam); card.ctx.drawImage(gl.domElement, 0, 0);
  }
  try { const c = document.createElement('canvas'); c.width = 112; c.height = 140; c.getContext('2d').drawImage(src, 0, 0, 112, 140); return c.toDataURL('image/jpeg', 0.82); } catch (e) { return null; }
}
function addClip(id, setId, scentId) {
  const d = CLIPS.find(c => c.id === id), s = clipStates[id], set = SETS.find(x => x.id === setId) || SETS[0], sc = SCENTS.find(x => x.id === scentId) || SCENTS[0];
  addLine({ key: ['clip', id, s.colour, s.felt, set.id, sc.id].join('|'), kind: 'clip', id, img: snapshot('#clip-grid', id),
    name: `${d.name} · ${set.name}`, opts: `${colour(s.colour).name}, ${felt(s.felt).name.toLowerCase()} felt · ${sc.name}`, price: setPrice(d, set) });
}
function addScent(id) {
  const d = SCENTS.find(x => x.id === id), z = SIZES.find(z => z.id === scentStates[id].size);
  addLine({ key: ['scent', id, z.id].join('|'), kind: 'scent', id, img: snapshot('#scent-grid', id), name: d.name, opts: `${z.name} · ${d.bottle}`, price: z.price });
}
function renderBag() {
  const count = bag.reduce((n, l) => n + l.qty, 0), sub = bag.reduce((n, l) => n + l.qty * l.price, 0);
  $('#bag-count').textContent = count; $('#bag-open').setAttribute('aria-label', `Bag, ${count} item${count === 1 ? '' : 's'}`);
  const body = $('#bag-body');
  if (!bag.length) { body.innerHTML = `<div class="empty"><p>Your bag is empty.</p><a class="link" href="#clips" id="bag-shop">Shop the clips</a></div>`; $('#bag-shop').onclick = closeBag; return; }
  const free = 35, left = Math.max(0, free - sub), ship = sub >= free ? 0 : 3.5;
  body.innerHTML = `
    <ul class="lines">${bag.map((l, i) => `
      <li>${l.img ? `<img class="thumb" src="${l.img}" alt="">` : '<span class="thumb"></span>'}
        <span class="name">${l.name}</span><span class="lp">${eur(l.price * l.qty)}</span>
        <span class="opts">${l.opts}</span>
        <span class="qty"><button type="button" data-i="${i}" data-d="-1" aria-label="One fewer">−</button><span>${l.qty}</span><button type="button" data-i="${i}" data-d="1" aria-label="One more">+</button></span>
        <button class="rm" type="button" data-rm="${i}">Remove</button></li>`).join('')}</ul>
    <div class="totals">
      <div class="progress" aria-hidden="true"><i style="width:${Math.min(100, sub / free * 100)}%"></i></div>
      <p class="note">${left > 0 ? `Add ${eur(left)} more for free delivery in Cyprus.` : 'Your delivery in Cyprus is free.'}</p>
      <div class="r"><span>Subtotal</span><span>${eur(sub)}</span></div>
      <div class="r"><span>Delivery in Cyprus</span><span>${ship ? eur(ship) : 'Free'}</span></div>
      <div class="r big"><span>Total</span><span>${eur(sub + ship)}</span></div>
      <button class="btn" type="button" id="checkout">Pre-order</button>
      <p class="checkout-msg" id="checkout-msg" hidden>Pre-orders open with our first batch in March 2027. Your bag is saved on this device, and if you sign up below we'll email you the day it opens.</p>
    </div>`;
  body.querySelectorAll('.qty button').forEach(b => (b.onclick = () => { const l = bag[+b.dataset.i]; l.qty += +b.dataset.d; if (l.qty < 1) bag.splice(+b.dataset.i, 1); saveBag(); renderBag(); }));
  body.querySelectorAll('[data-rm]').forEach(b => (b.onclick = () => { bag.splice(+b.dataset.rm, 1); saveBag(); renderBag(); }));
  $('#checkout').onclick = () => { $('#checkout-msg').hidden = false; };
}
let lastFocus = null;
function openBag() { lastFocus = document.activeElement; $('#bag').classList.add('on'); $('#bag').setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('on'); $('#bag-close').focus(); }
function closeBag() { $('#bag').classList.remove('on'); $('#bag').setAttribute('aria-hidden', 'true'); $('#scrim').classList.remove('on'); lastFocus && lastFocus.focus && lastFocus.focus(); }
let toastTimer = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2600); }

// ---------- logo mark
function markSvg(svg) {
  const all = SHAPES.plum.concat(SHAPES.pear); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  all.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
  const s = 40 / (y1 - y0), w = (x1 - x0) * s, d = k => 'M' + SHAPES[k].map(p => ((p[0] - x0) * s).toFixed(1) + ' ' + ((p[1] - y0) * s).toFixed(1)).join('L') + 'Z';
  svg.setAttribute('viewBox', `0 0 ${w.toFixed(1)} 40`);
  svg.innerHTML = `<path d="${d('plum')}" style="fill:var(--ink)"/><path d="${d('pear')}" style="fill:var(--citron)"/>`;
}

// ---------- main loop
let frameNo = 0;
function loop(now) {
  requestAnimationFrame(loop); frameNo++;
  const t = now / 1000;
  // build one product per frame as cards come near the viewport
  const pending = !dlg.open && cards.find(c => c.near && !c.st && c.build);
  if (pending) { const p = pending.build(); pending.st = makeStage(cardRenderer(), [{ obj: instance(p), y0: 0 }], { fov: 22, elev: 0.2, pad: 1.06 }); bindHover(pending.el, pending.st); pending.el.classList.add('ready'); }
  // while the dialog is open, it is the only thing drawn
  if (dlg.open && dlg.st) { dlg.controls.update(); animateStage(dlg.st, t); dlg.st.world.rotation.y = 0; dlg.gl.r.render(dlg.st.scene, dlg.st.cam); return; }
  for (const c of cards) {
    if (!c.st || !c.visible || !c.w || !c.h) continue;
    const st = c.st, active = st.hover.on || Math.abs(st.hover.x) > 0.01;
    if (reduce ? !st.dirty : !(active || st.dirty || (frameNo + cards.indexOf(c)) % 2 === 0)) continue;
    const gl = c.st.gl.r; if (gl.domElement.width !== c.w || gl.domElement.height !== c.h) gl.setSize(c.w, c.h, false);
    st.fit(c.w / c.h); animateStage(st, t); if (c.custom) placeCallouts();
    gl.render(st.scene, st.cam); c.ctx.drawImage(gl.domElement, 0, 0); st.dirty = false;
  }
  if (hero && hero.visible && (!reduce || hero.dirty)) { animateStage(hero, t); heroGL.r.render(hero.scene, hero.cam); hero.dirty = false; }
}

// ---------- boot
function boot() {
  [$('#mark'), $('.mark2')].forEach(markSvg);
  backdrop.tex = backdropTexture();
  buildGrids(); buildHero(); buildExplode(); renderBag();
  dlg.el = $('#product');
  $('#pd-close').onclick = closeProduct;
  dlg.el.addEventListener('close', () => { dlg.open = false; document.documentElement.style.overflow = ''; });
  dlg.el.addEventListener('click', e => { if (e.target === dlg.el) closeProduct(); });
  new ResizeObserver(() => dlg.open && sizeDialog()).observe($('#pd-canvas'));
  $('#bag-open').onclick = openBag; $('#bag-close').onclick = closeBag; $('#scrim').onclick = closeBag;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#bag').classList.contains('on')) closeBag(); });
  $('#letter-form').addEventListener('submit', e => {
    e.preventDefault(); const v = $('#letter-email').value.trim();
    $('#letter-ok').textContent = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? `Thank you. We'll write to ${v} when the first batch ships.` : 'Please enter an email address like name@example.com.';
  });
  // reveal on scroll (content stays visible if the observer never fires)
  const rev = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pending'); rev.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal.pending').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.remove('pending'); else rev.observe(el); });
  setTimeout(() => document.querySelectorAll('.reveal.pending').forEach(el => el.classList.remove('pending')), 4000);
  // theme changes repaint the plinths
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refreshBackdrop);
  new MutationObserver(refreshBackdrop).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  // labels use the web fonts: repaint once they arrive
  const fontsIn = Promise.all(['400 40px Marcellus', '400 20px Jost'].map(f => document.fonts.load(f))).catch(() => {});
  Promise.race([fontsIn, new Promise(r => setTimeout(r, 3000))]).then(() => { products.forEach(p => p.kind === 'bottle' && paintLabel(p)); markDirty(); });
  requestAnimationFrame(loop);
}
boot();
