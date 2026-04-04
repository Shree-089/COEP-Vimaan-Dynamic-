/* ─────────────────────────────────────────────
   hud.js  –  four 2-D canvas HUD renderers
   ───────────────────────────────────────────── */

function initHUD(id, fn) {
  const c = document.getElementById(id);
  if (!c) return;
  const ctx = c.getContext('2d');
  let t = 0;

  function resize() {
    c.width  = c.offsetWidth;
    c.height = c.offsetHeight;
  }
  resize();
  new ResizeObserver(resize).observe(c);

  (function loop() {
    requestAnimationFrame(loop);
    t++;
    fn(ctx, c.width, c.height, t);
  })();
}

// ── Mission: radar scan ────────────────────────
initHUD('canvas-mission', (ctx, W, H, t) => {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(3,4,14,.95)';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(0,245,255,.04)';
  ctx.lineWidth = .5;
  for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  const cx  = W / 2, cy = H / 2;
  const rad = Math.min(W, H) * .42;

  // Radar rings
  [1, .6, .3].forEach(r => {
    ctx.beginPath();
    ctx.arc(cx, cy, rad * r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,245,255,.07)';
    ctx.lineWidth = .5;
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,245,255,.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Sweep
  const sw = (t * .02) % (Math.PI * 2);
  for (let i = 0; i < 45; i++) {
    const a = sw - i / 45 * (Math.PI * .75);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    ctx.strokeStyle = `rgba(0,245,255,${(1 - i / 45) * .1})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Crosshair
  ctx.strokeStyle = 'rgba(0,245,255,.12)';
  ctx.lineWidth = .5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(cx - rad, cy); ctx.lineTo(cx + rad, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - rad); ctx.lineTo(cx, cy + rad); ctx.stroke();
  ctx.setLineDash([]);

  // Pings
  ctx._pings = ctx._pings || [];
  if (t % 65 === 0) {
    ctx._pings.push({
      x: cx + (Math.random() - .5) * rad * 1.4,
      y: cy + (Math.random() - .5) * rad * 1.4,
      a: 0,
    });
  }
  ctx._pings = ctx._pings.filter(p => {
    p.a++;
    const al = Math.max(0, 1 - p.a / 75);
    const rr = Math.min(13, p.a * .35);
    ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,255,136,${al})`; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,255,136,${al})`; ctx.fill();
    return p.a < 75;
  });

  // Centre dot
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,245,255,.9)'; ctx.fill();

  ctx.fillStyle = 'rgba(0,245,255,.35)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
  ctx.fillText('SCAN ACTIVE', 8, H - 10);
});

// ── Platform: fleet network ────────────────────
initHUD('canvas-platform', (ctx, W, H, t) => {
  ctx._n = ctx._n || Array.from({ length: 7 }, () => ({
    x: .1 + Math.random() * .8,
    y: .1 + Math.random() * .8,
    vx: (Math.random() - .5) * .0014,
    vy: (Math.random() - .5) * .0014,
  }));

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(3,4,14,.95)'; ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(0,245,255,.04)'; ctx.lineWidth = .5;
  for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  ctx._n.forEach(n => {
    n.x += n.vx; n.y += n.vy;
    if (n.x < .08 || n.x > .92) n.vx *= -1;
    if (n.y < .08 || n.y > .92) n.vy *= -1;
  });

  // Edges + travelling dots
  ctx._n.forEach((a, i) => {
    ctx._n.slice(i + 1).forEach((b, j) => {
      const dx = (a.x - b.x) * W, dy = (a.y - b.y) * H;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < W * .38) {
        ctx.beginPath(); ctx.moveTo(a.x * W, a.y * H); ctx.lineTo(b.x * W, b.y * H);
        ctx.strokeStyle = `rgba(0,245,255,${(1 - d / (W * .38)) * .16})`; ctx.lineWidth = .8; ctx.stroke();
        const pr = (t * .005 + i * .35) % 1;
        ctx.beginPath();
        ctx.arc(a.x * W + (b.x * W - a.x * W) * pr, a.y * H + (b.y * H - a.y * H) * pr, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,245,255,.5)'; ctx.fill();
      }
    });
  });

  // Nodes
  ctx._n.forEach((n, i) => {
    const nx = n.x * W, ny = n.y * H;
    const g  = ctx.createRadialGradient(nx, ny, 0, nx, ny, 14);
    g.addColorStop(0, 'rgba(0,245,255,.22)'); g.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(nx, ny, 14, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(nx, ny, 4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,245,255,.9)'; ctx.fill();
    ctx.fillStyle = 'rgba(0,245,255,.4)'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText('D-' + (i + 1), nx, ny - 12);
  });

  ctx.fillStyle = 'rgba(0,245,255,.35)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
  ctx.fillText('FLEET ONLINE · 7 ACTIVE', 8, H - 10);
});

// ── Tech: thermal vision ───────────────────────
initHUD('canvas-tech', (ctx, W, H, t) => {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(3,4,14,.95)'; ctx.fillRect(0, 0, W, H);

  for (let x = 0; x < W; x += 8) {
    for (let y = 0; y < H; y += 8) {
      const v = Math.sin(x * .02 + t * .022) * Math.cos(y * .024 - t * .016) * Math.sin(t * .01 + x * .008);
      const n = (v + 1) / 2;
      let r, g, b;
      if (n < .33)       { r = 0;          g = n * 3 * 70;             b = n * 3 * 180; }
      else if (n < .66)  { r = (n - .33) * 3 * 255; g = 70 + (n - .33) * 3 * 140; b = 180 - (n - .33) * 3 * 180; }
      else               { r = 255;        g = Math.max(0, 255 - (n - .66) * 3 * 210); b = 0; }
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},.28)`;
      ctx.fillRect(x, y, 8, 8);
    }
  }

  // Scanlines
  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = 'rgba(0,0,8,.26)'; ctx.fillRect(0, y, W, 2);
  }

  // Detection boxes
  [
    { x: .18, y: .15, w: .3, h: .42, lbl: 'HUMAN',   c: 97 },
    { x: .57, y: .24, w: .27, h: .38, lbl: 'VEHICLE', c: 89 },
  ].forEach(b => {
    const bx = b.x * W, by = b.y * H, bw = b.w * W, bh = b.h * H;
    const p  = .7 + Math.sin(t * .07) * .3;
    ctx.strokeStyle = `rgba(0,255,136,${p})`; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, bw, bh);
    const cs = 8;
    [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]]
      .forEach(([px, py, sx, sy]) => {
        ctx.beginPath(); ctx.moveTo(px + sx * cs, py); ctx.lineTo(px, py); ctx.lineTo(px, py + sy * cs); ctx.stroke();
      });
    ctx.fillStyle = `rgba(0,255,136,${p})`; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`${b.lbl} ${b.c}%`, bx + 2, by - 4);
  });

  // Centre crosshair
  const cx = W / 2, cy = H / 2;
  ctx.strokeStyle = 'rgba(0,245,255,.35)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(cx - 16, cy); ctx.lineTo(cx + 16, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 16); ctx.lineTo(cx, cy + 16); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(0,245,255,.35)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
  ctx.fillText(`THERMAL · ${(60 + Math.sin(t * .07) * 5) | 0}ms`, 8, H - 10);
});

// ── Impact: dispatch map ───────────────────────
initHUD('canvas-impact', (ctx, W, H, t) => {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(3,4,14,.95)'; ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(0,245,255,.04)'; ctx.lineWidth = .5;
  for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Bar chart (city coverage)
  for (let i = 0; i < 7; i++) {
    ctx.strokeStyle = 'rgba(0,245,255,.07)'; ctx.lineWidth = .7;
    ctx.strokeRect(i / 7 * W + 2, H - (22 + Math.sin(i * 1.4) * 10 + 6), W / 7 - 4, 22 + Math.sin(i * 1.4) * 10 + 6);
  }

  // Incident zones
  [
    { x: .22, y: .45, c: '40,140,255',  type: 'FLOOD' },
    { x: .7,  y: .32, c: '255,80,40',   type: 'FIRE'  },
    { x: .5,  y: .68, c: '0,255,136',   type: 'MED'   },
  ].forEach((z, i) => {
    const zx = z.x * W, zy = z.y * H, zr = .1 * Math.min(W, H);
    const p  = .75 + Math.sin(t * .07 + i) * .25;
    for (let r = 3; r > 0; r--) {
      const gr = ctx.createRadialGradient(zx, zy, 0, zx, zy, zr * r * .4);
      gr.addColorStop(0, `rgba(${z.c},${.14 * p / r})`); gr.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(zx, zy, zr * r * .4, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(zx, zy, zr, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${z.c},${.38 * p})`; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = `rgba(${z.c},.85)`; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText(z.type, zx, zy - zr - 5);

    // Drone en route
    const bx = W / 2, by = .08 * H;
    const pr = (t * .005 + i * .33) % 1;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(zx, zy);
    ctx.strokeStyle = `rgba(${z.c},.07)`; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(bx + (zx - bx) * pr, by + (zy - by) * pr, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${z.c},.8)`; ctx.fill();
  });

  // Base marker
  ctx.beginPath(); ctx.arc(W / 2, .08 * H, 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,245,255,.9)'; ctx.fill();
  ctx.fillStyle = 'rgba(0,245,255,.4)'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
  ctx.fillText('BASE', W / 2, .08 * H - 11);

  ctx.fillStyle = 'rgba(0,245,255,.35)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
  ctx.fillText('DISPATCH: AUTO · 3 ACTIVE', 8, H - 10);
});
