/* ---------- Performance Shop: the numbers behind the bars ----------
   Each category pushes acceleration / speed / handling by a fixed share of
   the car's stock-to-max range, and lifts the dyno curve by its own amount.
   A bike has six categories and no 13-entry table, so it keeps the simple
   proportional path. */

var CAR_PERF_WEIGHTS = [
  // 0 Exhaust system
  { acc: 1 / 8, spd: 0,     hnd: 0,     dynoY: 2 / 14.5 },
  // 1 Headers
  { acc: 1 / 8, spd: 0,     hnd: 0,     dynoY: 2 / 14.5 },
  // 2 Cold air intake
  { acc: 1 / 8, spd: 0,     hnd: 0,     dynoY: 2 / 14.5 },
  // 3 Forced induction
  { acc: 1 / 4, spd: 1 / 6, hnd: 0,     dynoY: 3.5 / 14.5 },
  // 4 Engine upgrade
  { acc: 1 / 4, spd: 1 / 4, hnd: 0,     dynoY: 4 / 14.5 },
  // 5 Electronics, the one category that also shifts the rev limiter on X
  { acc: 1 / 8, spd: 1 / 4, hnd: 0,     dynoY: 1 / 14.5 },
  // 6 Nitrous
  { acc: 0,     spd: 0,     hnd: 0,     dynoY: 0 },
  // 7 Clutch
  { acc: 0,     spd: 0,     hnd: 0,     dynoY: 0 },
  // 8 Gear kit
  { acc: 0,     spd: 1 / 3, hnd: 0,     dynoY: 0 },
  // 9 Shocks/springs
  { acc: 0,     spd: 0,     hnd: 1 / 4, dynoY: 0 },
  // 10 Swaybars
  { acc: 0,     spd: 0,     hnd: 1 / 4, dynoY: 0 },
  // 11 Brakes
  { acc: 0,     spd: 0,     hnd: 1 / 4, dynoY: 0 },
  // 12 Tires
  { acc: 0,     spd: 0,     hnd: 1 / 4, dynoY: 0 }
];

/* The stock reference is the 1988 Scirocco: every car is scaled against its
   peak (baseScale = basePeakY / refPeakY, so the Scirocco is exactly 1.0).
   Real per-vehicle stock curves are not collected yet — when they are, this
   is the block to replace. */
var DYNO_CONSTANTS = {
  gridCols: 6,
  gridRows: 5,
  stockPeakX: 3.60,
  maxShiftX: 0.90,
  dropWidthX: 0.45,
  refPeakY: 2.204,     // 1.25 + 0.018 * (23 + 30), the Scirocco
  refTorqueY0: 1.40,
  refHpY0: 0.90,
  refShelfY: 1.00,
  anchorY0: 0.40,
  torqueExp: 0.85,
  hpExp: 1.15,
  sampleSteps: 48
};

/* The dyno grid inside #shopDynoSvg: 6 columns, 5 rows, no padding. */
function getDynoPlotRect() { return { x: 0, y: 0, width: 260, height: 70 }; }

/* Current acceleration / speed / handling, as exact values plus the rounded
   number the UI shows. `levels` are byte values (0 = stock). */
function calcCarPerformanceStats(stock, max, levels, maxLevel) {
  var safeMaxLevel = Math.max(1, Number(maxLevel) || 1);
  var shareAcc = 0, shareSpd = 0, shareHnd = 0;

  for (var i = 0; i < CAR_PERF_WEIGHTS.length; i++) {
    var lvl = Math.min(safeMaxLevel, Math.max(0, Number(levels[i]) || 0));
    if (lvl === 0) continue;
    var ratio = lvl / safeMaxLevel;
    var w = CAR_PERF_WEIGHTS[i];
    shareAcc += w.acc * ratio;
    shareSpd += w.spd * ratio;
    shareHnd += w.hnd * ratio;
  }

  var exactAcc = stock.acc + (max.acc - stock.acc) * shareAcc;
  var exactSpd = stock.spd + (max.spd - stock.spd) * shareSpd;
  var exactHnd = stock.hnd + (max.hnd - stock.hnd) * shareHnd;

  function pack(s, mx, exact) {
    return { stock: s, max: mx, exact: exact, value: Math.round(exact) };
  }
  return {
    acc: pack(stock.acc, max.acc, exactAcc),
    spd: pack(stock.spd, max.spd, exactSpd),
    hnd: pack(stock.hnd, max.hnd, exactHnd)
  };
}

/* Torque and horsepower curves on the 6x5 grid, in grid units. */
function calcDynoModel(stock, max, levels, maxLevel) {
  var safeMaxLevel = Math.max(1, Number(maxLevel) || 1);
  var stockPowerSum = (Number(stock.acc) || 0) + (Number(stock.spd) || 0);
  var deltaPowerSum = Math.max(0, ((Number(max.acc) || 0) - stock.acc) + ((Number(max.spd) || 0) - stock.spd));

  var basePeakY = 1.25 + 0.018 * stockPowerSum;
  var maxDeltaY = stockPowerSum > 0 ? basePeakY * 1.09 * (deltaPowerSum / stockPowerSum) : 0;

  var shareY = 0;
  for (var i = 0; i < CAR_PERF_WEIGHTS.length; i++) {
    var lvl = Math.min(safeMaxLevel, Math.max(0, Number(levels[i]) || 0));
    if (lvl === 0) continue;
    shareY += CAR_PERF_WEIGHTS[i].dynoY * (lvl / safeMaxLevel);
  }

  var elecLevel = Math.min(safeMaxLevel, Math.max(0, Number(levels[5]) || 0));
  var xPeak = DYNO_CONSTANTS.stockPeakX + DYNO_CONSTANTS.maxShiftX * (elecLevel / safeMaxLevel);
  var yPeak = basePeakY + maxDeltaY * shareY;

  /* Scale from the Scirocco baseline (baseScale = 1.0 there) plus the tune
     lift, so the start points and the shelf stay under the peak. */
  var baseScale = basePeakY / DYNO_CONSTANTS.refPeakY;
  var tuneScaleY = basePeakY > 0 ? yPeak / basePeakY : 1;
  var totalScaleY = baseScale * tuneScaleY;

  var yTorque0 = DYNO_CONSTANTS.anchorY0 + (DYNO_CONSTANTS.refTorqueY0 - DYNO_CONSTANTS.anchorY0) * totalScaleY;
  var yHp0 = DYNO_CONSTANTS.anchorY0 + (DYNO_CONSTANTS.refHpY0 - DYNO_CONSTANTS.anchorY0) * totalScaleY;
  var yShelf = DYNO_CONSTANTS.refShelfY * totalScaleY;

  function evalCurveY(x, y0, p) {
    if (x <= xPeak) {
      var t = xPeak > 0 ? Math.max(0, x / xPeak) : 0;
      return y0 + (yPeak - y0) * Math.pow(t, p);
    }
    var dropEnd = xPeak + DYNO_CONSTANTS.dropWidthX;
    if (x <= dropEnd) {
      var td = (x - xPeak) / DYNO_CONSTANTS.dropWidthX;
      return yPeak - (yPeak - yShelf) * td;
    }
    return yShelf;
  }

  var torquePoints = [], hpPoints = [];
  var steps = DYNO_CONSTANTS.sampleSteps;
  for (var s = 0; s <= steps; s++) {
    var x = (xPeak * s) / steps;
    torquePoints.push({ x: x, y: evalCurveY(x, yTorque0, DYNO_CONSTANTS.torqueExp) });
    hpPoints.push({ x: x, y: evalCurveY(x, yHp0, DYNO_CONSTANTS.hpExp) });
  }

  var dropEnd = Math.min(DYNO_CONSTANTS.gridCols, xPeak + DYNO_CONSTANTS.dropWidthX);
  torquePoints.push({ x: dropEnd, y: evalCurveY(dropEnd, yTorque0, DYNO_CONSTANTS.torqueExp) });
  hpPoints.push({ x: dropEnd, y: evalCurveY(dropEnd, yHp0, DYNO_CONSTANTS.hpExp) });

  if (dropEnd < DYNO_CONSTANTS.gridCols) {
    torquePoints.push({ x: DYNO_CONSTANTS.gridCols, y: yShelf });
    hpPoints.push({ x: DYNO_CONSTANTS.gridCols, y: yShelf });
  }

  return { xPeak: xPeak, yPeak: yPeak, yShelf: yShelf, yTorque0: yTorque0, yHp0: yHp0,
           torquePoints: torquePoints, hpPoints: hpPoints };
}

/* Grid units to an SVG path attribute. The samples land on a curve, not on a
   polyline: a Catmull-Rom spline through the points reads as one smooth line
   instead of a chain of straight segments with visible corners. */
function buildDynoSvgPath(points, plotRect) {
  var ox = plotRect.x, oy = plotRect.y, w = plotRect.width, h = plotRect.height;
  var pts = points.map(function (pt) {
    var clampedY = Math.min(DYNO_CONSTANTS.gridRows, Math.max(0, pt.y));
    return {
      x: ox + (pt.x / DYNO_CONSTANTS.gridCols) * w,
      y: oy + h - (clampedY / DYNO_CONSTANTS.gridRows) * h
    };
  });
  if (pts.length < 2) return "";

  var d = "M" + pts[0].x.toFixed(2) + "," + pts[0].y.toFixed(2);
  for (var i = 0; i < pts.length - 1; i++) {
    var p0 = pts[i - 1] || pts[i];
    var p1 = pts[i];
    var p2 = pts[i + 1];
    var p3 = pts[i + 2] || p2;
    var c1x = p1.x + (p2.x - p0.x) / 6;
    var c1y = p1.y + (p2.y - p0.y) / 6;
    var c2x = p2.x - (p3.x - p1.x) / 6;
    var c2y = p2.y - (p3.y - p1.y) / 6;
    d += " C" + c1x.toFixed(2) + "," + c1y.toFixed(2) +
         " " + c2x.toFixed(2) + "," + c2y.toFixed(2) +
         " " + p2.x.toFixed(2) + "," + p2.y.toFixed(2);
  }
  return d;
}
