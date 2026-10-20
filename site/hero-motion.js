/* A small 2D character rig. Canvas drawImage works with local file previews;
   no pixel reads, texture uploads, external assets, or whole-scene bobbing. */
function idlePose(x, y, seconds) {
  const weight = (cx, cy, rx, ry, core = 0.5) => {
    const radius = Math.hypot((x - cx) / rx, (y - cy) / ry);
    const u = Math.max(0, Math.min(1, (1 - radius) / (1 - core)));
    return u * u * (3 - 2 * u);
  };
  const pulse = (phase, center, width) => {
    const d = Math.abs(phase - center);
    return d < width ? (1 + Math.cos(Math.PI * d / width)) / 2 : 0;
  };
  const phase = seconds % 10;
  const breathe = Math.sin(seconds * Math.PI * 2 / 4.8);
  const humanNod = pulse(phase, 6.3, 0.65) + 0.6 * pulse(phase, 7.45, 0.5);
  const robotNod = pulse(phase, 2.6, 0.7);
  let dx = 0, dy = 0;
  const turn = (cx, cy, angle, amount) => {
    dx += ((x - cx) * (Math.cos(angle) - 1) - (y - cy) * Math.sin(angle)) * amount;
    dy += ((x - cx) * Math.sin(angle) + (y - cy) * (Math.cos(angle) - 1)) * amount;
  };
  // The seated pelvis remains anchored. Shoulders rise gently with each breath.
  const humanBody = weight(675, 445, 265, 245, 0.35);
  dx += 2.5 * breathe * humanBody;
  dy -= 7 * breathe * humanBody;
  const humanHead = weight(760, 300, 170, 155, 0.7);
  turn(758, 410, 0.025 * Math.sin(seconds * 0.86) + 0.052 * humanNod, humanHead);
  dy += 5 * humanNod * humanHead;
  // Robot: an attentive head tilt, a short answering nod, and a palm gesture.
  const robotBreath = Math.sin(seconds * Math.PI * 2 / 3.8 + 0.8);
  const robotBody = weight(1140, 624, 160, 215, 0.4);
  dy -= 4 * robotBreath * robotBody;
  const robotHead = weight(1139, 490, 155, 102, 0.75);
  turn(1130, 568, 0.065 * Math.sin(seconds * 0.71 + 0.4) - 0.07 * robotNod, robotHead);
  dy += 5 * robotNod * robotHead;
  const hand = weight(997, 578, 78, 86, 0.6);
  turn(1050, 640, 0.09 * Math.sin(seconds * 1.1) + 0.055 * pulse(phase, 4.5, 1.2), hand);
  return [x + dx, y + dy];
}

(() => {
  const scene = document.querySelector('.living-illustration');
  if (!scene) return;
  const source = scene.querySelector('.idle-source');
  const canvas = scene.querySelector('.idle-canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scale = canvas.width / 1536;
  // Outside this fixed rectangle all pixels are untouched (bench, feet, bubbles).
  const left = 384, top = 144, right = 1296, bottom = 864, step = 48;
  const vertices = [], triangles = [];
  const columns = (right - left) / step + 1;
  const rows = (bottom - top) / step + 1;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) vertices.push([left + i * step, top + j * step]);
  }
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < columns - 1; i++) {
      const a = j * columns + i, b = a + 1, c = a + columns, d = c + 1;
      triangles.push([a, b, c], [b, d, c]);
    }
  }
  function paintTriangle(indices, pose) {
    const [a, b, c] = indices.map(i => vertices[i]);
    const [p, q, r] = indices.map(i => pose[i]);
    const sx = b[0] - a[0], sy = b[1] - a[1];
    const tx = c[0] - a[0], ty = c[1] - a[1];
    const determinant = sx * ty - sy * tx;
    const m11 = ((q[0] - p[0]) * ty - (r[0] - p[0]) * sy) / determinant;
    const m12 = ((q[1] - p[1]) * ty - (r[1] - p[1]) * sy) / determinant;
    const m21 = ((r[0] - p[0]) * sx - (q[0] - p[0]) * tx) / determinant;
    const m22 = ((r[1] - p[1]) * sx - (q[1] - p[1]) * tx) / determinant;
    ctx.save();
    ctx.beginPath();
    // Subpixel overlap prevents hairline gaps between mesh triangles.
    const cx = (p[0] + q[0] + r[0]) / 3, cy = (p[1] + q[1] + r[1]) / 3;
    [p, q, r].forEach((v, i) => {
      const length = Math.hypot(v[0] - cx, v[1] - cy);
      const px = v[0] + (v[0] - cx) / length * 0.4;
      const py = v[1] + (v[1] - cy) / length * 0.4;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.closePath(); ctx.clip();
    ctx.transform(m11, m12, m21, m22, p[0] - m11 * a[0] - m21 * a[1], p[1] - m12 * a[0] - m22 * a[1]);
    ctx.drawImage(source, 0, 0, 1536, 1024);
    ctx.restore();
  }
  let frame = 0, elapsed = 0, previous = 0, lastPaint = 0, visible = true;
  function render(seconds) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, 1536, 1024);
    ctx.drawImage(source, 0, 0, 1536, 1024);
    ctx.clearRect(left, top, right - left, bottom - top);
    const pose = vertices.map(([x, y]) => idlePose(x, y, seconds));
    for (const triangle of triangles) paintTriangle(triangle, pose);
  }
  function tick(now) {
    frame = requestAnimationFrame(tick);
    if (previous) elapsed += Math.min(now - previous, 80) / 1000;
    previous = now;
    if (now - lastPaint < 1000 / 30) return;
    lastPaint = now;
    render(elapsed);
    scene.classList.add('is-animated');
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; previous = 0;
    if (motion.matches) {
      scene.classList.remove('is-animated');
      return;
    }
    if (!document.hidden && visible && source.complete && source.naturalWidth) frame = requestAnimationFrame(tick);
  }
  source.addEventListener('load', sync);
  motion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(scene);
  }
  sync();
})();
