import { COLORS } from './constants';

const CARD_W = 1200;
const CARD_H = 630;
const HEADER_H = 56;
const FOOTER_H = 110;
const RULE_PAD = 24; // padding between header/footer bands and content rules
const CONTENT_TOP = HEADER_H + RULE_PAD;
const CONTENT_BOTTOM = CARD_H - FOOTER_H - RULE_PAD;
const SIDE_PAD = 40;

// Tokens — locked palette
const PAPER = '#f2f2f2';
const INK = '#1a1a1a';
const RULE = '#d0d0d0';
const LABEL = '#7a7a7a';
const SUB = '#9a9a9a';
const MONITOR_BG = '#111111';
const ACCENT = COLORS.ACCENT; // reserved: optical signal only
const WHITE = '#ffffff';

const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO = '"SF Mono", "Cascadia Code", "Fira Code", monospace';

function drawHeader(ctx) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, CARD_W, HEADER_H);

  ctx.fillStyle = WHITE;
  ctx.font = `900 20px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ANAMORPHIC', SIDE_PAD, HEADER_H / 2);

  const anamorphicWidth = ctx.measureText('ANAMORPHIC').width;
  ctx.fillStyle = ACCENT;
  ctx.fillText('_', SIDE_PAD + anamorphicWidth, HEADER_H / 2);

  const underscoreWidth = ctx.measureText('_').width;
  ctx.fillStyle = WHITE;
  ctx.fillText('SIM', SIDE_PAD + anamorphicWidth + underscoreWidth, HEADER_H / 2);

  // Right: author + sheet
  ctx.fillStyle = SUB;
  ctx.font = `700 9px ${MONO}`;
  ctx.textAlign = 'right';
  ctx.fillText('SHEET_01 / REV_A   ·   BY HA JOON PARK', CARD_W - SIDE_PAD, HEADER_H / 2);
}

function drawRules(ctx) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  // Top rule below header
  ctx.beginPath();
  ctx.moveTo(SIDE_PAD, HEADER_H + 12);
  ctx.lineTo(CARD_W - SIDE_PAD, HEADER_H + 12);
  ctx.stroke();
  // Bottom rule above footer
  const y = CARD_H - FOOTER_H - 12;
  ctx.beginPath();
  ctx.moveTo(SIDE_PAD, y);
  ctx.lineTo(CARD_W - SIDE_PAD, y);
  ctx.stroke();
}

function drawScaleGrid(ctx, scale) {
  // Calibrated reference grid — 10mm minor / 50mm major, sized to passed mm-to-px scale
  const x0 = SIDE_PAD;
  const y0 = HEADER_H + 14;
  const x1 = CARD_W - SIDE_PAD;
  const y1 = CARD_H - FOOTER_H - 14;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, x1 - x0, y1 - y0);
  ctx.clip();

  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const minorStep = 10 * scale;
  const majorStep = 50 * scale;

  ctx.strokeStyle = 'rgba(0,0,0,0.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = cx; x < x1; x += minorStep) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
  for (let x = cx - minorStep; x > x0; x -= minorStep) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
  for (let y = cy; y < y1; y += minorStep) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
  for (let y = cy - minorStep; y > y0; y -= minorStep) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0,0,0,0.10)';
  ctx.beginPath();
  for (let x = cx; x < x1; x += majorStep) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
  for (let x = cx - majorStep; x > x0; x -= majorStep) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
  for (let y = cy; y < y1; y += majorStep) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
  for (let y = cy - majorStep; y > y0; y -= majorStep) { ctx.moveTo(x0, y); ctx.lineTo(x1, y); }
  ctx.stroke();

  ctx.restore();
}

function drawScaleLegend(ctx) {
  // Bottom-left of content band — fixed-size icons (grid itself carries the scale)
  const x = SIDE_PAD + 4;
  const y = CARD_H - FOOTER_H - 22;
  ctx.fillStyle = LABEL;
  ctx.font = `700 8px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y - 4, 8, 8);
  ctx.fillText('10_MM', x + 14, y);

  const x2 = x + 70;
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.strokeRect(x2, y - 6, 12, 12);
  ctx.fillText('50_MM', x2 + 18, y);
}

function drawSensorSection(ctx, { activeMode, squeeze, scope90, verticalLens, scale }) {
  const sectionX = SIDE_PAD;
  const sectionW = CARD_W / 2 - SIDE_PAD - 12;
  const centerX = sectionX + sectionW / 2;
  const labelY = CONTENT_TOP + 4;
  const diagramCenterY = (CONTENT_TOP + 50 + CONTENT_BOTTOM - 60) / 2;

  // Section label tab (top-left of section)
  ctx.fillStyle = LABEL;
  ctx.font = `900 10px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('01_FOCAL_PLANE', sectionX, labelY);

  // Sensor box (sized by unified mm-to-px scale)
  const boxW = activeMode.width * scale;
  const boxH = activeMode.height * scale;

  if (scope90) {
    ctx.save();
    ctx.translate(centerX, diagramCenterY);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = WHITE;
    ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

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
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - boxW / 2, diagramCenterY - boxH / 2, boxW, boxH);

    const baseR = Math.min(boxW, boxH) * 0.3;
    let ovalRx, ovalRy;
    if (verticalLens) {
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

  // Dimensions label (neutral)
  ctx.fillStyle = INK;
  ctx.font = `700 13px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    `${activeMode.width.toFixed(2)}  \u00D7  ${activeMode.height.toFixed(2)}  MM`,
    centerX,
    diagramCenterY + boxH / 2 + 18
  );

  // Orientation sub-label (neutral)
  const orientLabel = scope90 ? 'SCOPE_90_MOUNT' : verticalLens ? 'VERTICAL_LENS' : 'STANDARD_MOUNT';
  ctx.fillStyle = LABEL;
  ctx.font = `900 9px ${MONO}`;
  ctx.fillText(orientLabel, centerX, diagramCenterY + boxH / 2 + 40);
}

function drawMonitorSection(ctx, { activeMode, squeeze, delivery, scope90, verticalLens, scale, monRawW, monRawH }) {
  const sectionX = CARD_W / 2 + 12;
  const sectionW = CARD_W / 2 - SIDE_PAD - 12;
  const centerX = sectionX + sectionW / 2;
  const labelY = CONTENT_TOP + 4;
  const diagramCenterY = (CONTENT_TOP + 50 + CONTENT_BOTTOM - 60) / 2;

  // Section label tab
  ctx.fillStyle = LABEL;
  ctx.font = `900 10px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('02_SIGNAL_OUTPUT', sectionX, labelY);

  const effectiveW = scope90 ? activeMode.height : activeMode.width;
  const effectiveH = scope90 ? activeMode.width : activeMode.height;

  // Monitor sized by unified mm-to-px scale (matches sensor + grid)
  const monW = monRawW * scale;
  const monH = monRawH * scale;

  // Monitor box — honest 1px border, no rounding, no shadow
  ctx.fillStyle = MONITOR_BG;
  ctx.fillRect(centerX - monW / 2, diagramCenterY - monH / 2, monW, monH);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.strokeRect(centerX - monW / 2, diagramCenterY - monH / 2, monW, monH);

  // Ghost circle (the projected subject post-desqueeze)
  const ghostR = Math.min(monW, monH) * 0.3;
  ctx.beginPath();
  ctx.ellipse(centerX, diagramCenterY, ghostR, ghostR, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Crop rectangle — orange (optical signal)
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
  ctx.strokeRect(cropX, cropY, cropW, cropH);

  // Delivery ratio label inside crop (signal context — orange OK)
  ctx.fillStyle = ACCENT;
  ctx.font = `900 11px ${MONO}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`TARGET_RATIO ${delivery.toFixed(2)}:1`, cropX + cropW - 4, cropY + cropH - 4);

  // Config label (neutral)
  const configLabel = scope90
    ? '90°_DESQUEEZE'
    : verticalLens
      ? `${squeeze.toFixed(2)}X_VERTICAL`
      : `${squeeze.toFixed(2)}X_DESQUEEZE`;
  ctx.fillStyle = INK;
  ctx.font = `700 13px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(configLabel, centerX, diagramCenterY + monH / 2 + 18);

  ctx.fillStyle = LABEL;
  ctx.font = `900 9px ${MONO}`;
  ctx.fillText('DESQUEEZED_MONITOR', centerX, diagramCenterY + monH / 2 + 40);
}

function drawFooterSpec(ctx, { camera, activeMode, squeeze, delivery, scope90, verticalLens }) {
  const footerY = CARD_H - FOOTER_H;
  ctx.fillStyle = INK;
  ctx.fillRect(0, footerY, CARD_W, FOOTER_H);

  const effectiveW = scope90 ? activeMode.height : activeMode.width;
  const effectiveH = scope90 ? activeMode.width : activeMode.height;
  const virtualW = verticalLens ? effectiveW : effectiveW * squeeze;
  const virtualH = verticalLens ? effectiveH * squeeze : effectiveH;

  const orientLabel = scope90 ? 'SCOPE_90_MOUNT' : verticalLens ? 'VERTICAL_LENS' : 'STANDARD_MOUNT';

  // Calculated full-frame ratio + crop loss vs target
  const fullAspect = verticalLens
    ? effectiveW / (effectiveH * squeeze)
    : (effectiveW / effectiveH) * squeeze;
  const cropPct = (1 - Math.min(fullAspect, delivery) / Math.max(fullAspect, delivery)) * 100;
  const isMatch = cropPct < 0.05;
  const cropAxis = fullAspect > delivery ? 'SIDES' : 'TOP/BTM';

  // Virtual pixel resolution — native pixels stretched on the desqueezed axis
  const resMatch = activeMode.resolution && activeMode.resolution.match(/(\d+)\s*[x\u00D7]\s*(\d+)/i);
  let virtualPxStr = '';
  if (resMatch) {
    const nx = parseInt(resMatch[1], 10);
    const ny = parseInt(resMatch[2], 10);
    let vx = scope90 ? ny : nx;
    let vy = scope90 ? nx : ny;
    if (verticalLens) vy = Math.round(vy * squeeze);
    else vx = Math.round(vx * squeeze);
    virtualPxStr = `${vx.toLocaleString()} \u00D7 ${vy.toLocaleString()} PX`;
  } else {
    virtualPxStr = `${activeMode.resolution || '—'} PX`;
  }

  // 4 cells: CAMERA / LENS / CALCULATED_RATIO / VIRTUAL_FORMAT
  const cells = [
    {
      label: 'CAMERA',
      value: `${camera.brand}  /  ${camera.model}`,
      sub: `${camera.mode}  ·  ${activeMode.resolution}`,
    },
    {
      label: 'LENS',
      value: `${squeeze.toFixed(2)}\u00D7`,
      sub: orientLabel,
    },
    {
      label: 'CALCULATED_RATIO',
      value: `${fullAspect.toFixed(2)}:1`,
      sub: isMatch
        ? `NATIVE_FIT FOR ${delivery.toFixed(2)}:1 TARGET`
        : `CROP_LOSS ${cropPct.toFixed(1)}\u0025 ${cropAxis} FOR ${delivery.toFixed(2)}:1 TARGET`,
    },
    {
      label: 'VIRTUAL_FORMAT',
      value: `${virtualW.toFixed(2)} \u00D7 ${virtualH.toFixed(2)} MM`,
      sub: virtualPxStr,
    },
  ];

  const innerW = CARD_W - SIDE_PAD * 2;
  const cellW = innerW / cells.length;
  const cellTop = footerY + 22;

  cells.forEach((cell, i) => {
    const cx = SIDE_PAD + i * cellW;

    // Cell label (above)
    ctx.fillStyle = SUB;
    ctx.font = `900 9px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(cell.label, cx, cellTop);

    // Cell value (large)
    ctx.fillStyle = WHITE;
    ctx.font = `900 17px ${MONO}`;
    ctx.fillText(cell.value, cx, cellTop + 18);

    // Cell sub
    ctx.fillStyle = SUB;
    ctx.font = `700 10px ${MONO}`;
    ctx.fillText(cell.sub, cx, cellTop + 44);

    // Vertical rule between cells
    if (i > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 12, footerY + 18);
      ctx.lineTo(cx - 12, footerY + FOOTER_H - 18);
      ctx.stroke();
    }
  });
}

export function exportConfigCard({ camera, activeMode, squeeze, delivery, scope90, verticalLens }) {
  if (!activeMode) return;

  // Compute unified mm-to-px scale shared by sensor + monitor + grid.
  // Both diagrams render at the same scale so the grid is a literal ruler.
  const effectiveW = scope90 ? activeMode.height : activeMode.width;
  const effectiveH = scope90 ? activeMode.width : activeMode.height;
  let monRawW, monRawH;
  if (verticalLens) {
    monRawW = effectiveW;
    monRawH = monRawW * (effectiveH / effectiveW) * squeeze;
  } else {
    monRawH = effectiveH;
    monRawW = monRawH * (effectiveW / effectiveH) * squeeze;
  }

  const sectionW = CARD_W / 2 - SIDE_PAD - 12;
  const maxBoxW = sectionW - 80;
  const maxBoxH = CONTENT_BOTTOM - CONTENT_TOP - 140;
  const sensorFit = Math.min(maxBoxW / activeMode.width, maxBoxH / activeMode.height);
  const monitorFit = Math.min(maxBoxW / monRawW, maxBoxH / monRawH);
  const unifiedScale = Math.min(sensorFit, monitorFit);

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  drawScaleGrid(ctx, unifiedScale);
  drawHeader(ctx);
  drawRules(ctx);
  drawSensorSection(ctx, { activeMode, squeeze, scope90, verticalLens, scale: unifiedScale });
  drawMonitorSection(ctx, { activeMode, squeeze, delivery, scope90, verticalLens, scale: unifiedScale, monRawW, monRawH });
  drawScaleLegend(ctx);
  drawFooterSpec(ctx, { camera, activeMode, squeeze, delivery, scope90, verticalLens });

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
