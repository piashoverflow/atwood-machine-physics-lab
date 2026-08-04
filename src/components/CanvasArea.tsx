import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PhysicsParams, SimulationState, DisplayOptions } from '../types';
import { EquationPanel } from './EquationPanel';
import { StateProbe } from './StateProbe';
import { EnergyBar } from './EnergyBar';

interface CanvasAreaProps {
  params: PhysicsParams;
  state: SimulationState;
  display: DisplayOptions;
  onUpdatePositions: (y1: number, y2: number) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  params,
  state,
  display,
  onUpdatePositions,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState<'m1' | 'm2' | null>(null);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [hoveredMass, setHoveredMass] = useState<'m1' | 'm2' | null>(null);

  const { m1, m2, friction, inclineAngle, inclineAngle2, gravity } = params;
  const { y1, y2, mode } = state;
  const isLight = display.theme === 'light';

  // Helper function for rendering sleek dark contrast pill badges
  const drawPillBadge = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    textColor: string,
    bgColor: string = 'rgba(15, 23, 42, 0.92)',
    borderColor: string = textColor
  ) => {
    ctx.save();
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    const metrics = ctx.measureText(text);
    const w = metrics.width + 14;
    const h = 20;

    const canvasWidth = ctx.canvas.width / (window.devicePixelRatio || 1);
    const canvasHeight = ctx.canvas.height / (window.devicePixelRatio || 1);

    const clampedX = Math.max(w / 2 + 10, Math.min(x, canvasWidth - w / 2 - 10));
    const clampedY = Math.max(h / 2 + 10, Math.min(y, canvasHeight - h / 2 - 10));

    ctx.beginPath();
    ctx.roundRect(clampedX - w / 2, clampedY - h / 2, w, h, 4);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, clampedX, clampedY);
    ctx.restore();
  };

  // Helper function to draw vector arrows without badge text
  const drawArrowOnly = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string
  ) => {
    const headlen = 8;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  };

  // Helper function to draw vector arrows with pill badge
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    label?: string
  ) => {
    const dy = toY - fromY;
    drawArrowOnly(ctx, fromX, fromY, toX, toY, color);

    if (label) {
      drawPillBadge(
        ctx,
        label,
        toX,
        toY + (dy > 0 ? 14 : -14),
        color,
        'rgba(15, 23, 42, 0.92)',
        color
      );
    }
  };

  interface BadgeItem {
    text: string;
    x: number;
    y: number;
    color: string;
  }

  // Anti-collision badge positioning pass
  const drawBadgeListWithAntiCollision = (
    ctx: CanvasRenderingContext2D,
    badges: BadgeItem[]
  ) => {
    if (badges.length === 0) return;

    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    const items = badges.map((b) => {
      const w = ctx.measureText(b.text).width + 14;
      return { ...b, w, h: 20 };
    });

    const minPadding = 12;
    for (let pass = 0; pass < 8; pass++) {
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const b1 = items[i];
          const b2 = items[j];

          const minDx = (b1.w + b2.w) / 2 + minPadding;
          const minDy = (b1.h + b2.h) / 2 + minPadding;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;

          if (Math.abs(dx) < minDx && Math.abs(dy) < minDy) {
            const overlapX = minDx - Math.abs(dx);
            const overlapY = minDy - Math.abs(dy);

            if (overlapX < overlapY) {
              const shift = (overlapX / 2 + 1) * (dx >= 0 ? 1 : -1);
              b1.x -= shift;
              b2.x += shift;
            } else {
              const shift = (overlapY / 2 + 1) * (dy >= 0 ? 1 : -1);
              b1.y -= shift;
              b2.y += shift;
            }
          }
        }
      }
    }

    items.forEach((item) => {
      drawPillBadge(
        ctx,
        item.text,
        item.x,
        item.y,
        item.color,
        'rgba(15, 23, 42, 0.92)',
        item.color
      );
    });
  };

  // Helper function to draw a pulley wheel
  const drawPulleyWheel = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    angle: number,
    label?: string
  ) => {
    ctx.save();
    ctx.translate(cx, cy);

    // Pulley Glow / Shadow
    ctx.shadowColor = isLight ? 'rgba(2, 132, 199, 0.3)' : 'rgba(0, 242, 254, 0.4)';
    ctx.shadowBlur = 8;

    // Outer Rim
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? '#F1F5F9' : '#161B22';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = isLight ? '#0284C7' : '#00F2FE';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Rotating Spokes
    ctx.rotate(angle);
    ctx.strokeStyle = isLight ? '#94A3B8' : '#334155';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r * Math.cos((i * Math.PI) / 2), r * Math.sin((i * Math.PI) / 2));
      ctx.stroke();
    }

    // Hub
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(4, r * 0.2), 0, Math.PI * 2);
    ctx.fillStyle = isLight ? '#0284C7' : '#00F2FE';
    ctx.fill();

    ctx.restore();

    if (label) {
      ctx.fillStyle = isLight ? '#475569' : '#A9B2BC';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, cx, cy - r - 6);
    }
  };

  // Main canvas draw routine
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.clearRect(0, 0, width, height);

    // 1. Background Fill & Bright Laboratory Grid
    if (isLight) {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(1, '#F0F7FF');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Blueprint / Lab Grid
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 1;
    } else {
      ctx.fillStyle = '#0B0E14';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(42, 48, 58, 0.35)';
      ctx.lineWidth = 1;
    }

    const gridStep = 30;
    for (let x = 0; x < width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Ruler Markings on Left
    ctx.fillStyle = isLight ? '#64748B' : '#A9B2BC';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    const scaleOriginY = 100; // Reference origin Y
    const pxlPerMeter = 75; // 75px per meter scale

    for (let m = 0; m <= 6; m += 0.5) {
      const pixelsY = scaleOriginY + m * pxlPerMeter;
      if (pixelsY < height) {
        ctx.fillText(`${m.toFixed(1)}m`, 38, pixelsY + 3);
        ctx.beginPath();
        ctx.moveTo(42, pixelsY);
        ctx.lineTo(48, pixelsY);
        ctx.strokeStyle = isLight ? '#CBD5E1' : '#2A303A';
        ctx.stroke();
      }
    }

    // Shift system center left on desktop screens to avoid overlapping with right-side EquationPanel
    const centerX = width > 768 ? Math.max(260, Math.min(width * 0.38, width - 360)) : width / 2;
    const centerY = 100;
    const ropeColor = isLight ? '#0284C7' : '#00F2FE';

    // 3. Ceiling Support Structure
    ctx.fillStyle = isLight ? '#E2E8F0' : '#1A1E27';
    ctx.fillRect(centerX - 100, 0, 200, 12);
    ctx.strokeStyle = isLight ? '#CBD5E1' : '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 100, 0, 200, 12);

    // Ceiling Mount Bracket
    ctx.fillStyle = isLight ? '#CBD5E1' : '#334155';
    ctx.fillRect(centerX - 12, 12, 24, centerY - 32);

    const massW = 48;
    const massH = 50;
    const isHov1 = hoveredMass === 'm1' || isDragging === 'm1';
    const isHov2 = hoveredMass === 'm2' || isDragging === 'm2';

    // --- DRAW PULLEY SYSTEM BASED ON MODE ---

    if (mode === 'standard') {
      // 1:1 Standard Atwood Pulley
      const R = 36;
      const rope1X = centerX - R;
      const rope2X = centerX + R;
      const m1PixelY = centerY + y1 * pxlPerMeter;
      const m2PixelY = centerY + y2 * pxlPerMeter;
      const rotAngle = (y1 * pxlPerMeter) / R;

      drawPulleyWheel(ctx, centerX, centerY, R, rotAngle, 'Fixed Pulley (1:1)');
      drawPillBadge(
        ctx,
        'Law: T₁ = T₂ = T',
        centerX,
        centerY - R - 16,
        '#059669',
        isLight ? '#D1FAE5' : '#064E3B',
        '#10B981'
      );

      // Rope Loop
      ctx.beginPath();
      ctx.moveTo(rope1X, m1PixelY);
      ctx.lineTo(rope1X, centerY);
      ctx.arc(centerX, centerY, R, Math.PI, 0);
      ctx.lineTo(rope2X, m2PixelY);
      ctx.strokeStyle = ropeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Mass 1 Box (Effort)
      drawMassBox(ctx, rope1X, m1PixelY, massW, massH, 'm₁', m1, isHov1, '#0284C7', '#38BDF8');
      // Mass 2 Box (Load)
      drawMassBox(ctx, rope2X, m2PixelY, massW, massH, 'm₂', m2, isHov2, '#E11D48', '#FB7185');

      // Vectors
      if (display.showVectors) {
        drawVectors(ctx, rope1X, m1PixelY, massW, massH, m1, state.t1, gravity);
        drawVectors(ctx, rope2X, m2PixelY, massW, massH, m2, state.t2, gravity);
      }
    } else if (mode === 'double_atwood') {
      // --- DOUBLE ATWOOD MACHINE (3-MASS CASCADED SYSTEM WITH GENEROUS SPACING) ---
      const R_top = 50;
      const topPulleyX = centerX;
      const topPulleyY = centerY + 10;

      const m3PixelY = centerY + 140 + (state.y3 || y2) * 45;
      const ropeLeftX = topPulleyX - R_top;  // centerX - 50
      const ropeRightX = topPulleyX + R_top; // centerX + 50 (m3 hangs here)

      // Moving Pulley A position
      const pulleyAPixelY = centerY + 90 + y1 * 40;
      const rotAngleMain = (y1 * pxlPerMeter) / R_top;
      const rotAngleSub = (y2 * pxlPerMeter) / R_top;

      // Draw Main Fixed Pulley
      drawPulleyWheel(ctx, topPulleyX, topPulleyY, R_top, rotAngleMain, 'Fixed Top Pulley');
      drawPillBadge(
        ctx,
        'Law: T₃ = 2 · T₁',
        topPulleyX,
        topPulleyY - R_top - 16,
        '#059669',
        isLight ? '#D1FAE5' : '#064E3B',
        '#10B981'
      );

      // Main Rope: Top Pulley to m3 (Right) and Moving Pulley A (Left)
      ctx.beginPath();
      ctx.moveTo(ropeLeftX, pulleyAPixelY);
      ctx.lineTo(ropeLeftX, topPulleyY);
      ctx.arc(topPulleyX, topPulleyY, R_top, Math.PI, 0, false);
      ctx.lineTo(ropeRightX, m3PixelY);
      ctx.strokeStyle = '#00F2FE';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw Moving Pulley A with generous radius for block separation
      const rSub = 34;
      drawPulleyWheel(ctx, ropeLeftX, pulleyAPixelY, rSub, rotAngleSub, 'Movable Pulley A');
      drawPillBadge(
        ctx,
        'Law: T₁ = T₂',
        ropeLeftX,
        pulleyAPixelY + rSub + 18,
        '#0284C7',
        isLight ? '#E0F2FE' : '#075985',
        '#0284C7'
      );

      // Secondary Rope around Movable Pulley A holding m1 and m2 cleanly spaced
      const m1X = ropeLeftX - rSub; // centerX - 84
      const m2X = ropeLeftX + rSub; // centerX - 16
      const m1PixelY = pulleyAPixelY + 75 + (y1 * 25) + (y2 * 30);
      const m2PixelY = pulleyAPixelY + 75 + (y1 * 25) - (y2 * 30);

      ctx.beginPath();
      ctx.moveTo(m1X, m1PixelY);
      ctx.lineTo(m1X, pulleyAPixelY);
      ctx.arc(ropeLeftX, pulleyAPixelY, rSub, Math.PI, 0, false);
      ctx.lineTo(m2X, m2PixelY);
      ctx.strokeStyle = '#00FF8C';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Mass Boxes (spaced apart with clean gaps)
      drawMassBox(ctx, m1X, m1PixelY, massW - 6, massH - 6, 'm₁', m1, false, '#0284C7', '#38BDF8');
      drawMassBox(ctx, m2X, m2PixelY, massW - 6, massH - 6, 'm₂', m2, false, '#E11D48', '#FB7185');
      drawMassBox(ctx, ropeRightX, m3PixelY, massW + 4, massH + 4, 'm₃', params.m3, false, '#7C3AED', '#A78BFA');

      if (display.showVectors) {
        drawVectors(ctx, m1X, m1PixelY, massW - 6, massH - 6, m1, state.t1, gravity);
        drawVectors(ctx, m2X, m2PixelY, massW - 6, massH - 6, m2, state.t1, gravity);
        drawVectors(ctx, ropeRightX, m3PixelY, massW + 4, massH + 4, params.m3, state.t2, gravity);
      }
    } else if (mode === 'table_2pulley') {
      // --- TABLE-TOP 2-PULLEY SYSTEM ---
      const tableW = 340;
      const tableH = 18;
      const tableX = centerX - tableW / 2;
      const tableY = centerY + 100;

      // Draw Table Top Surface
      ctx.fillStyle = isLight ? '#E2E8F0' : '#1E293B';
      ctx.fillRect(tableX, tableY, tableW, tableH);
      ctx.strokeStyle = isLight ? '#94A3B8' : '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(tableX, tableY, tableW, tableH);

      // Table Legs
      ctx.fillRect(tableX + 20, tableY + tableH, 16, 160);
      ctx.fillRect(tableX + tableW - 36, tableY + tableH, 16, 160);

      // Surface Friction Indicator Badge
      drawPillBadge(
        ctx,
        `Friction μ_k = ${params.surfaceFriction.toFixed(2)}`,
        centerX,
        tableY + tableH + 18,
        '#D97706',
        isLight ? '#FEF3C7' : '#451A03',
        '#F59E0B'
      );

      const R = 22;
      const pLeftX = tableX;
      const pLeftY = tableY - R;
      const pRightX = tableX + tableW;
      const pRightY = tableY - R;

      drawPulleyWheel(ctx, pLeftX, pLeftY, R, (y1 * pxlPerMeter) / R, 'Left P1');
      drawPillBadge(ctx, 'T₁ = m₁(g - a)', pLeftX - 10, pLeftY - R - 16, '#0284C7', isLight ? '#E0F2FE' : '#075985', '#0284C7');

      drawPulleyWheel(ctx, pRightX, pRightY, R, (y2 * pxlPerMeter) / R, 'Right P2');
      drawPillBadge(ctx, 'T₂ = m₃(g + a)', pRightX + 10, pRightY - R - 16, '#E11D48', isLight ? '#FFE4E6' : '#881337', '#FB7185');

      // Mass 2 sitting on table surface with wire attached at top edge (tableY - 2*R)
      const m2PixelX = centerX + (state.v * 30);
      const m2PixelY = tableY - massH;
      const wireY = tableY - 2 * R;

      drawMassBox(ctx, m2PixelX, m2PixelY, massW + 8, massH, 'm₂ (Table)', m2, isHov2, '#D97706', '#F59E0B');

      // Mass 1 Hanging Left
      const m1X = pLeftX - R;
      const m1PixelY = tableY + 40 + y1 * pxlPerMeter;
      drawMassBox(ctx, m1X, m1PixelY, massW, massH, 'm₁', m1, isHov1, '#0284C7', '#38BDF8');

      // Mass 3 Hanging Right
      const m3X = pRightX + R;
      const m3PixelY = tableY + 40 + (state.y3 || y2) * pxlPerMeter;
      drawMassBox(ctx, m3X, m3PixelY, massW, massH, 'm₃', params.m3, false, '#7C3AED', '#A78BFA');

      // Left Rope (Tangent to Left Pulley Top Rim -> m2 Left Hook)
      ctx.beginPath();
      ctx.moveTo(m1X, m1PixelY);
      ctx.lineTo(m1X, pLeftY);
      ctx.arc(pLeftX, pLeftY, R, Math.PI, Math.PI * 1.5, false);
      ctx.lineTo(m2PixelX - (massW + 8) / 2, wireY);
      ctx.strokeStyle = '#00F2FE';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Right Rope (m2 Right Hook -> Tangent to Right Pulley Top Rim -> m3)
      ctx.beginPath();
      ctx.moveTo(m2PixelX + (massW + 8) / 2, wireY);
      ctx.lineTo(pRightX, wireY);
      ctx.arc(pRightX, pRightY, R, Math.PI * 1.5, 0, false);
      ctx.lineTo(m3X, m3PixelY);
      ctx.strokeStyle = '#00FF8C';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (display.showVectors) {
        drawVectors(ctx, m1X, m1PixelY, massW, massH, m1, state.t1, gravity);
        drawVectors(ctx, m3X, m3PixelY, massW, massH, params.m3, state.t2, gravity);
      }
    } else if (mode === 'double_incline') {
      // --- UNIVERSAL DUAL-RAMP APEX SYSTEM ---
      const rad1 = (inclineAngle * Math.PI) / 180;
      const rad2 = (inclineAngle2 * Math.PI) / 180;

      const groundY = centerY + 220;
      const apexX = centerX;
      const apexY = centerY + 30; // Vertex of wedge snaps to bottom of pulley wheel
      const R = 38; // Enlarged top pulley wheel radius to 38px for prominent visual scale
      const massW = 48;
      const massH = 48;

      const pulleyCenterY = apexY - R;

      // Tangent points on pulley wheel circle
      const leftTangentX = apexX - R * Math.sin(rad1);
      const leftTangentY = pulleyCenterY - R * Math.cos(rad1);

      const rightTangentX = apexX + R * Math.sin(rad2);
      const rightTangentY = pulleyCenterY - R * Math.cos(rad2);

      // Direction vectors down along incline rays
      const dir1 = { x: -Math.cos(rad1), y: Math.sin(rad1) };
      const dir2 = { x: Math.cos(rad2), y: Math.sin(rad2) };

      // Outward normal vectors perpendicular to surfaces (pointing into air UP/LEFT and UP/RIGHT)
      const norm1 = { x: -Math.sin(rad1), y: -Math.cos(rad1) };
      const norm2 = { x: Math.sin(rad2), y: -Math.cos(rad2) };

      const leftMasses = params.leftMasses || [m1];
      const rightMasses = params.rightMasses || [m2];

      // Ramp lengths and boundary clamping
      const rampLength1 = inclineAngle === 0 ? 380 : (inclineAngle === 90 ? (groundY - leftTangentY) : Math.max(380, (groundY - apexY) / Math.sin(rad1)));
      const minDistance1 = R + massH / 2 + 10;
      const maxDistance1 = Math.max(minDistance1 + 20, rampLength1 - leftMasses.length * (massH + 8));
      const d1_raw = 110 + y1 * 40;
      const d1 = Math.max(minDistance1, Math.min(maxDistance1, d1_raw));

      const rampLength2 = inclineAngle2 === 0 ? 380 : (inclineAngle2 === 90 ? (groundY - rightTangentY) : Math.max(380, (groundY - apexY) / Math.sin(rad2)));
      const minDistance2 = R + massH / 2 + 10;
      const maxDistance2 = Math.max(minDistance2 + 20, rampLength2 - rightMasses.length * (massH + 8));
      const d2_raw = 110 + y2 * 40;
      const d2 = Math.max(minDistance2, Math.min(maxDistance2, d2_raw));

      // Calculate support structure polygon vertices (Wedge / Table / Ramp frame)
      let leftTopX: number, leftTopY: number, leftBotX: number;
      if (inclineAngle === 0) {
        leftTopX = apexX;
        leftTopY = apexY;
        leftBotX = apexX - 350;
      } else if (inclineAngle === 90) {
        leftTopX = leftTangentX;
        leftTopY = apexY;
        leftBotX = leftTangentX;
      } else {
        leftTopX = apexX;
        leftTopY = apexY;
        leftBotX = apexX - (groundY - apexY) / Math.tan(rad1);
      }

      let rightTopX: number, rightTopY: number, rightBotX: number;
      if (inclineAngle2 === 0) {
        rightTopX = apexX;
        rightTopY = apexY;
        rightBotX = apexX + 350;
      } else if (inclineAngle2 === 90) {
        rightTopX = rightTangentX;
        rightTopY = apexY;
        rightBotX = rightTangentX;
      } else {
        rightTopX = apexX;
        rightTopY = apexY;
        rightBotX = apexX + (groundY - apexY) / Math.tan(rad2);
      }

      const isAtwood = inclineAngle === 90 && inclineAngle2 === 90;

      if (isAtwood) {
        // Case A: Ideal Atwood Setup (θ1 = 90° AND θ2 = 90°)
        // DO NOT draw any blue triangular wedge underneath the pulley.
        ctx.fillStyle = isLight ? '#94A3B8' : '#475569';
        ctx.fillRect(apexX - 75, pulleyCenterY - R - 18, 150, 8);
        ctx.fillRect(apexX - 4, pulleyCenterY - R - 10, 8, R + 10);

        // Dashed floor reference
        ctx.beginPath();
        ctx.moveTo(apexX - 160, groundY);
        ctx.lineTo(apexX + 160, groundY);
        ctx.strokeStyle = isLight ? '#CBD5E1' : '#334155';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Cases B, C, D: Solid, Unified Wedge / Ramp / Table Structure
        ctx.beginPath();
        if (inclineAngle === 0 && inclineAngle2 === 0) {
          ctx.moveTo(leftBotX, groundY);
          ctx.lineTo(leftBotX, apexY);
          ctx.lineTo(rightBotX, apexY);
          ctx.lineTo(rightBotX, groundY);
        } else if (inclineAngle === 0) {
          ctx.moveTo(leftBotX, groundY);
          ctx.lineTo(leftBotX, apexY);
          ctx.lineTo(apexX, apexY);
          ctx.lineTo(rightBotX, groundY);
        } else if (inclineAngle2 === 0) {
          ctx.moveTo(leftBotX, groundY);
          ctx.lineTo(leftBotX, groundY);
          ctx.lineTo(apexX, apexY);
          ctx.lineTo(rightBotX, apexY);
          ctx.lineTo(rightBotX, groundY);
        } else {
          ctx.moveTo(leftBotX, groundY);
          ctx.lineTo(apexX, apexY);
          ctx.lineTo(rightBotX, groundY);
        }
        ctx.closePath();

        const rampGrad = ctx.createLinearGradient(leftBotX, apexY, rightBotX, groundY);
        rampGrad.addColorStop(0, isLight ? '#E0F2FE' : '#1E293B');
        rampGrad.addColorStop(1, isLight ? '#BAE6FD' : '#0F172A');
        ctx.fillStyle = rampGrad;
        ctx.fill();
        ctx.strokeStyle = isLight ? '#0284C7' : '#38BDF8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Ground Base Line
        ctx.beginPath();
        const minGLeft = Math.min(leftBotX, leftTangentX) - 30;
        const maxGRight = Math.max(rightBotX, rightTangentX) + 30;
        ctx.moveTo(minGLeft, groundY);
        ctx.lineTo(maxGRight, groundY);
        ctx.strokeStyle = isLight ? '#94A3B8' : '#475569';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Table legs if angle is 0°
        if (inclineAngle === 0) {
          ctx.beginPath();
          ctx.moveTo(leftBotX + 20, leftTopY);
          ctx.lineTo(leftBotX + 20, groundY);
          ctx.moveTo(apexX - 100, leftTopY);
          ctx.lineTo(apexX - 100, groundY);
          ctx.strokeStyle = isLight ? '#0284C7' : '#38BDF8';
          ctx.lineWidth = 3.5;
          ctx.stroke();
        }
        if (inclineAngle2 === 0) {
          ctx.beginPath();
          ctx.moveTo(rightBotX - 20, rightTopY);
          ctx.lineTo(rightBotX - 20, groundY);
          ctx.moveTo(apexX + 100, rightTopY);
          ctx.lineTo(apexX + 100, groundY);
          ctx.strokeStyle = isLight ? '#0284C7' : '#38BDF8';
          ctx.lineWidth = 3.5;
          ctx.stroke();
        }
      }

      // Angle Arc Curves & Badges
      const baseArcRadius = 50;
      if (inclineAngle > 0 && inclineAngle < 90) {
        ctx.beginPath();
        ctx.arc(leftBotX, groundY, baseArcRadius, 0, -rad1, true);
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(leftBotX, groundY);
        ctx.arc(leftBotX, groundY, baseArcRadius, 0, -rad1, true);
        ctx.closePath();
        ctx.fillStyle = isLight ? 'rgba(217, 119, 6, 0.2)' : 'rgba(245, 158, 11, 0.25)';
        ctx.fill();

        drawPillBadge(
          ctx,
          `θ₁ = ${inclineAngle.toFixed(0)}°`,
          leftBotX + baseArcRadius + 22,
          groundY - 14,
          '#D97706',
          isLight ? '#FEF3C7' : '#451A03',
          '#F59E0B'
        );
      }

      if (inclineAngle2 > 0 && inclineAngle2 < 90) {
        ctx.beginPath();
        ctx.moveTo(rightBotX, groundY);
        ctx.arc(rightBotX, groundY, baseArcRadius, -Math.PI, -(Math.PI - rad2), false);
        ctx.closePath();
        ctx.fillStyle = isLight ? 'rgba(217, 119, 6, 0.2)' : 'rgba(245, 158, 11, 0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(rightBotX, groundY, baseArcRadius, -Math.PI, -(Math.PI - rad2), false);
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        drawPillBadge(
          ctx,
          `θ₂ = ${inclineAngle2.toFixed(0)}°`,
          rightBotX - baseArcRadius - 22,
          groundY - 14,
          '#D97706',
          isLight ? '#FEF3C7' : '#451A03',
          '#F59E0B'
        );
      }

      // Apex Pulley Wheel & Tension Law Label
      drawPulleyWheel(ctx, apexX, pulleyCenterY, R, (y1 * pxlPerMeter) / R, 'Apex Pulley');
      const pulleyBadgeText = params.mPulley === 0
        ? `Law: T₁ = T₂ = T (${state.t1.toFixed(0)}N)`
        : `T₁ = ${state.t1.toFixed(0)}N, T₂ = ${state.t2.toFixed(0)}N`;

      drawPillBadge(
        ctx,
        pulleyBadgeText,
        apexX,
        pulleyCenterY - R - 16,
        '#059669',
        isLight ? '#D1FAE5' : '#064E3B',
        '#10B981'
      );

      // Continuous Wire Alignment passing through block center coordinates
      const lastLeftDist = d1 + (leftMasses.length - 1) * (massH + 8);
      const lastRightDist = d2 + (rightMasses.length - 1) * (massH + 8);

      const wire1EndX = leftTangentX + lastLeftDist * dir1.x;
      const wire1EndY = leftTangentY + lastLeftDist * dir1.y;

      const wire2EndX = rightTangentX + lastRightDist * dir2.x;
      const wire2EndY = rightTangentY + lastRightDist * dir2.y;

      const leftArcAngle = -Math.PI / 2 - rad1;
      const rightArcAngle = -Math.PI / 2 + rad2;

      ctx.beginPath();
      ctx.moveTo(wire1EndX, wire1EndY);
      ctx.lineTo(leftTangentX, leftTangentY);
      ctx.arc(apexX, pulleyCenterY, R, leftArcAngle, rightArcAngle, false);
      ctx.lineTo(wire2EndX, wire2EndY);
      ctx.strokeStyle = ropeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Left Stacked Mass Blocks (Normal vector offset resting 100% flush ON TOP of inclined surface)
      leftMasses.forEach((mVal, i) => {
        const dist_i = d1 + i * (massH + 8);
        const pinX = leftTangentX + dist_i * dir1.x;
        const pinY = leftTangentY + dist_i * dir1.y;
        const cX = pinX + (massH / 2) * norm1.x;
        const cY = pinY + (massH / 2) * norm1.y;

        ctx.save();
        ctx.translate(cX, cY);
        ctx.rotate(-rad1);
        drawMassBox(ctx, 0, -massH / 2, massW, massH, `mL${i + 1}`, mVal, isHov1 && i === 0, '#0284C7', '#38BDF8');
        ctx.restore();

        // Pin connector dot at string line
        ctx.beginPath();
        ctx.arc(pinX, pinY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isLight ? '#0284C7' : '#38BDF8';
        ctx.fill();

        // Draw vectors / components if enabled in display options
        if (display.showVectors || display.showComponents || display.showFrictionForce) {
          drawInclineForceComponents(
            ctx,
            pinX,
            pinY,
            massW,
            massH,
            mVal,
            state.t1,
            inclineAngle,
            params.surfaceFriction1 ?? params.surfaceFriction ?? 0,
            gravity,
            'left',
            isLight,
            display.showVectors,
            display.showComponents,
            display.showFrictionForce ?? true,
            cX,
            cY
          );
        }
      });

      // Right Stacked Mass Blocks (Normal vector offset resting 100% flush ON TOP of inclined surface)
      rightMasses.forEach((mVal, i) => {
        const dist_i = d2 + i * (massH + 8);
        const pinX = rightTangentX + dist_i * dir2.x;
        const pinY = rightTangentY + dist_i * dir2.y;
        const cX = pinX + (massH / 2) * norm2.x;
        const cY = pinY + (massH / 2) * norm2.y;

        ctx.save();
        ctx.translate(cX, cY);
        ctx.rotate(rad2);
        drawMassBox(ctx, 0, -massH / 2, massW, massH, `mR${i + 1}`, mVal, isHov2 && i === 0, '#E11D48', '#FB7185');
        ctx.restore();

        // Pin connector dot at string line
        ctx.beginPath();
        ctx.arc(pinX, pinY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isLight ? '#E11D48' : '#FB7185';
        ctx.fill();

        // Draw vectors / components if enabled in display options
        if (display.showVectors || display.showComponents || display.showFrictionForce) {
          drawInclineForceComponents(
            ctx,
            pinX,
            pinY,
            massW,
            massH,
            mVal,
            state.t2,
            inclineAngle2,
            params.surfaceFriction2 ?? params.surfaceFriction ?? 0,
            gravity,
            'right',
            isLight,
            display.showVectors,
            display.showComponents,
            display.showFrictionForce ?? true,
            cX,
            cY
          );
        }
      });
    } else if (mode === 'block_tackle_21') {
      // 2:1 Block and Tackle System
      const R = 28;
      const topP1X = centerX;
      const topP1Y = centerY;
      const m2PixelY = centerY + y2 * pxlPerMeter;
      const bottomP2X = centerX;
      const bottomP2Y = m2PixelY - 30; // Moving pulley attached above m2 load!
      const anchorX = centerX - R;

      const rotAngle1 = (y1 * pxlPerMeter) / R;
      const rotAngle2 = (y2 * pxlPerMeter) / R;

      // Top Fixed Pulley P1
      drawPulleyWheel(ctx, topP1X, topP1Y, R, rotAngle1, 'Fixed P1');
      // Bottom Moving Pulley P2
      drawPulleyWheel(ctx, bottomP2X, bottomP2Y, R, rotAngle2, 'Moving P2 (2:1)');

      // Anchor at ceiling
      ctx.fillStyle = isLight ? '#0284C7' : '#00F2FE';
      ctx.fillRect(anchorX - 4, 12, 8, 12);

      // Moving Pulley Carrier Frame holding m2
      ctx.strokeStyle = isLight ? '#E11D48' : '#FB7185';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bottomP2X, bottomP2Y);
      ctx.lineTo(bottomP2X, m2PixelY);
      ctx.stroke();

      // Rope Route: Anchor -> down around P2 -> up around P1 -> down to m1 Effort
      const m1X = centerX + R;
      const m1PixelY = centerY + y1 * pxlPerMeter;

      ctx.beginPath();
      ctx.moveTo(anchorX, 24);
      ctx.lineTo(anchorX, bottomP2Y);
      ctx.arc(bottomP2X, bottomP2Y, R, Math.PI, 0, true); // Under bottom pulley
      ctx.lineTo(centerX + R, topP1Y);
      ctx.arc(topP1X, topP1Y, R, 0, Math.PI, true); // Over top pulley
      ctx.lineTo(m1X, m1PixelY);

      ctx.strokeStyle = ropeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Masses
      drawMassBox(ctx, m1X, m1PixelY, massW, massH, 'm₁ (Effort)', m1, isHov1, '#0284C7', '#38BDF8');
      drawMassBox(ctx, centerX, m2PixelY, massW + 10, massH, 'm₂ (Load)', m2, isHov2, '#E11D48', '#FB7185');

      if (display.showVectors) {
        drawVectors(ctx, m1X, m1PixelY, massW, massH, m1, state.t1, gravity);
        drawVectors(ctx, centerX, m2PixelY, massW + 10, massH, m2, state.t2, gravity);
      }
    } else if (mode === 'simple_41') {
      // 4:1 Simple Pulley System
      const R = 22;
      const m2PixelY = centerY + y2 * pxlPerMeter;
      const bottomCarrierY = m2PixelY - 35;

      const topP2X = centerX;
      const topP2Y = centerY;

      const botP1X = centerX - 32;
      const botP3X = centerX + 32;

      const rotAngle = (y1 * pxlPerMeter) / R;

      // Pulleys
      drawPulleyWheel(ctx, topP2X, topP2Y, R, rotAngle, 'Fixed Top P2');
      drawPulleyWheel(ctx, botP1X, bottomCarrierY, R, rotAngle, 'Moving P1');
      drawPulleyWheel(ctx, botP3X, bottomCarrierY, R, rotAngle, 'Moving P3');

      // Carrier Yoke
      ctx.strokeStyle = isLight ? '#E11D48' : '#FB7185';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(botP1X, bottomCarrierY);
      ctx.lineTo(botP3X, bottomCarrierY);
      ctx.moveTo(centerX, bottomCarrierY);
      ctx.lineTo(centerX, m2PixelY);
      ctx.stroke();

      // Ceiling anchor left
      const anchorX = centerX - 54;
      ctx.fillStyle = isLight ? '#0284C7' : '#00F2FE';
      ctx.fillRect(anchorX - 3, 12, 6, 12);

      // Rope route (4 supporting strands)
      const m1X = centerX + 54;
      const m1PixelY = centerY + y1 * pxlPerMeter;

      ctx.beginPath();
      ctx.moveTo(anchorX, 24);
      ctx.lineTo(anchorX, bottomCarrierY);
      ctx.arc(botP1X, bottomCarrierY, R, Math.PI, 0, true);
      ctx.lineTo(topP2X - R, topP2Y);
      ctx.arc(topP2X, topP2Y, R, Math.PI, 0, false);
      ctx.lineTo(botP3X - R, bottomCarrierY);
      ctx.arc(botP3X, bottomCarrierY, R, Math.PI, 0, true);
      ctx.lineTo(m1X, m1PixelY);

      ctx.strokeStyle = ropeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Masses
      drawMassBox(ctx, m1X, m1PixelY, massW, massH, 'm₁ (Effort)', m1, isHov1, '#0284C7', '#38BDF8');
      drawMassBox(ctx, centerX, m2PixelY, massW + 14, massH, 'm₂ (Load)', m2, isHov2, '#E11D48', '#FB7185');

      if (display.showVectors) {
        drawVectors(ctx, m1X, m1PixelY, massW, massH, m1, state.t1, gravity);
        drawVectors(ctx, centerX, m2PixelY, massW + 14, massH, m2, state.t2, gravity);
      }
    } else if (mode === 'compound_61') {
      // 6:1 Compound V-on-Z System
      const R = 20;
      const m2PixelY = centerY + y2 * pxlPerMeter;
      const m1PixelY = centerY + y1 * pxlPerMeter;

      const pTop1 = centerX - 35;
      const pTop2 = centerX + 15;

      const pBot1 = centerX - 35;
      const pBot2 = centerX + 15;
      const botY = m2PixelY - 30;

      const rotAngle = (y1 * pxlPerMeter) / R;

      drawPulleyWheel(ctx, pTop1, centerY, R, rotAngle, 'Fixed P1');
      drawPulleyWheel(ctx, pTop2, centerY, R, rotAngle, 'Fixed P2');

      drawPulleyWheel(ctx, pBot1, botY, R, rotAngle, 'Moving P3');
      drawPulleyWheel(ctx, pBot2, botY, R, rotAngle, 'Moving P4');

      // Lower Carrier Yoke
      ctx.strokeStyle = isLight ? '#E11D48' : '#FB7185';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pBot1, botY);
      ctx.lineTo(pBot2, botY);
      ctx.moveTo(centerX - 10, botY);
      ctx.lineTo(centerX - 10, m2PixelY);
      ctx.stroke();

      // Multi-strand reaved ropes (6:1)
      const m1X = centerX + 45;

      ctx.beginPath();
      ctx.moveTo(pTop1 - R, 12);
      ctx.lineTo(pTop1 - R, botY);
      ctx.arc(pBot1, botY, R, Math.PI, 0, true);
      ctx.lineTo(pTop1 + R, centerY);
      ctx.arc(pTop1, centerY, R, 0, Math.PI, true);
      ctx.lineTo(pTop2 - R, botY);
      ctx.arc(pBot2, botY, R, Math.PI, 0, true);
      ctx.lineTo(pTop2 + R, centerY);
      ctx.arc(pTop2, centerY, R, 0, Math.PI, true);
      ctx.lineTo(m1X, m1PixelY);

      ctx.strokeStyle = ropeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      drawMassBox(ctx, m1X, m1PixelY, massW, massH, 'm₁ (Effort)', m1, isHov1, '#0284C7', '#38BDF8');
      drawMassBox(ctx, centerX - 10, m2PixelY, massW + 16, massH, 'm₂ (Load)', m2, isHov2, '#E11D48', '#FB7185');

      if (display.showVectors) {
        drawVectors(ctx, m1X, m1PixelY, massW, massH, m1, state.t1, gravity);
        drawVectors(ctx, centerX - 10, m2PixelY, massW + 16, massH, m2, state.t2, gravity);
      }
    } else if (mode === 'mariner_71') {
      // 7:1 Double Mariner System
      const R = 20;
      const m2PixelY = centerY + y2 * pxlPerMeter;
      const m1PixelY = centerY + y1 * pxlPerMeter;

      const pTop1 = centerX - 40;
      const pTop2 = centerX;

      const pMid1 = centerX - 20;
      const midY = centerY + (y2 * pxlPerMeter) * 0.4;

      const pBot1 = centerX - 40;
      const pBot2 = centerX;
      const botY = m2PixelY - 30;

      const rotAngle = (y1 * pxlPerMeter) / R;

      drawPulleyWheel(ctx, pTop1, centerY, R, rotAngle, 'Top P1');
      drawPulleyWheel(ctx, pTop2, centerY, R, rotAngle, 'Top P2');
      drawPulleyWheel(ctx, pMid1, midY, R, rotAngle, 'Mariner P3');
      drawPulleyWheel(ctx, pBot1, botY, R, rotAngle, 'Bottom P4');
      drawPulleyWheel(ctx, pBot2, botY, R, rotAngle, 'Bottom P5');

      // Lower Carrier Yoke
      ctx.strokeStyle = isLight ? '#E11D48' : '#FB7185';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pBot1, botY);
      ctx.lineTo(pBot2, botY);
      ctx.moveTo(centerX - 20, botY);
      ctx.lineTo(centerX - 20, m2PixelY);
      ctx.stroke();

      const m1X = centerX + 40;

      // 7:1 Laced Tackle Ropes
      ctx.beginPath();
      ctx.moveTo(pTop1 - R, 12);
      ctx.lineTo(pTop1 - R, botY);
      ctx.arc(pBot1, botY, R, Math.PI, 0, true);
      ctx.lineTo(pTop1 + R, centerY);
      ctx.arc(pTop1, centerY, R, 0, Math.PI, true);
      ctx.lineTo(pMid1 - R, midY);
      ctx.arc(pMid1, midY, R, Math.PI, 0, true);
      ctx.lineTo(pTop2 - R, centerY);
      ctx.arc(pTop2, centerY, R, Math.PI, 0, false);
      ctx.lineTo(pBot2 - R, botY);
      ctx.arc(pBot2, botY, R, Math.PI, 0, true);
      ctx.lineTo(m1X, m1PixelY);

      ctx.strokeStyle = ropeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      drawMassBox(ctx, m1X, m1PixelY, massW, massH, 'm₁ (Effort)', m1, isHov1, '#0284C7', '#38BDF8');
      drawMassBox(ctx, centerX - 20, m2PixelY, massW + 18, massH, 'm₂ (Load)', m2, isHov2, '#E11D48', '#FB7185');

      if (display.showVectors) {
        drawVectors(ctx, m1X, m1PixelY, massW, massH, m1, state.t1, gravity);
        drawVectors(ctx, centerX - 20, m2PixelY, massW + 18, massH, m2, state.t2, gravity);
      }
    } else {
      // --- INCLINED PLANE ATWOOD MODE ---
      const rad = (inclineAngle * Math.PI) / 180;

      let baseWidth = 360;
      let rampHeight = baseWidth * Math.tan(rad);
      const maxHeight = Math.min(height - 220, 280);

      if (rampHeight > maxHeight) {
        rampHeight = maxHeight;
        baseWidth = rampHeight / Math.tan(rad);
      }

      const rampBaseY = Math.min(height - 90, centerY + 260);
      const rampBaseX = centerX - baseWidth / 2 - 20;
      const rampRightX = rampBaseX + baseWidth;
      const rampTopX = rampRightX;
      const rampTopY = rampBaseY - rampHeight;

      // Ramp Structure Fill
      const rampGrad = ctx.createLinearGradient(rampBaseX, rampTopY, rampRightX, rampBaseY);
      if (isLight) {
        rampGrad.addColorStop(0, '#E0F2FE');
        rampGrad.addColorStop(1, '#BAE6FD');
      } else {
        rampGrad.addColorStop(0, '#1E293B');
        rampGrad.addColorStop(1, '#0F172A');
      }

      ctx.beginPath();
      ctx.moveTo(rampBaseX, rampBaseY);
      ctx.lineTo(rampTopX, rampTopY);
      ctx.lineTo(rampRightX, rampBaseY);
      ctx.closePath();

      ctx.fillStyle = rampGrad;
      ctx.fill();
      ctx.strokeStyle = isLight ? '#0284C7' : '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Angle Arc
      const arcRadius = Math.min(45, baseWidth * 0.25);
      ctx.beginPath();
      ctx.arc(rampBaseX, rampBaseY, arcRadius, -rad, 0);
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#D97706';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`θ = ${inclineAngle.toFixed(0)}°`, rampBaseX + arcRadius + 8, rampBaseY - 12);

      // Top Vertex Pulley
      const pRadius = 22;
      const pulleyCenterX = rampTopX;
      const pulleyCenterY = rampTopY - pRadius;
      const rotAngle = (y1 * 55) / pRadius;

      drawPulleyWheel(ctx, pulleyCenterX, pulleyCenterY, pRadius, rotAngle, 'Top Pulley');

      // Mass 1 on Incline Surface
      const d1 = 40 + y1 * 55;
      const m1X = rampTopX - d1 * Math.cos(rad);
      const m1Y = rampTopY + d1 * Math.sin(rad);

      const boxW = 46;
      const boxH = 34;

      ctx.save();
      ctx.translate(m1X, m1Y);
      ctx.rotate(-rad);

      ctx.fillStyle = isHov1 ? '#0284C7' : '#0369A1';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.fillRect(-boxW / 2, -boxH, boxW, boxH);
      ctx.strokeRect(-boxW / 2, -boxH, boxW, boxH);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`m₁`, 0, -boxH + 14);
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`${m1.toFixed(1)}kg`, 0, -boxH + 27);
      ctx.restore();

      // Mass 2 Hanging Vertically
      const m2X = pulleyCenterX + pRadius;
      const m2Y = pulleyCenterY + 25 + y2 * 55;

      drawMassBox(ctx, m2X, m2Y, boxW, boxH + 8, 'm₂', m2, isHov2, '#E11D48', '#FB7185');

      // Ropes
      ctx.beginPath();
      ctx.moveTo(m1X, m1Y - boxH / 2 * Math.cos(rad));
      ctx.lineTo(pulleyCenterX - pRadius * Math.sin(rad), pulleyCenterY - pRadius * Math.cos(rad));
      ctx.moveTo(m2X, pulleyCenterY);
      ctx.lineTo(m2X, m2Y);

      ctx.strokeStyle = ropeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Vectors for Incline
      if (display.showVectors) {
        const w1Len = m1 * gravity * 1.5;
        drawArrow(ctx, m1X, m1Y - boxH / 2, m1X, m1Y - boxH / 2 + w1Len, '#E11D48', `m₁g (${(m1 * gravity).toFixed(0)}N)`);

        const w2Len = m2 * gravity * 1.5;
        drawArrow(ctx, m2X, m2Y + boxH + 8, m2X, m2Y + boxH + 8 + w2Len, '#E11D48', `m₂g (${(m2 * gravity).toFixed(0)}N)`);

        const t1Len = state.t1 * 1.5;
        drawArrow(ctx, m1X, m1Y - boxH / 2, m1X + t1Len * Math.cos(rad), m1Y - boxH / 2 - t1Len * Math.sin(rad), ropeColor, `T₁ (${state.t1.toFixed(0)}N)`);
      }
    }
  }, [m1, m2, y1, y2, state.v, state.t1, state.t2, display, hoveredMass, isDragging, mode, inclineAngle, gravity, isLight]);

  // Helper function to draw mass box
  const drawMassBox = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    valKg: number,
    isHovered: boolean,
    fillColor: string,
    strokeColor: string
  ) => {
    ctx.save();
    const boxW = Math.max(52, w);
    const boxH = Math.max(48, h);

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isHovered ? 3 : 2;

    if (isHovered) {
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 10;
    }

    ctx.fillRect(x - boxW / 2, y, boxW, boxH);
    ctx.strokeRect(x - boxW / 2, y, boxW, boxH);

    // Centered Text Layout (Line 1: Mass Name, Line 2: Numeric Value)
    const centerY = y + boxH / 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(label, x, centerY - 8);

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillText(`${valKg.toFixed(1)}kg`, x, centerY + 8);

    ctx.restore();
  };

  // Helper function to draw vectors on vertical masses
  const drawVectors = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    massKg: number,
    tensionN: number,
    g: number
  ) => {
    const scale = 1.5;
    const wVal = massKg * g;
    const wLen = Math.min(120, Math.max(55, wVal * scale));
    const tLen = Math.min(120, Math.max(55, tensionN * scale));

    const badgesToDraw: BadgeItem[] = [];

    // Weight Arrow (Down) - Crimson Red #EF4444
    drawArrowOnly(ctx, x, y + h, x, y + h + wLen, '#EF4444');
    badgesToDraw.push({
      text: `mg (${wVal.toFixed(0)}N)`,
      x,
      y: y + h + wLen + 16,
      color: '#EF4444',
    });

    // Tension Arrow (Up) - Electric Cyan #06B6D4
    if (tensionN > 0.1) {
      drawArrowOnly(ctx, x, y, x, y - tLen, '#06B6D4');
      badgesToDraw.push({
        text: `T (${tensionN.toFixed(0)}N)`,
        x,
        y: y - tLen - 16,
        color: '#06B6D4',
      });
    }

    drawBadgeListWithAntiCollision(ctx, badgesToDraw);
  };

  // Helper function to draw resolved force components on inclined ramps
  const drawInclineForceComponents = (
    ctx: CanvasRenderingContext2D,
    surfaceX: number,
    surfaceY: number,
    w: number,
    h: number,
    massKg: number,
    tensionN: number,
    angleDeg: number,
    frictionCoeff: number,
    g: number,
    side: 'left' | 'right',
    isLight: boolean,
    showVectors: boolean,
    showComponents: boolean,
    showFrictionForce: boolean = true,
    wireStartX?: number,
    wireStartY?: number
  ) => {
    const rad = (angleDeg * Math.PI) / 180;
    const scale = 1.85;

    // Unit normal vector pointing OUT of ramp into air
    const nX = side === 'left' ? -Math.sin(rad) : Math.sin(rad);
    const nY = -Math.cos(rad);

    // Unit down-slope vector along ramp surface
    const dX = side === 'left' ? -Math.cos(rad) : Math.cos(rad);
    const dY = Math.sin(rad);

    // Center of mass (CM) location in world coordinates
    const cmX = surfaceX + (h / 2) * nX;
    const cmY = surfaceY + (h / 2) * nY;

    const wVal = massKg * g;
    const badgesToDraw: BadgeItem[] = [];

    // 1. PRIMARY FORCE VECTORS (Weight mg & String Tension T)
    if (showVectors) {
      // Direct Weight Gravity (mg) straight down: Crimson Red #EF4444
      const wLen = Math.min(120, Math.max(55, wVal * scale));
      const mgEndX = cmX;
      const mgEndY = cmY + wLen;
      drawArrowOnly(ctx, cmX, cmY, mgEndX, mgEndY, '#EF4444');
      badgesToDraw.push({
        text: `mg (${wVal.toFixed(0)}N)`,
        x: mgEndX,
        y: mgEndY + 16,
        color: '#EF4444',
      });

      // Tension T (Points UP the slope towards apex pulley directly ALONG the wire): Electric Cyan #06B6D4
      const tVal = tensionN;
      if (tVal > 0.1) {
        const tLen = Math.min(120, Math.max(55, tVal * scale));
        const tStartX = wireStartX !== undefined ? wireStartX : cmX;
        const tStartY = wireStartY !== undefined ? wireStartY : cmY;

        // Up-slope direction towards pulley along the wire
        const tDirX = side === 'left' ? Math.cos(rad) : -Math.cos(rad);
        const tDirY = -Math.sin(rad);

        const tEndX = tStartX + tLen * tDirX;
        const tEndY = tStartY + tLen * tDirY;

        drawArrowOnly(ctx, tStartX, tStartY, tEndX, tEndY, '#06B6D4');
        badgesToDraw.push({
          text: `T (${tVal.toFixed(0)}N)`,
          x: tEndX + 16 * tDirX,
          y: tEndY + 16 * tDirY,
          color: '#06B6D4',
        });
      }
    }

    // 2. RESOLVED WEIGHT COMPONENTS (mg sin θ, mg cos θ, Normal N)
    if (showComponents) {
      // Parallel Down-slope Weight Component (mg sin θ): Amber Gold #F59E0B
      const mgSinVal = wVal * Math.sin(rad);
      if (mgSinVal > 0.1) {
        const mgSinLen = Math.min(110, Math.max(55, mgSinVal * scale));
        const sinEndX = cmX + mgSinLen * dX;
        const sinEndY = cmY + mgSinLen * dY;
        drawArrowOnly(ctx, cmX, cmY, sinEndX, sinEndY, '#F59E0B');
        badgesToDraw.push({
          text: `mg sin θ (${mgSinVal.toFixed(0)}N)`,
          x: sinEndX + 16 * nX,
          y: sinEndY + 16 * nY,
          color: '#F59E0B',
        });
      }

      // Perpendicular Into-slope Weight Component (mg cos θ): Neon Purple #A855F7
      const mgCosVal = wVal * Math.cos(rad);
      if (mgCosVal > 0.1) {
        const mgCosLen = Math.min(110, Math.max(55, mgCosVal * scale));
        const cosEndX = cmX - mgCosLen * nX;
        const cosEndY = cmY - mgCosLen * nY;
        drawArrowOnly(ctx, cmX, cmY, cosEndX, cosEndY, '#A855F7');
        badgesToDraw.push({
          text: `mg cos θ (${mgCosVal.toFixed(0)}N)`,
          x: cosEndX - 16 * nX,
          y: cosEndY - 16 * nY,
          color: '#A855F7',
        });
      }

      // Normal Force N (Perpendicular OUT of slope): Bright Emerald Green #10B981
      const nVal = mgCosVal;
      if (nVal > 0.1) {
        const nLen = Math.min(110, Math.max(55, nVal * scale));
        const nEndX = cmX + nLen * nX;
        const nEndY = cmY + nLen * nY;
        drawArrowOnly(ctx, cmX, cmY, nEndX, nEndY, '#10B981');
        badgesToDraw.push({
          text: `N (${nVal.toFixed(0)}N)`,
          x: nEndX + 16 * nX,
          y: nEndY + 16 * nY,
          color: '#10B981',
        });
      }

      // Geometric Angle Arc θ between straight down (mg) and into-slope (mg cos θ)
      const cmArcR = 24;
      ctx.save();
      ctx.beginPath();
      if (side === 'left') {
        ctx.arc(cmX, cmY, cmArcR, Math.PI / 2 - rad, Math.PI / 2, false);
      } else {
        ctx.arc(cmX, cmY, cmArcR, Math.PI / 2, Math.PI / 2 + rad, false);
      }
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([3, 2]);
      ctx.stroke();
      ctx.setLineDash([]);

      // θ label near arc
      ctx.fillStyle = '#A855F7';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const labelAngle = side === 'left' ? Math.PI / 2 - rad / 2 : Math.PI / 2 + rad / 2;
      const lx = cmX + (cmArcR + 10) * Math.cos(labelAngle);
      const ly = cmY + (cmArcR + 10) * Math.sin(labelAngle);
      ctx.fillText('θ', lx, ly);
      ctx.restore();
    }

    // 3. SURFACE FRICTION FORCE (f_k = μ * N): Amber Gold #F59E0B
    if (showFrictionForce) {
      const nVal = wVal * Math.cos(rad);
      const fkVal = frictionCoeff * nVal;
      if (fkVal > 0.1) {
        const fkLen = Math.min(95, Math.max(45, fkVal * scale * 1.5));
        const fkEndX = cmX + fkLen * dX;
        const fkEndY = cmY + fkLen * dY;
        drawArrowOnly(ctx, cmX, cmY, fkEndX, fkEndY, '#F59E0B');
        badgesToDraw.push({
          text: `f_k (${fkVal.toFixed(0)}N)`,
          x: fkEndX - 16 * nX,
          y: fkEndY - 16 * nY,
          color: '#F59E0B',
        });
      }
    }

    // Run anti-collision engine and draw all badges
    drawBadgeListWithAntiCollision(ctx, badgesToDraw);
  };

  // Resize listener for Canvas responsive scaling
  useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      draw();
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [draw]);

  // Redraw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

  // Interactive mouse handlers to drag mass initial positions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.isRunning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = canvas.width / (2 * (window.devicePixelRatio || 1));
    const centerY = 100;
    const rope1X = centerX - 36;
    const rope2X = centerX + 36;
    const m1PixelY = centerY + y1 * 75;
    const m2PixelY = centerY + y2 * 75;

    if (Math.abs(mouseX - rope1X) < 30 && mouseY >= m1PixelY && mouseY <= m1PixelY + 54) {
      setIsDragging('m1');
      setDragStartY(mouseY - m1PixelY);
    } else if (Math.abs(mouseX - rope2X) < 30 && mouseY >= m2PixelY && mouseY <= m2PixelY + 54) {
      setIsDragging('m2');
      setDragStartY(mouseY - m2PixelY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = canvas.width / (2 * (window.devicePixelRatio || 1));
    const centerY = 100;
    const rope1X = centerX - 36;
    const rope2X = centerX + 36;
    const m1PixelY = centerY + y1 * 75;
    const m2PixelY = centerY + y2 * 75;

    if (Math.abs(mouseX - rope1X) < 30 && mouseY >= m1PixelY && mouseY <= m1PixelY + 54) {
      setHoveredMass('m1');
    } else if (Math.abs(mouseX - rope2X) < 30 && mouseY >= m2PixelY && mouseY <= m2PixelY + 54) {
      setHoveredMass('m2');
    } else {
      setHoveredMass(null);
    }

    if (isDragging) {
      const newPixelY = Math.max(centerY + 20, Math.min(canvas.height / (window.devicePixelRatio || 1) - 100, mouseY - dragStartY));
      const newMeters = (newPixelY - centerY) / 75;

      if (isDragging === 'm1') {
        const delta = newMeters - y1;
        onUpdatePositions(newMeters, y2 - delta);
      } else {
        const delta = newMeters - y2;
        onUpdatePositions(y1 - delta, newMeters);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 h-full overflow-hidden select-none transition-colors duration-200 ${
        isLight ? 'bg-[#F8FAFC]' : 'bg-[#0B0E14]'
      }`}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full h-full block ${isDragging ? 'cursor-grabbing' : hoveredMass ? 'cursor-grab' : 'cursor-default'}`}
      />

      {/* Watermark in bottom left */}
      <div className={`absolute bottom-4 left-4 text-[9px] font-mono uppercase tracking-[3px] pointer-events-none z-10 font-bold ${
        isLight ? 'text-[#94A3B8]' : 'text-[#4A5568]'
      }`}>
        Dynamic Physics Core // Udvash Lab v4.2
      </div>

      {/* Floating Active Equations Panel */}
      <EquationPanel params={params} state={state} display={display} />

      {/* Floating Real-time State Probe */}
      <StateProbe state={state} params={params} display={display} />

      {/* Floating Energy Conservation Stack Bar */}
      {display.showEnergyBars && <EnergyBar params={params} state={state} display={display} />}
    </div>
  );
};
