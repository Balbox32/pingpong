// Cliptique 3D product models: seven scented hair clips and four scent bottles.
// Everything is built procedurally in millimetres. Clips are modelled lying flat
// (top face +Z), bottles standing upright (+Y).
import * as THREE from 'three';
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { SHAPES } from './brand-shapes.js';

const T = THREE;
const { PI, sin, cos, sqrt, hypot, atan2, min, max } = Math;
const V2 = (x, y) => new T.Vector2(x, y);
const V3 = (x, y, z) => new T.Vector3(x, y, z);
const smooth = (a, b, x) => { const t = min(1, max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- 2D outlines as [x, y] point lists, counter-clockwise
function area(pts) { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] - pts[i][0]) * (pts[j][1] + pts[i][1]); return a / 2; }
const ccw = pts => (area(pts) < 0 ? pts.slice().reverse() : pts);

function ptsStadium(w, h, n = 36) {
  const r = h / 2, a = w / 2 - r, out = [];
  for (let i = 0; i <= n; i++) { const t = -PI / 2 + PI * i / n; out.push([a + r * cos(t), r * sin(t)]); }
  for (let i = 0; i <= n; i++) { const t = PI / 2 + PI * i / n; out.push([-a + r * cos(t), r * sin(t)]); }
  return ccw(out);
}
function ptsCircle(r, cx = 0, cy = 0, n = 72) {
  const out = []; for (let i = 0; i < n; i++) { const t = 2 * PI * i / n; out.push([cx + r * cos(t), cy + r * sin(t)]); } return out;
}
function ptsLeaf(len, wid, n = 60) {
  const L = len / 2, top = new T.CubicBezierCurve(V2(-L, 0), V2(-L * 0.42, wid * 0.74), V2(L * 0.42, wid * 0.74), V2(L, 0));
  const bot = new T.CubicBezierCurve(V2(L, 0), V2(L * 0.42, -wid * 0.74), V2(-L * 0.42, -wid * 0.74), V2(-L, 0));
  const a = top.getPoints(n), b = bot.getPoints(n); a.pop(); b.pop();
  return ccw(a.concat(b).map(p => [p.x, p.y]));
}
function ptsSuper(len, wid, p, n = 160) {
  const out = [], a = len / 2, b = wid / 2, e = 2 / p, sg = x => (x < 0 ? -1 : 1);
  for (let i = 0; i < n; i++) { const t = 2 * PI * i / n, c = cos(t), s = sin(t); out.push([a * sg(c) * Math.abs(c) ** e, b * sg(s) * Math.abs(s) ** e]); }
  return out;
}
function ptsLogo(key, height) {
  const all = SHAPES.plum.concat(SHAPES.pear); let y0 = 1e9, y1 = -1e9;
  all.forEach(p => { y0 = min(y0, p[1]); y1 = max(y1, p[1]); });
  const s = height / (y1 - y0), pts = SHAPES[key]; let mx = 0, my = 0;
  pts.forEach(p => { mx += p[0]; my += p[1]; }); mx /= pts.length; my /= pts.length;
  return ccw(pts.map(p => [(p[0] - mx) * s, -(p[1] - my) * s]));
}
// Inward offset of a smooth CCW outline, relaxed so the inset stays even.
function inset(pts, d, relax = 3) {
  const n = pts.length; let out = pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = hypot(tx, ty) || 1;
    return [p[0] - (ty / l) * d, p[1] + (tx / l) * d];
  });
  for (let k = 0; k < relax; k++) out = out.map((p, i) => { const a = out[(i - 1 + n) % n], b = out[(i + 1) % n]; return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4]; });
  return out;
}
function shapeOf(pts, holes = []) {
  const s = new T.Shape(pts.map(p => V2(p[0], p[1])));
  s.holes = holes.map(h => new T.Path(h.map(p => V2(p[0], p[1])))); return s;
}

// ---------- geometry finishing: subdivide, weld, deform, smooth normals, planar UVs
function finish(geo, maxEdge, deform, uvScale = 1 / 16) {
  geo = new TessellateModifier(maxEdge, 20).modify(geo);
  geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
  geo = mergeVertices(geo, 1e-3);
  const p = geo.attributes.position, v = V3(0, 0, 0), uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); uv[2 * i] = v.x * uvScale; uv[2 * i + 1] = v.y * uvScale;
    if (deform) deform(v); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
  geo.computeVertexNormals(); return geo;
}
// Bend a flat part around a cylinder below it, so the clip follows the curve of the head.
const bendX = R => v => { const a = v.x / R, r = R + v.z; v.x = r * sin(a); v.z = r * cos(a) - R; };
const bendY = R => v => { const a = v.y / R, r = R + v.z; v.y = r * sin(a); v.z = r * cos(a) - R; };

const extrude = (shape, depth, bevel, seg = 5) => new T.ExtrudeGeometry(shape, bevel
  ? { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, curveSegments: 12 }
  : { depth, bevelEnabled: false, curveSegments: 12 });

// A clip top: acetate body with a pocket, a hidden floor, and the wool felt pad set into the pocket.
function scentTop(outer, pocket, o = {}) {
  const H = o.H ?? 3.4, b = o.bevel ?? 0.6, fb = 0.45, ft = 0.7, maxEdge = o.maxEdge ?? 3.2, deform = o.deform;
  const body = extrude(shapeOf(outer, [pocket]), H, b); body.translate(0, 0, b);
  const floor = extrude(shapeOf(pocket), 1.2, 0); floor.translate(0, 0, 0.4);
  const feltDepth = H + 2 * b - 0.55 - 1.6 - 2 * ft;
  const felt = new T.ExtrudeGeometry(shapeOf(inset(pocket, b + fb + 0.15)), { depth: feltDepth, bevelEnabled: true, bevelThickness: ft, bevelSize: fb, bevelSegments: 5, curveSegments: 12 });
  felt.translate(0, 0, 1.6 + ft);
  return [
    { geo: finish(body, maxEdge, o.bodyDeform || deform), mat: 'body' },
    { geo: finish(floor, maxEdge * 1.5, deform), mat: 'body' },
    { geo: finish(felt, maxEdge, deform, 1 / 14), mat: 'felt' },
  ];
}
// Spring-steel snap clip blank glued under a top.
function snapBlank(len, wid, deform, alongY, shift = [0, 0]) {
  const turn = g => { if (alongY) g.rotateZ(PI / 2); g.translate(shift[0], shift[1], 0); return g; };
  const frame = extrude(shapeOf(ptsStadium(len, wid), [ptsStadium(len - 9, wid - 4.6)]), 0.45, 0.15, 2); frame.translate(0, 0, -1.15);
  const tongue = extrude(shapeOf(ptsStadium(len * 0.62, 2.8)), 0.45, 0.15, 2); tongue.translate(-len * 0.1, 0, -1.25);
  const dip = v => { const k = alongY ? v.y - shift[1] : v.x - shift[0]; if (v.z < -0.9 && Math.abs(k) < len * 0.42) v.z -= 0.9 * (1 - (k / (len * 0.42)) ** 2) * (v.z < -1.2 ? 1 : 0.6); deform && deform(v); };
  return [{ geo: finish(turn(frame), 2.5, deform), mat: 'steel' }, { geo: finish(turn(tongue), 2.5, dip), mat: 'steel' }];
}

// ---------- swept solids (for the claw clip)
function rrect(w, h, r, n = 4) {
  const pts = [], c = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, PI / 2], [-w / 2 + r, -h / 2 + r, PI], [w / 2 - r, -h / 2 + r, 1.5 * PI]];
  for (const [cx, cy, a0] of c) for (let i = 0; i <= n; i++) { const a = a0 + (PI / 2) * i / n; pts.push([cx + r * cos(a), cy + r * sin(a)]); }
  return pts;
}
function sweep(profile, steps, at, scale) {
  const P = profile.length, pos = [], idx = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps, { p, n, b } = at(t), [su, sv] = scale ? scale(t) : [1, 1];
    for (const [u, v] of profile) pos.push(p.x + b.x * u * su + n.x * v * sv, p.y + b.y * u * su + n.y * v * sv, p.z + b.z * u * su + n.z * v * sv);
  }
  for (let s = 0; s < steps; s++) for (let i = 0; i < P; i++) { const a = s * P + i, b = s * P + (i + 1) % P; idx.push(a, b, b + P, a, b + P, a + P); }
  const c0 = pos.length / 3, p0 = at(0).p, p1 = at(1).p; pos.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
  for (let i = 0; i < P; i++) { idx.push(c0, (i + 1) % P, i); idx.push(c0 + 1, steps * P + i, steps * P + (i + 1) % P); }
  // make the winding face outward, whichever way the frame turned
  let vol = 0; const A = V3(0, 0, 0), B = V3(0, 0, 0), C = V3(0, 0, 0);
  for (let i = 0; i < idx.length; i += 3) { A.fromArray(pos, idx[i] * 3); B.fromArray(pos, idx[i + 1] * 3); C.fromArray(pos, idx[i + 2] * 3); vol += A.dot(B.cross(C)); }
  if (vol < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const dome = (k) => sqrt(max(0.004, 1 - k * k));

// ---------- the seven clips
function clipOval() {
  const d = bendX(85);
  return { parts: [...scentTop(ptsStadium(62, 16), ptsStadium(52, 8.6), { deform: d }), ...snapBlank(56, 10, d)], dims: '65 × 17 mm, 5 mm thick', base: '56 mm steel snap clip' };
}
function clipLeaf() {
  const d = bendX(90), outer = ptsLeaf(66, 25), pocket = ptsLeaf(46, 11.5);
  return { parts: [...scentTop(outer, pocket, { deform: d }), ...snapBlank(56, 10, d)], dims: '69 × 29 mm, 5 mm thick', base: '56 mm steel snap clip' };
}
function clipSignature(key) {
  const outer = ptsLogo(key, 52), d = bendY(80);
  let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9; outer.forEach(p => { x0 = min(x0, p[0]); x1 = max(x1, p[0]); y0 = min(y0, p[1]); y1 = max(y1, p[1]); });
  // fit the longest steel blank that stays hidden under the solid part of the shape
  const inside = (x, y) => { let c = false; for (let i = 0, j = outer.length - 1; i < outer.length; j = i++) { const [xi, yi] = outer[i], [xj, yj] = outer[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  let fit = [20, 0, 0];
  search: for (let len = 40; len >= 20; len -= 2) for (let dx = 0; dx <= 12; dx += 0.5) for (const sx of dx ? [dx, -dx] : [0]) for (let dy = -6; dy <= 6; dy += 1) {
    let ok = true; for (let y = -len / 2; y <= len / 2 && ok; y += 1) for (const ox of [-4.4, 0, 4.4]) if (!inside(sx + ox, dy + y)) { ok = false; break; }
    if (ok) { fit = [len, sx, dy]; break search; }
  }
  const parts = [...scentTop(outer, inset(outer, 3.6, 10), { deform: d, H: 3.6, bevel: 0.7 }), ...snapBlank(fit[0], 8.5, d, true, [fit[1], fit[2]])];
  return { parts, dims: `${Math.round(x1 - x0 + 1.4)} × ${Math.round(y1 - y0 + 1.4)} mm, 5 mm thick`, base: `${fit[0]} mm steel snap clip` };
}
function clipBar() {
  const d = bendX(120);
  const parts = scentTop(ptsSuper(74, 12.5, 2.8), ptsStadium(54, 4.8), { deform: d, H: 3.2 });
  // French barrette clasp underneath: a steel spine, a hinge at one end and a catch at the other.
  const spine = extrude(shapeOf(ptsStadium(66, 6)), 0.5, 0.15, 2); spine.translate(0, 0, -1.2);
  parts.push({ geo: finish(spine, 2.5, d), mat: 'steel' });
  const hinge = new T.CylinderGeometry(1.3, 1.3, 6.4, 24); hinge.translate(-31.5, 0, -2.2); parts.push({ geo: finish(hinge.toNonIndexed(), 2.5, d), mat: 'steel' });
  const bow = new T.TorusGeometry(2.4, 0.55, 12, 32, PI); bow.rotateX(PI / 2); bow.rotateY(PI / 2); bow.translate(31.5, 0, -1.6); parts.push({ geo: finish(bow.toNonIndexed(), 2.5, d), mat: 'steel' });
  return { parts, dims: '76 × 14 mm, 5 mm thick', base: '66 mm French barrette clasp' };
}
function clipShell() {
  const ribs = 11, span = 68 * PI / 180, step = (2 * span) / (ribs + 0.5), apex = [0, -7], pc = [0, 1.2], H = 2.6, b = 0.55;
  const arc = [];
  for (let i = 0; i <= 140; i++) { const th = span - (2 * span) * i / 140, r = 29 + 0.85 * cos(2 * PI * th / step); arc.push([apex[0] + r * sin(th), apex[1] + r * cos(th)]); }
  const endL = arc[arc.length - 1], endR = arc[0], f = y => (e => [e[0] * (1 - (e[1] - y) / (e[1] - apex[1])), y]);
  const ears = new T.SplineCurve([f(-2.4)(endL), [-15.6, -3.1], [-15.2, -7.7], [-6, -8.6], [6, -8.6], [15.2, -7.7], [15.6, -3.1], f(-2.4)(endR)].map(p => V2(p[0], p[1]))).getPoints(48).map(p => [p.x, p.y]);
  const outer = ccw(arc.concat(ears.slice(0, -1)));
  const domed = v => { const dd = hypot(v.x, v.y - 6); v.z += 2.6 * max(0, 1 - (dd / 34) ** 2); };
  const ribbed = v => {
    const th = atan2(v.x - apex[0], v.y - apex[1]), r = hypot(v.x - apex[0], v.y - apex[1]);
    const rib = 0.5 + 0.5 * cos(2 * PI * th / step), wz = smooth(H * 0.5, H + 2 * b, v.z);
    const away = smooth(8.4, 12.5, hypot(v.x - pc[0], v.y - pc[1])) * smooth(10, 15, r);
    v.z += 1.05 * rib ** 2.2 * away * wz + 0.05 * sin(r * 2.4) * away * wz; domed(v);
  };
  const parts = scentTop(outer, ptsCircle(5.8, pc[0], pc[1]), { deform: domed, bodyDeform: ribbed, H, bevel: b, maxEdge: 0.8 });
  const clip = extrude(shapeOf(ptsStadium(34, 7), [ptsStadium(26, 3)]), 0.45, 0.15, 2); clip.rotateZ(PI / 2); clip.translate(0, 9, -1.15);
  parts.push({ geo: finish(clip, 2.5, domed), mat: 'steel' });
  return { parts, dims: '55 × 33 mm, 5 mm thick', base: '34 mm steel snap clip' };
}
function clipClaw() {
  // Side profile: two C-shaped jaws on an ellipse, hinged at the top, with wide teeth that interlock at the bottom.
  const Ry = 19, Rz = 12.5, th = 2.8, W = 76, parts = [];
  const along = (x, sg, off, a0, a1) => t => {
    const phi = a0 + (a1 - a0) * t, n = V3(0, cos(phi) / Ry, sg * sin(phi) / Rz).normalize();
    return { p: V3(x, Ry * cos(phi), sg * Rz * sin(phi)).addScaledVector(n, off), n, b: V3(1, 0, 0) };
  };
  const planar = (g, k) => { const a = g.attributes.position, uv = new Float32Array(a.count * 2); for (let i = 0; i < a.count; i++) { uv[2 * i] = a.getX(i) / k; uv[2 * i + 1] = (a.getY(i) + a.getZ(i)) / k; } g.setAttribute('uv', new T.BufferAttribute(uv, 2)); return g; };
  const add = (g, mat) => parts.push({ geo: planar(g, mat === 'felt' ? 14 : 30), mat });
  for (const sg of [1, -1]) {
    add(sweep(rrect(W, th, 1.3), 60, along(0, sg, 0, 0, 1.78), t => [1 - 0.08 * t, t > 0.93 ? dome((t - 0.93) / 0.07) * 0.85 + 0.15 : 1]), 'body');
    const xs = sg > 0 ? [0, 1, 2, 3, 4, 5].map(i => -32.5 + i * 13) : [0, 1, 2, 3, 4].map(i => -26 + i * 13);
    for (const x of xs) {
      const tip = PI * 1.07 - 0.3 * (x / 36) ** 2;
      add(sweep(rrect(5.6, th * 0.94, 1.3), 44, along(x, sg, 0, 1.62, tip), t => { const k = t > 0.86 ? (t - 0.86) / 0.14 : 0, f = dome(k); return [(1 - 0.3 * t) * (0.3 + 0.7 * f), (1 - 0.25 * t) * f]; }), 'body');
    }
  }
  // felt inlay on the front jaw, on a raised plinth
  const ends = (t, e) => { const k = Math.abs(t - 0.5) / 0.5; return k > e ? dome((k - e) / (1 - e)) : 1; };
  add(sweep(rrect(48, 1.1, 0.5), 44, along(0, 1, th / 2 + 0.25, 0.32, 1.42), t => { const f = ends(t, 0.86); return [0.6 + 0.4 * f, f]; }), 'body');
  add(sweep(rrect(44, 1.5, 0.7), 44, along(0, 1, th / 2 + 1.35, 0.37, 1.37), t => { const f = ends(t, 0.84); return [0.55 + 0.45 * f, f]; }), 'felt');
  // hinge barrel with knuckles and a steel pin
  const cyl = (r, len, x, mat) => { const g = new T.CylinderGeometry(r, r, len, 48); g.rotateZ(PI / 2); g.translate(x, Ry + 0.4, 0); parts.push({ geo: mat === 'steel' ? g : planar(g, 30), mat }); };
  cyl(3.3, 52, 0, 'body'); for (const x of [-22, 0, 22]) cyl(3.8, 7.5, x, 'body'); cyl(1.1, 55, 0, 'steel');
  return { parts, dims: '76 mm wide, 43 mm tall, 29 mm deep', base: 'Spring hinge with steel pin', upright: true };
}

export const CLIP_BUILDERS = {
  oval: clipOval, leaf: clipLeaf, sigc: () => clipSignature('plum'), sigq: () => clipSignature('pear'),
  claw: clipClaw, bar: clipBar, shell: clipShell,
};

// ---------- bottles
class Profile {
  constructor(x, y) { this.p = [V2(x, y)]; }
  get last() { return this.p[this.p.length - 1]; }
  line(x, y, n = 1) { const a = this.last.clone(); for (let i = 1; i <= n; i++) this.p.push(V2(a.x + (x - a.x) * i / n, a.y + (y - a.y) * i / n)); return this; }
  arc(cx, cy, r, a0, a1, n = 10) { for (let i = 1; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; this.p.push(V2(cx + r * cos(a), cy + r * sin(a))); } return this; }
  curve(pts, n = 24) { const c = new T.SplineCurve([this.last.clone(), ...pts.map(q => V2(q[0], q[1]))]); this.p.push(...c.getPoints(n).slice(1)); return this; }
  quad(cx, cy, x, y, n = 16) { const c = new T.QuadraticBezierCurve(this.last.clone(), V2(cx, cy), V2(x, y)); this.p.push(...c.getPoints(n).slice(1)); return this; }
}
const lathe = (pts, seg = 96, a0 = 0, len = 2 * PI) => new T.LatheGeometry(pts, seg, a0, len);
// Radius of a lathe profile at height y (profile must rise monotonically on the outside wall).
function radiusAt(pts, y) {
  let best = 0; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) best = max(best, a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y)); } return best;
}
function fillFrom(outer, wall, y0, y1, n = 40) {
  const pts = [V2(0, y0)]; for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n; pts.push(V2(max(0.1, radiusAt(outer, y) - wall), y)); } pts.push(V2(0, y1)); return pts;
}
function bandFrom(outer, off, y0, y1, n = 40) { const pts = []; for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n; pts.push(V2(radiusAt(outer, y) + off, y)); } return pts; }
function ribbedCollar(r, h, ribs = 40) {
  const pts = []; for (let i = 0; i < ribs * 6; i++) { const a = 2 * PI * i / (ribs * 6); pts.push([(r + 0.22 * cos(a * ribs)) * cos(a), (r + 0.22 * cos(a * ribs)) * sin(a)]); }
  const g = extrude(shapeOf(pts), h, 0.35, 3); g.rotateX(-PI / 2); return g;
}

function bottleCitrus() { // 5 ml amber Boston round with a ribbed collar and dropper bulb
  const g = new Profile(0, 0).line(7.8, 0).arc(7.8, 1.7, 1.7, -PI / 2, 0).line(9.5, 23, 8).quad(9.5, 28.8, 5, 29.9).line(5, 31).line(4.6, 33.6).line(0, 34);
  const collar = ribbedCollar(6.15, 8.2); collar.translate(0, 30.9, 0);
  const bulb = new Profile(0, 39.3).line(3.9, 39.3).curve([[4.3, 40.3], [4.4, 43], [4.55, 46.4], [4.2, 49.2], [3.3, 51.3], [1.6, 52.6], [0, 52.9]], 30);
  return { parts: [
    { geo: lathe(g.p), mat: 'glass' }, { geo: lathe(fillFrom(g.p, 1.15, 1.4, 21.5)), mat: 'liquid' }, { geo: collar, mat: 'cap' }, { geo: lathe(bulb.p, 64), mat: 'rubber' },
    { geo: lathe(bandFrom(g.p, 0.08, 5, 20.5), 96, -1.15, 2.3), mat: 'label' },
  ], dims: 'Ø 19 × 53 mm', label: { w: 2.3 * 9.6, h: 15.5 } };
}
function bottleLavender() { // frosted lilac cylinder with a bamboo cap
  const g = new Profile(0, 0).line(8, 0).arc(8, 2, 2, -PI / 2, 0).line(10, 33.5, 10).arc(7.5, 33.5, 2.5, 0, PI / 2).line(5.2, 36).line(5.2, 39.5).line(0, 39.5);
  const cap = new Profile(0, 37).line(7.4, 37).arc(7.4, 37.5, 0.5, -PI / 2, 0, 4).line(7.9, 52.5, 6).arc(7.4, 52.5, 0.5, 0, PI / 2, 4).line(0, 53);
  return { parts: [
    { geo: lathe(g.p), mat: 'glass' }, { geo: lathe(fillFrom(g.p, 1.3, 1.7, 27.5)), mat: 'liquid' }, { geo: lathe(cap.p), mat: 'cap' },
    { geo: lathe(bandFrom(g.p, 0.07, 7, 25), 96, -0.9, 1.8), mat: 'label' },
  ], dims: 'Ø 20 × 53 mm', label: { w: 1.8 * 10, h: 18 } };
}
function bottleRose() { // blush glass pebble flacon with a porcelain stopper
  const g = new Profile(0, 0).line(8.5, 0).curve([[11.2, 0.8], [13.4, 4], [14.2, 9], [13.5, 14.8], [10.8, 19.4], [7.2, 22.2], [5.2, 23.4]], 48).line(5.2, 26.4).line(0, 26.6);
  const cap = new Profile(0, 24.6).line(6.6, 24.6).curve([[7.5, 25.8], [7.9, 28.6], [7.2, 32], [5, 34.4], [2.4, 35.4], [0, 35.6]], 36);
  return { parts: [
    { geo: lathe(g.p), mat: 'glass' }, { geo: lathe(fillFrom(g.p, 1.4, 1.6, 15)), mat: 'liquid' }, { geo: lathe(cap.p), mat: 'cap' },
    { geo: lathe(bandFrom(g.p, 0.1, 4.4, 15.6), 64, -0.62, 1.24), mat: 'label' },
  ], dims: 'Ø 28 × 36 mm', label: { w: 1.24 * 14, h: 11.2 } };
}
function bottleFig() { // smoked square bottle with a carob-wood cap
  const sq = (s, r) => rrect(s, s, r, 8);
  const body = new T.ExtrudeGeometry(shapeOf(sq(20, 4)), { depth: 26, bevelEnabled: true, bevelThickness: 2, bevelSize: 1.5, bevelSegments: 6, curveSegments: 12 });
  body.rotateX(-PI / 2); body.translate(0, 2, 0);
  const neck = lathe(new Profile(0, 28.5).line(5.2, 28.5).line(5.2, 33).line(0, 33).p, 64);
  const liquid = new T.ExtrudeGeometry(shapeOf(sq(17.6, 3)), { depth: 19, bevelEnabled: false, curveSegments: 12 }); liquid.rotateX(-PI / 2); liquid.translate(0, 2, 0);
  const cap = new Profile(0, 31).line(6.5, 31).arc(6.5, 31.6, 0.6, -PI / 2, 0, 4).line(7.1, 47.4, 6).arc(6.5, 47.4, 0.6, 0, PI / 2, 4).line(0, 48);
  const label = new T.PlaneGeometry(14.5, 16, 1, 1); label.translate(0, 13.5, 11.56);
  return { parts: [
    { geo: body, mat: 'glass' }, { geo: neck, mat: 'glass' }, { geo: liquid, mat: 'liquid' }, { geo: lathe(cap.p), mat: 'cap' }, { geo: label, mat: 'label' },
  ], dims: '23 × 23 × 48 mm', label: { w: 14.5, h: 16 } };
}
export const BOTTLE_BUILDERS = { citrus: bottleCitrus, lavender: bottleLavender, geranium: bottleRose, fig: bottleFig };

// ---------- procedural textures
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const texCache = {};
function feltTextures() {
  if (texCache.felt) return texCache.felt;
  const N = 512, c = canvas(N, N), x = c.getContext('2d'), r = rng(7);
  x.fillStyle = '#808080'; x.fillRect(0, 0, N, N);
  for (let i = 0; i < 9000; i++) {
    const px = r() * N, py = r() * N, a = r() * PI * 2, l = 4 + r() * 14, v = r() < 0.5 ? 255 : 0;
    x.strokeStyle = `rgba(${v},${v},${v},${0.05 + r() * 0.1})`; x.lineWidth = 0.6 + r() * 1.2; x.beginPath();
    x.moveTo(px, py); x.quadraticCurveTo(px + cos(a + 0.6) * l * 0.5, py + sin(a + 0.6) * l * 0.5, px + cos(a) * l, py + sin(a) * l); x.stroke();
  }
  // soft mottling (the uneven density of pressed wool), painted small and upscaled
  const mc = canvas(64, 64), mx0 = mc.getContext('2d');
  for (let i = 0; i < 90; i++) { const px = r() * 64, py = r() * 64, rr = 1 + r() * 4, v = r() < 0.5 ? 255 : 0; mx0.fillStyle = `rgba(${v},${v},${v},${0.08 + r() * 0.1})`;
    for (const [dx, dy] of [[0, 0], [64, 0], [-64, 0], [0, 64], [0, -64]]) { mx0.beginPath(); mx0.arc(px + dx, py + dy, rr, 0, 2 * PI); mx0.fill(); } }
  x.imageSmoothingQuality = 'high'; x.drawImage(mc, 0, 0, N, N);
  const bump = new T.CanvasTexture(c); bump.wrapS = bump.wrapT = T.RepeatWrapping; bump.anisotropy = 8;
  const m = canvas(N, N), mx = m.getContext('2d'); mx.fillStyle = '#fff'; mx.fillRect(0, 0, N, N); mx.globalAlpha = 0.22; mx.drawImage(c, 0, 0); mx.globalCompositeOperation = 'multiply'; mx.globalAlpha = 0.35; mx.drawImage(c, 0, 0);
  const map = new T.CanvasTexture(m); map.colorSpace = T.SRGBColorSpace; map.wrapS = map.wrapT = T.RepeatWrapping; map.anisotropy = 8;
  return (texCache.felt = { bump, map });
}
function tortoiseTexture() {
  if (texCache.tortoise) return texCache.tortoise;
  const r = rng(31);
  // paint each layer small and let upscaling soften it: one cheap blur instead of hundreds
  const layer = (res, blobs) => {
    const c = canvas(res, res), x = c.getContext('2d');
    for (const [col, n, r0, r1, alpha] of blobs) for (let i = 0; i < n; i++) {
      const px = r() * res, py = r() * res, rx = (r0 + r() * (r1 - r0)) * res, ry = rx * (0.3 + r() * 0.45), rot = 0.5 + (r() - 0.5) * 0.7;
      x.globalAlpha = alpha * (0.6 + r() * 0.4); x.fillStyle = col;
      for (const [dx, dy] of [[0, 0], [res, 0], [-res, 0], [0, res], [0, -res]]) { x.beginPath(); x.ellipse(px + dx, py + dy, rx, ry, rot, 0, 2 * PI); x.fill(); }
    }
    return c;
  };
  // honey ground, broad soft umber clouds, then smaller streaks pulled in one direction like cut acetate
  const N = 1024, c = canvas(N, N), x = c.getContext('2d');
  x.fillStyle = '#b8762f'; x.fillRect(0, 0, N, N); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  const stretched = (res, blobs) => { const l = layer(res, blobs), s2 = canvas(res, res), y = s2.getContext('2d'); y.imageSmoothingQuality = 'high'; y.drawImage(l, 0, 0, res, res); return s2; };
  x.drawImage(layer(24, [['#e2a75a', 10, 0.12, 0.26, 0.55], ['#5a2a10', 14, 0.1, 0.22, 0.65]]), 0, 0, N, N);
  x.drawImage(stretched(64, [['#3a1a0b', 34, 0.04, 0.11, 0.75], ['#7a3a14', 26, 0.04, 0.09, 0.55]]), 0, 0, N, N);
  x.drawImage(layer(160, [['#2a1208', 40, 0.012, 0.03, 0.6], ['#d39550', 30, 0.01, 0.025, 0.35]]), 0, 0, N, N);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; t.repeat.set(1.6, 1.6);
  return (texCache.tortoise = t);
}
function woodTexture(base, dark, seed) {
  const k = 'wood' + seed; if (texCache[k]) return texCache[k];
  const W = 1024, H = 256, c = canvas(W, H), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = base; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    let px = r() * W; x.strokeStyle = dark; x.globalAlpha = 0.05 + r() * 0.22; x.lineWidth = 0.6 + r() * 2.6; x.beginPath(); x.moveTo(px, 0);
    for (let y = 0; y <= H; y += 16) { px += (r() - 0.5) * 2.2; x.lineTo(px, y); } x.stroke();
  }
  x.globalAlpha = 1; const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return (texCache[k] = t);
}
function gradientTexture(top, bottom) {
  const c = canvas(4, 256), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, top); g.addColorStop(0.55, top); g.addColorStop(1, bottom); x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
export function shadowTexture() {
  if (texCache.shadow) return texCache.shadow;
  const c = canvas(256, 256), x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(30,20,28,0.55)'); g.addColorStop(0.45, 'rgba(30,20,28,0.22)'); g.addColorStop(1, 'rgba(30,20,28,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256); return (texCache.shadow = new T.CanvasTexture(c));
}

// ---------- labels (drawn on canvas; redrawn once web fonts arrive)
export const FONTS = { display: "'Marcellus', 'Trajan Pro', Georgia, serif", body: "'Jost', 'Futura', 'Avenir Next', 'Segoe UI', sans-serif" };
export function logoPath(ctx, x, y, h, plum, lime) {
  const all = SHAPES.plum.concat(SHAPES.pear); let x0 = 1e9, y0 = 1e9, y1 = -1e9;
  all.forEach(p => { x0 = min(x0, p[0]); y0 = min(y0, p[1]); y1 = max(y1, p[1]); }); const s = h / (y1 - y0);
  [['plum', plum], ['pear', lime]].forEach(([k, col]) => { ctx.beginPath(); SHAPES[k].forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](x + (p[0] - x0) * s, y + (p[1] - y0) * s)); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); });
}
export function drawLabel(c, scent, size) {
  const x = c.getContext('2d'), W = c.width, H = c.height, L = scent.label, u = H / 100;
  x.clearRect(0, 0, W, H);
  const decal = L.style === 'print';
  if (!decal) {
    x.fillStyle = L.paper; x.fillRect(0, 0, W, H);
    x.strokeStyle = L.ink; x.globalAlpha = 0.5; x.lineWidth = u * 0.5; x.strokeRect(u * 4, u * 4, W - u * 8, H - u * 8); x.globalAlpha = 1;
  }
  x.textAlign = 'center'; x.fillStyle = L.ink;
  logoPath(x, W / 2 - u * 7.2, u * 11, u * 13, L.ink, L.dot);
  x.fillStyle = L.ink;
  x.font = `400 ${u * 6}px ${FONTS.body}`; if ('letterSpacing' in x) x.letterSpacing = `${u * 1.6}px`;
  x.fillText('CLIPTIQUE', W / 2, u * 34);
  if ('letterSpacing' in x) x.letterSpacing = '0px';
  const words = scent.name.split(' ');
  x.font = `400 ${u * (L.big || 15)}px ${FONTS.display}`;
  if (words.length > 1 && L.stack) { x.fillText(words[0], W / 2, u * 54); x.fillText(words.slice(1).join(' '), W / 2, u * 70); }
  else x.fillText(scent.name, W / 2, u * 60);
  x.font = `400 ${u * 4.6}px ${FONTS.body}`; if ('letterSpacing' in x) x.letterSpacing = `${u * 0.8}px`;
  x.fillText('BOTANICAL BLEND FOR WOOL FELT', W / 2, u * (L.stack ? 81 : 74));
  x.font = `400 ${u * 4.2}px ${FONTS.body}`;
  x.fillText(scent.blend.map(b => `${b[0]} ${b[1]}%`).join(' · ').toUpperCase(), W / 2, u * (L.stack ? 88 : 82), W - u * 12);
  x.fillText(`${size || '5 ML'} · BATCH 001 · MADE IN CYPRUS`, W / 2, u * (L.stack ? 94.5 : 90), W - u * 12);
  if ('letterSpacing' in x) x.letterSpacing = '0px';
}

// ---------- materials
export function makeMaterials(kind, o) {
  const m = {};
  if (kind === 'clip') {
    m.body = new T.MeshPhysicalMaterial({ color: '#fff', roughness: 0.38, clearcoat: 0.55, clearcoatRoughness: 0.24, envMapIntensity: 0.75 });
    const f = feltTextures();
    m.felt = new T.MeshPhysicalMaterial({ color: '#fff', map: f.map, bumpMap: f.bump, bumpScale: 6, roughness: 1, sheen: 1, sheenRoughness: 0.7, sheenColor: new T.Color('#ffffff'), envMapIntensity: 0.5 });
    m.steel = new T.MeshPhysicalMaterial({ color: '#a8a49e', metalness: 1, roughness: 0.34, envMapIntensity: 1 });
  } else {
    const g = o.glass;
    m.glass = new T.MeshPhysicalMaterial({ color: g.color, transmission: 1, thickness: g.thickness || 1.6, ior: 1.5, roughness: g.roughness ?? 0.04, metalness: 0,
      attenuationColor: new T.Color(g.attenuation || '#ffffff'), attenuationDistance: g.distance || 60, specularIntensity: 1, clearcoat: g.roughness > 0.2 ? 0 : 0.4, envMapIntensity: 1.25 });
    m.liquid = new T.MeshPhysicalMaterial({ color: o.liquid, roughness: 0.12, clearcoat: 0.6, envMapIntensity: 0.6 });
    const cap = o.cap;
    m.cap = new T.MeshPhysicalMaterial(cap.wood
      ? { map: woodTexture(cap.wood[0], cap.wood[1], cap.wood[2]), roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.5 }
      : { color: cap.color, roughness: cap.roughness ?? 0.5, clearcoat: cap.clearcoat ?? 0, clearcoatRoughness: 0.3 });
    m.rubber = new T.MeshPhysicalMaterial({ color: '#2a2327', roughness: 0.62, sheen: 0.4, sheenRoughness: 0.8, sheenColor: new T.Color('#6a6066') });
    const lc = canvas(1024, Math.round(1024 * o.labelAspect)); m.labelCanvas = lc;
    const tex = new T.CanvasTexture(lc); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8; m.labelTex = tex;
    m.label = o.labelStyle === 'print'
      ? new T.MeshPhysicalMaterial({ map: tex, transparent: true, roughness: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
      : new T.MeshPhysicalMaterial({ map: tex, roughness: 0.82, sheen: 0.3, sheenRoughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 });
  }
  return m;
}
export function setClipLook(m, bodyHex, feltHex) {
  if (bodyHex === 'tortoise') { m.body.map = tortoiseTexture(); m.body.color.set('#ffffff'); m.body.roughness = 0.22; m.body.clearcoat = 1; }
  else { m.body.map = null; m.body.color.set(bodyHex); m.body.roughness = 0.38; m.body.clearcoat = 0.55; }
  m.body.needsUpdate = true;
  m.felt.color.set(feltHex); m.felt.sheenColor.set(feltHex).lerp(new T.Color('#ffffff'), 0.35);
}
export { gradientTexture };
