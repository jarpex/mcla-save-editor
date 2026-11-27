(() => {
  "use strict";

  const CAR_PERF_WEIGHTS = [
    { acc: 1 / 8, spd: 0,     hnd: 0,     dynoY: 2 / 14.5 },   // 0 Exhaust system
    { acc: 1 / 8, spd: 0,     hnd: 0,     dynoY: 2 / 14.5 },   // 1 Headers
    { acc: 1 / 8, spd: 0,     hnd: 0,     dynoY: 2 / 14.5 },   // 2 Cold air intake
    { acc: 1 / 4, spd: 1 / 6, hnd: 0,     dynoY: 3.5 / 14.5 }, // 3 Forced induction
    { acc: 1 / 4, spd: 1 / 4, hnd: 0,     dynoY: 4 / 14.5 },   // 4 Engine upgrade
    { acc: 1 / 8, spd: 1 / 4, hnd: 0,     dynoY: 1 / 14.5 },   // 5 Electronics (also shifts rev limiter X)
    { acc: 0,     spd: 0,     hnd: 0,     dynoY: 0 },          // 6 Nitrous
    { acc: 0,     spd: 0,     hnd: 0,     dynoY: 0 },          // 7 Clutch
    { acc: 0,     spd: 1 / 3, hnd: 0,     dynoY: 0 },          // 8 Gear kit
    { acc: 0,     spd: 0,     hnd: 1 / 4, dynoY: 0 },          // 9 Shocks/springs
    { acc: 0,     spd: 0,     hnd: 1 / 4, dynoY: 0 },          // 10 Swaybars
    { acc: 0,     spd: 0,     hnd: 1 / 4, dynoY: 0 },          // 11 Brakes
    { acc: 0,     spd: 0,     hnd: 1 / 4, dynoY: 0 }           // 12 Tires
  ];

  /* Stock reference is the 1988 Scirocco (refPeakY = 2.204). */
  const DYNO_CONSTANTS = {
    gridCols: 6,
    gridRows: 5,
    stockPeakX: 3.60,
    maxShiftX: 0.90,
    dropWidthX: 0.45,
    refPeakY: 2.204,
    refTorqueY0: 1.40,
    refHpY0: 0.90,
    refShelfY: 1.00,
    anchorY0: 0.40,
    torqueExp: 0.85,
    hpExp: 1.15,
    sampleSteps: 48
  };

  const getDynoPlotRect = () => ({ x: 0, y: 0, width: 260, height: 70 });

  function calcCarPerformanceStats(stock, max, levels, maxLevel) {
    const safeMaxLevel = Math.max(1, Number(maxLevel) || 1);
    let shareAcc = 0;
    let shareSpd = 0;
    let shareHnd = 0;

    for (let i = 0; i < CAR_PERF_WEIGHTS.length; i++) {
      const lvl = Math.min(safeMaxLevel, Math.max(0, Number(levels[i]) || 0));
      if (lvl === 0) continue;
      const ratio = lvl / safeMaxLevel;
      const w = CAR_PERF_WEIGHTS[i];
      shareAcc += w.acc * ratio;
      shareSpd += w.spd * ratio;
      shareHnd += w.hnd * ratio;
    }

    const pack = (s, mx, exact) => ({ stock: s, max: mx, exact, value: Math.round(exact) });
    return {
      acc: pack(stock.acc, max.acc, stock.acc + (max.acc - stock.acc) * shareAcc),
      spd: pack(stock.spd, max.spd, stock.spd + (max.spd - stock.spd) * shareSpd),
      hnd: pack(stock.hnd, max.hnd, stock.hnd + (max.hnd - stock.hnd) * shareHnd)
    };
  }

  function calcDynoModel(stock, max, levels, maxLevel) {
    const safeMaxLevel = Math.max(1, Number(maxLevel) || 1);
    const stockPowerSum = (Number(stock.acc) || 0) + (Number(stock.spd) || 0);
    const deltaPowerSum = Math.max(0, ((Number(max.acc) || 0) - stock.acc) + ((Number(max.spd) || 0) - stock.spd));

    const basePeakY = 1.25 + 0.018 * stockPowerSum;
    const maxDeltaY = stockPowerSum > 0 ? basePeakY * 1.09 * (deltaPowerSum / stockPowerSum) : 0;

    let shareY = 0;
    for (let i = 0; i < CAR_PERF_WEIGHTS.length; i++) {
      const lvl = Math.min(safeMaxLevel, Math.max(0, Number(levels[i]) || 0));
      if (lvl === 0) continue;
      shareY += CAR_PERF_WEIGHTS[i].dynoY * (lvl / safeMaxLevel);
    }

    const elecLevel = Math.min(safeMaxLevel, Math.max(0, Number(levels[5]) || 0));
    const xPeak = DYNO_CONSTANTS.stockPeakX + DYNO_CONSTANTS.maxShiftX * (elecLevel / safeMaxLevel);
    const yPeak = basePeakY + maxDeltaY * shareY;

    const baseScale = basePeakY / DYNO_CONSTANTS.refPeakY;
    const tuneScaleY = basePeakY > 0 ? yPeak / basePeakY : 1;
    const totalScaleY = baseScale * tuneScaleY;

    const yTorque0 = DYNO_CONSTANTS.anchorY0 + (DYNO_CONSTANTS.refTorqueY0 - DYNO_CONSTANTS.anchorY0) * totalScaleY;
    const yHp0 = DYNO_CONSTANTS.anchorY0 + (DYNO_CONSTANTS.refHpY0 - DYNO_CONSTANTS.anchorY0) * totalScaleY;
    const yShelf = DYNO_CONSTANTS.refShelfY * totalScaleY;

    const evalCurveY = (x, y0, p) => {
      if (x <= xPeak) {
        const t = xPeak > 0 ? Math.max(0, x / xPeak) : 0;
        return y0 + (yPeak - y0) * Math.pow(t, p);
      }
      const dropEnd = xPeak + DYNO_CONSTANTS.dropWidthX;
      if (x <= dropEnd) {
        return yPeak - (yPeak - yShelf) * ((x - xPeak) / DYNO_CONSTANTS.dropWidthX);
      }
      return yShelf;
    };

    const torquePoints = [];
    const hpPoints = [];
    const steps = DYNO_CONSTANTS.sampleSteps;
    for (let s = 0; s <= steps; s++) {
      const x = (xPeak * s) / steps;
      torquePoints.push({ x, y: evalCurveY(x, yTorque0, DYNO_CONSTANTS.torqueExp) });
      hpPoints.push({ x, y: evalCurveY(x, yHp0, DYNO_CONSTANTS.hpExp) });
    }

    const dropEnd = Math.min(DYNO_CONSTANTS.gridCols, xPeak + DYNO_CONSTANTS.dropWidthX);
    torquePoints.push({ x: dropEnd, y: evalCurveY(dropEnd, yTorque0, DYNO_CONSTANTS.torqueExp) });
    hpPoints.push({ x: dropEnd, y: evalCurveY(dropEnd, yHp0, DYNO_CONSTANTS.hpExp) });

    if (dropEnd < DYNO_CONSTANTS.gridCols) {
      torquePoints.push({ x: DYNO_CONSTANTS.gridCols, y: yShelf });
      hpPoints.push({ x: DYNO_CONSTANTS.gridCols, y: yShelf });
    }

    return { xPeak, yPeak, yShelf, yTorque0, yHp0, torquePoints, hpPoints };
  }

  function buildDynoSvgPath(points, plotRect) {
    const { x: ox, y: oy, width: w, height: h } = plotRect;
    const pts = points.map((pt) => {
      const clampedY = Math.min(DYNO_CONSTANTS.gridRows, Math.max(0, pt.y));
      return {
        x: ox + (pt.x / DYNO_CONSTANTS.gridCols) * w,
        y: oy + h - (clampedY / DYNO_CONSTANTS.gridRows) * h
      };
    });
    if (pts.length < 2) return "";

    let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }
    return d;
  }

  Object.assign(MCLA.data, {
    CAR_PERF_WEIGHTS,
    DYNO_CONSTANTS,
    getDynoPlotRect,
    calcCarPerformanceStats,
    calcDynoModel,
    buildDynoSvgPath
  });
})();
