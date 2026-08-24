const fs = require('fs');
const path = require('path');
const { createRgbPng } = require('./png_builder.cjs');

// AutoTrack Icon Renderer
// Generates solid, rich dark gradient background with vibrant cyan/blue gauge arc, car silhouette, and glow
function renderAutoTrackIcon(u, v, x, y, width, height) {
  // u in [0, 1] (x normalized), v in [0, 1] (y normalized)
  // Background: Deep slate/navy gradient (#090d16 at top-left to #1e293b at bottom-right)
  const bgGrad = (u + v) / 2;
  let r = Math.round(9 + (30 - 9) * bgGrad);
  let g = Math.round(13 + (41 - 13) * bgGrad);
  let b = Math.round(22 + (59 - 22) * bgGrad);

  // Center coordinate system: cx = 0.5, cy = 0.5
  const dx = u - 0.5;
  const dy = v - 0.5;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // 1. Subtle Radial Ambient Glow around center (cyan glow)
  const glowDist = Math.sqrt(dx * dx + (dy + 0.05) * (dy + 0.05));
  if (glowDist < 0.45) {
    const intensity = Math.pow(1 - glowDist / 0.45, 2) * 0.4;
    r = Math.min(255, Math.round(r + 2 * intensity * 255));
    g = Math.min(255, Math.round(g + 132 * intensity));
    b = Math.min(255, Math.round(b + 199 * intensity));
  }

  // 2. Gauge Track Arc (radius ~ 0.33, center at 0.5, 0.52)
  const arcCx = 0.5;
  const arcCy = 0.52;
  const adx = u - arcCx;
  const ady = v - arcCy;
  const arcDist = Math.sqrt(adx * adx + ady * ady);
  const angle = Math.atan2(ady, adx); // -PI to PI (bottom is PI/2, top is -PI/2)

  // Arc sweeps from ~140 deg to ~40 deg (through top)
  const inArcAngle = (angle < -0.3 || angle > 0.8) || (ady < 0.15);
  if (inArcAngle && Math.abs(arcDist - 0.33) < 0.022) {
    const arcT = (adx + 0.33) / 0.66; // gradient along track
    // Cyan to Indigo gradient
    const arR = Math.round(2 + (99 - 2) * arcT);
    const arG = Math.round(132 + (102 - 132) * arcT);
    const arB = Math.round(199 + (241 - 199) * arcT);
    const edge = 1 - Math.abs(arcDist - 0.33) / 0.022;
    r = Math.round(r * (1 - edge) + arR * edge);
    g = Math.round(g * (1 - edge) + arG * edge);
    b = Math.round(b * (1 - edge) + arB * edge);
  }

  // 3. Car Silhouette:
  // Car roof/windshield: y from 0.38 to 0.58
  // Roof top: y = 0.38, width = 0.22 (x from 0.39 to 0.61)
  // Windshield lines: slope down to x = 0.26 (left) and x = 0.74 (right) at y = 0.58
  const inRoofX = u >= 0.38 && u <= 0.62;
  const inRoofY = Math.abs(v - 0.38) < 0.016 && inRoofX;
  
  // Left pillar
  const leftPillarX = 0.38 - (v - 0.38) * ((0.38 - 0.28) / (0.58 - 0.38));
  const inLeftPillar = v >= 0.38 && v <= 0.58 && Math.abs(u - leftPillarX) < 0.016;

  // Right pillar
  const rightPillarX = 0.62 + (v - 0.38) * ((0.72 - 0.62) / (0.58 - 0.38));
  const inRightPillar = v >= 0.38 && v <= 0.58 && Math.abs(u - rightPillarX) < 0.016;

  if (inRoofY || inLeftPillar || inRightPillar) {
    // Cyan highlight #38bdf8
    r = 56; g = 189; b = 248;
  }

  // Car Body Base: y from 0.58 to 0.68, x from 0.22 to 0.78
  const inBodyBox = u >= 0.22 && u <= 0.78 && v >= 0.58 && v <= 0.68;
  if (inBodyBox) {
    // Car Body filled with deep navy + cyan border
    const isBorder = u <= 0.24 || u >= 0.76 || v <= 0.60 || v >= 0.66;
    if (isBorder) {
      r = 14; g = 165; b = 233; // #0ea5e9
    } else {
      r = 15; g = 23; b = 42; // #0f172a
    }
  }

  // 4. Wheels: left center (0.30, 0.68), right center (0.70, 0.68), radius = 0.05
  const wLDist = Math.sqrt((u - 0.30) * (u - 0.30) + (v - 0.68) * (v - 0.68));
  const wRDist = Math.sqrt((u - 0.70) * (u - 0.70) + (v - 0.68) * (v - 0.68));
  
  if (wLDist < 0.052 || wRDist < 0.052) {
    const wDist = Math.min(wLDist, wRDist);
    if (wDist < 0.018) {
      // Hub center white #ffffff
      r = 255; g = 255; b = 255;
    } else if (wDist < 0.040) {
      // Inner rim cyan #0284c7
      r = 2; g = 132; b = 199;
    } else {
      // Tire outer ring #38bdf8
      r = 56; g = 189; b = 248;
    }
  }

  // 5. Dynamic Checkmark / Speed Swoosh: from (0.42, 0.53) down to (0.48, 0.59) up to (0.62, 0.44)
  // Segment 1: (0.42, 0.53) -> (0.48, 0.59)
  const t1 = Math.max(0, Math.min(1, ((u - 0.42) * 0.06 + (v - 0.53) * 0.06) / (0.06 * 0.06 + 0.06 * 0.06)));
  const p1x = 0.42 + t1 * 0.06;
  const p1y = 0.53 + t1 * 0.06;
  const d1 = Math.sqrt((u - p1x) * (u - p1x) + (v - p1y) * (v - p1y));

  // Segment 2: (0.48, 0.59) -> (0.62, 0.44)
  const t2 = Math.max(0, Math.min(1, ((u - 0.48) * 0.14 + (v - 0.59) * -0.15) / (0.14 * 0.14 + 0.15 * 0.15)));
  const p2x = 0.48 + t2 * 0.14;
  const p2y = 0.59 + t2 * -0.15;
  const d2 = Math.sqrt((u - p2x) * (u - p2x) + (v - p2y) * (v - p2y));

  const checkDist = Math.min(d1, d2);
  if (checkDist < 0.024) {
    const factor = 1 - checkDist / 0.024;
    // Bright glowing cyan #38bdf8
    r = Math.round(r * (1 - factor) + 56 * factor);
    g = Math.round(g * (1 - factor) + 189 * factor);
    b = Math.round(b * (1 - factor) + 248 * factor);
  }

  return [r, g, b];
}

const targets = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'apple-touch-icon-167x167.png', size: 167 },
  { name: 'apple-touch-icon-152x152.png', size: 152 },
  { name: 'apple-touch-icon-120x120.png', size: 120 },
  { name: 'apple-touch-icon-precomposed.png', size: 180 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 }
];

targets.forEach(({ name, size }) => {
  const buf = createRgbPng(size, size, (u, v, x, y, w, h) => renderAutoTrackIcon(u, v, x, y, w, h));
  const outPath = path.join(__dirname, '..', 'public', name);
  fs.writeFileSync(outPath, buf);
  console.log(`Generated 100% opaque RGB icon: ${name} (${size}x${size}, ${buf.length} bytes)`);
});
