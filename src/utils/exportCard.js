import { COLORS } from './constants';

const CARD_W = 1200;
const CARD_H = 630;
const HEADER_H = 60;
const FOOTER_H = 80;
const CONTENT_Y = HEADER_H;
const CONTENT_H = CARD_H - HEADER_H - FOOTER_H;

const BG = '#f2f2f2';
const DARK = '#1a1a1a';
const MONITOR_BG = '#111111';
const ACCENT = COLORS.ACCENT;
const GRAY_400 = '#9ca3af';
const GRAY_300 = '#d1d5db';
const WHITE = '#ffffff';

const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO = '"SF Mono", "Cascadia Code", "Fira Code", monospace';

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHeader(ctx) {
  ctx.fillStyle = DARK;
  ctx.fillRect(0, 0, CARD_W, HEADER_H);

  ctx.fillStyle = WHITE;
  ctx.font = `900 20px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ANAMORPHIC', 32, HEADER_H / 2);

  const anamorphicWidth = ctx.measureText('ANAMORPHIC').width;
  ctx.fillStyle = ACCENT;
  ctx.fillText('_', 32 + anamorphicWidth, HEADER_H / 2);

  const underscoreWidth = ctx.measureText('_').width;
  ctx.fillStyle = WHITE;
  ctx.fillText('SIM', 32 + anamorphicWidth + underscoreWidth, HEADER_H / 2);

  ctx.fillStyle = GRAY_400;
  ctx.font = `700 10px ${SANS}`;
  ctx.textAlign = 'right';
  ctx.fillText('by Ha Joon Park', CARD_W - 32, HEADER_H / 2);
}

function drawFooter(ctx, { camera, activeMode, squeeze, delivery, scope90, verticalLens }) {
  const footerY = CARD_H - FOOTER_H;
  ctx.fillStyle = DARK;
  ctx.fillRect(0, footerY, CARD_W, FOOTER_H);

  // Left side: camera info
  ctx.fillStyle = WHITE;
  ctx.font = `900 13px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${camera.brand}  /  ${camera.model}`, 32, footerY + 28);

  ctx.fillStyle = GRAY_400;
  ctx.font = `700 11px ${MONO}`;
  ctx.fillText(`${camera.mode}  —  ${activeMode.resolution}`, 32, footerY + 52);

  // Right side: lens config
  ctx.textAlign = 'right';
  ctx.fillStyle = ACCENT;
  ctx.font = `900 14px ${MONO}`;

  const orientLabel = scope90 ? '90\u00B0 MOUNT' : verticalLens ? 'VERT LENS' : 'STANDARD';
  ctx.fillText(`${squeeze.toFixed(2)}x  \u00B7  ${orientLabel}  \u00B7  ${delivery.toFixed(2)}:1`, CARD_W - 32, footerY + 28);

  const effectiveW = scope90 ? activeMode.height : activeMode.width;
  const effectiveH = scope90 ? activeMode.width : activeMode.height;
  const virtualW = verticalLens ? effectiveW : effectiveW * squeeze;
  const virtualH = verticalLens ? effectiveH * squeeze : effectiveH;
  ctx.fillStyle = GRAY_400;
  ctx.font = `700 10px ${MONO}`;
  ctx.fillText(`VIRTUAL ${virtualW.toFixed(2)} \u00D7 ${virtualH.toFixed(2)} mm`, CARD_W - 32, footerY + 52);
}

function drawSensorSection(ctx, { activeMode, squeeze, scope90, verticalLens }) {
  const sectionX = 32;
  const sectionW = CARD_W / 2 - 48;
  const centerX = sectionX + sectionW / 2;
  const diagramCenterY = CONTENT_Y + 40 + (CONTENT_H - 80) / 2;

  // Section label
  ctx.fillStyle = GRAY_400;
  ctx.font = `900 9px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '3px';
  ctx.fillText('01_FOCAL_PLANE', sectionX, CONTENT_Y + 20);
  ctx.letterSpacing = '0px';

  // Sensor box
  const maxBox = Math.min(sectionW - 60, CONTENT_H - 140);
  const sensorScale = maxBox / Math.max(activeMode.width, activeMode.height);
  let boxW = activeMode.width * sensorScale;
  let boxH = activeMode.height * sensorScale;

  if (scope90) {
    ctx.save();
    ctx.translate(centerX, diagramCenterY);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = WHITE;
    ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
    ctx.strokeStyle = DARK;
    ctx.lineWidth = 2;
    ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

    // Oval (counter-rotated so it stays upright)
    ctx.rotate(-Math.PI / 2);
    const baseR = Math.min(boxW, boxH) * 0.3;
    ctx.beginPath();
    ctx.ellipse(0, 0, baseR / squeeze, baseR, 0, 0, Math.PI * 2);
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.fillStyle = WHITE;
    ctx.fillRect(centerX - boxW / 2, diagramCenterY - boxH / 2, boxW, boxH);
    ctx.strokeStyle = DARK;
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - boxW / 2, diagramCenterY - boxH / 2, boxW, boxH);

    // Oval
    const baseR = Math.min(boxW, boxH) * 0.3;
    let ovalRx, ovalRy;
    if (verticalLens) {
      // Lens rotated 90deg: horizontal squeeze on rotated element = visual vertical squeeze
      ovalRx = baseR;
      ovalRy = baseR / squeeze;
    } else {
      ovalRx = baseR / squeeze;
      ovalRy = baseR;
    }
    ctx.beginPath();
    ctx.ellipse(centerX, diagramCenterY, ovalRx, ovalRy, 0, 0, Math.PI * 2);
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // Dimensions label
  ctx.fillStyle = DARK;
  ctx.font = `700 13px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    `${activeMode.width.toFixed(2)} \u00D7 ${activeMode.height.toFixed(2)} mm`,
    centerX,
    diagramCenterY + boxH / 2 + 14
  );

  // Orientation label
  const orientLabel = scope90 ? 'SCOPE_90_MOUNT' : verticalLens ? 'VERTICAL_LENS' : 'STANDARD_MOUNT';
  ctx.fillStyle = GRAY_400;
  ctx.font = `900 9px ${SANS}`;
  ctx.fillText(orientLabel, centerX, diagramCenterY + boxH / 2 + 36);
}

function drawMonitorSection(ctx, { activeMode, squeeze, delivery, scope90, verticalLens }) {
  const sectionX = CARD_W / 2 + 16;
  const sectionW = CARD_W / 2 - 48;
  const centerX = sectionX + sectionW / 2;
  const diagramCenterY = CONTENT_Y + 40 + (CONTENT_H - 80) / 2;

  // Section label
  ctx.fillStyle = GRAY_400;
  ctx.font = `900 9px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '3px';
  ctx.fillText('02_SIGNAL_OUTPUT', sectionX, CONTENT_Y + 20);
  ctx.letterSpacing = '0px';

  // Compute desqueezed monitor dimensions
  const effectiveW = scope90 ? activeMode.height : activeMode.width;
  const effectiveH = scope90 ? activeMode.width : activeMode.height;

  let rawMonW, rawMonH;
  if (verticalLens) {
    rawMonW = effectiveW;
    rawMonH = rawMonW * (effectiveH / effectiveW) * squeeze;
  } else {
    rawMonH = effectiveH;
    rawMonW = rawMonH * (effectiveW / effectiveH) * squeeze;
  }

  // Fit into available area
  const maxBox = Math.min(sectionW - 60, CONTENT_H - 140);
  const monScale = Math.min(maxBox / rawMonW, maxBox / rawMonH);
  const monW = rawMonW * monScale;
  const monH = rawMonH * monScale;

  // Draw monitor box
  ctx.fillStyle = MONITOR_BG;
  drawRoundedRect(ctx, centerX - monW / 2, diagramCenterY - monH / 2, monW, monH, 2);
  ctx.fill();

  // Ghost circle
  const ghostR = Math.min(monW, monH) * 0.3;
  ctx.beginPath();
  ctx.ellipse(centerX, diagramCenterY, ghostR, ghostR, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Crop overlay
  const desqueezedAspect = verticalLens
    ? effectiveW / (effectiveH * squeeze)
    : (effectiveW / effectiveH) * squeeze;

  let cropW, cropH;
  if (desqueezedAspect > delivery) {
    cropH = monH;
    cropW = monH * delivery;
  } else {
    cropW = monW;
    cropH = monW / delivery;
  }

  const cropX = centerX - cropW / 2;
  const cropY = diagramCenterY - cropH / 2;

  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.8;
  ctx.strokeRect(cropX, cropY, cropW, cropH);
  ctx.globalAlpha = 1;

  // Crop glow
  ctx.shadowColor = ACCENT;
  ctx.shadowBlur = 12;
  ctx.strokeRect(cropX, cropY, cropW, cropH);
  ctx.shadowBlur = 0;

  // Delivery ratio label
  ctx.fillStyle = ACCENT;
  ctx.font = `900 11px ${MONO}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${delivery.toFixed(2)}:1_OUT`, cropX + cropW - 4, cropY + cropH - 4);

  // Config label below monitor
  const configLabel = scope90
    ? '90\u00B0 DESQUEEZE'
    : verticalLens
      ? `${squeeze.toFixed(2)}X VERTICAL`
      : `${squeeze.toFixed(2)}X DESQUEEZE`;
  ctx.fillStyle = DARK;
  ctx.font = `700 13px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(configLabel, centerX, diagramCenterY + monH / 2 + 14);

  ctx.fillStyle = GRAY_400;
  ctx.font = `900 9px ${SANS}`;
  ctx.fillText('DESQUEEZED_MONITOR', centerX, diagramCenterY + monH / 2 + 36);

  // Virtual format
  const virtualW = verticalLens ? effectiveW : effectiveW * squeeze;
  const virtualH = verticalLens ? effectiveH * squeeze : effectiveH;
  ctx.fillStyle = DARK;
  ctx.font = `700 11px ${MONO}`;
  ctx.fillText(
    `VIRTUAL ${virtualW.toFixed(2)} \u00D7 ${virtualH.toFixed(2)} mm`,
    centerX,
    diagramCenterY + monH / 2 + 54
  );
}

function drawDivider(ctx) {
  const x = CARD_W / 2;
  ctx.strokeStyle = GRAY_300;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x, CONTENT_Y + 16);
  ctx.lineTo(x, CARD_H - FOOTER_H - 16);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function exportConfigCard({ camera, activeMode, squeeze, delivery, scope90, verticalLens }) {
  if (!activeMode) return;

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  drawHeader(ctx);
  drawDivider(ctx);
  drawSensorSection(ctx, { activeMode, squeeze, scope90, verticalLens });
  drawMonitorSection(ctx, { activeMode, squeeze, delivery, scope90, verticalLens });
  drawFooter(ctx, { camera, activeMode, squeeze, delivery, scope90, verticalLens });

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = `${camera.brand}_${camera.model}_${camera.mode}`
      .replace(/[^a-zA-Z0-9_.-]/g, '-');
    a.download = `anamorphic_${safeName}_${squeeze.toFixed(2)}x_${delivery.toFixed(2)}.png`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
