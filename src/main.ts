// INITIALIZATION & SETUP

const container = document.getElementById("chart")!;
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;

container.appendChild(canvas);

const DPR = window.devicePixelRatio || 1;
const width = container.clientWidth;
const height = container.clientHeight;

canvas.width = width * DPR;
canvas.height = height * DPR;
canvas.style.width = width + "px";
canvas.style.height = height + "px";
ctx.scale(DPR, DPR);


// TYPE DEFINITIONS

type Timeframe = "1m" | "1D";


// CONFIGURATIONS

const TIMEFRAME = {
  "1m": {
    defaultRange: 35 * 60 * 1000,
    step: 60 * 1000,
    minRange: 8 * 60 * 1000,
    maxRange: 4 * 3600 * 1000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    gridSteps: [60, 150, 200, 300, 600, 900, 1800, 3600],
  },
  "1D": {
    defaultRange: 35 * 3600 * 1000,
    step: 24 * 3600 * 1000,
    minRange: 8 * 3600 * 1000,
    maxRange: 48 * 3600 * 1000,
    minZoomLevel: -3,
    maxZoomLevel: 2,
    gridSteps: [3600, 7200, 14400, 28800, 43200, 86400],
  },
};

const PRICEFRAME = {
  "1m": {
    defaultRange: 40,
    minRange: 1,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  "1D": {
    defaultRange: 200,
    minRange: 1,
    maxRange: 50000,
    minZoomLevel: -3,
    maxZoomLevel: 2,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
  },
};

const DEFAULT_TIMERANGE: Timeframe = "1m";

// STATE MANAGEMENT

type State = {
  width: number;
  height: number;
  timeStart: number;
  timeEnd: number;
  timeZoomLevel: number;
  priceMin: number;
  priceMax: number;
  priceZoomLevel: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  timeframe: Timeframe;
  isDragging: boolean;
  zoomCooldown: number;
  zoomLastTime: number;
};

const now = Date.now();

const state: State = {
  width,
  height,
  timeStart: now - TIMEFRAME[DEFAULT_TIMERANGE].defaultRange,
  timeEnd: now,
  timeZoomLevel: 0,
  priceMin: 980,
  priceMax: 1020,
  priceZoomLevel: 0,
  left: 20,
  right: 70,
  top: 20,
  bottom: 40,
  timeframe: DEFAULT_TIMERANGE,
  isDragging: false,
  zoomCooldown: 80,
  zoomLastTime: 0,
};


// HELPER FUNCTIONS

function getMousePos(canvas: HTMLCanvasElement, e: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function formatTimeLabel(timestamp: number, stepSec: number): string {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  
  if (stepSec < 60) {
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  
  return `${hh}:${mm}`;
}

function formatPriceLabel(price: number): string {
  if (price >= 100) return price.toFixed(0);
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

// GENERAL HELPER FUNCTIONS

const plotWidth = () => state.width - state.left - state.right;

const plotHeight = () => state.height - state.top - state.bottom;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function findGridStep(steps: readonly number[], range: number, plotSize: number, minPixelsPerTick: number = 60): number {
  const idealTickCount = plotSize / minPixelsPerTick;
  const idealStep = range / idealTickCount;
  
  let bestStep = steps[0];
  for (const step of steps) {
    if (step >= idealStep) {
      bestStep = step;
      break;
    }
    bestStep = step;
  }
  
  let tickCount = range / bestStep;
  if (tickCount > plotSize / 30) {
    for (const step of steps) {
      if (step > bestStep) {
        bestStep = step;
        break;
      }
    }
  }
  
  return bestStep;
}


// TIME AXIS FUNCTIONS

function getTimeConfig() {
  return TIMEFRAME[state.timeframe];
}

function clampTimeRange(range: number): number {
  const config = getTimeConfig();
  return clamp(range, config.minRange, config.maxRange);
}

function timeToX(timestamp: number): number {
  return state.left + ((timestamp - state.timeStart) / (state.timeEnd - state.timeStart)) * plotWidth();
}

function xToTime(x: number): number {
  return state.timeStart + ((x - state.left) / plotWidth()) * (state.timeEnd - state.timeStart);
}

function getTimeStep(rangeSec: number): number {
  const config = getTimeConfig();
  const plotW = plotWidth();
  const stepSec = findGridStep(config.gridSteps, rangeSec, plotW, 60);
  return stepSec * 1000;
}

function generateTimeLabels(): { value: number; x: number; label: string }[] {
  const rangeMs = state.timeEnd - state.timeStart;
  const rangeSec = rangeMs / 1000;
  const stepSec = getTimeStep(rangeSec) / 1000;
  const stepMs = stepSec * 1000;
  
  const firstTick = Math.ceil(state.timeStart / stepMs) * stepMs;
  const labels = [];
  
  for (let t = firstTick; t <= state.timeEnd; t += stepMs) {
    const x = timeToX(t);
    if (x >= state.left && x <= state.left + plotWidth()) {
      labels.push({ 
        value: t,
        x: x,
        label: formatTimeLabel(t, stepSec)
      });
    }
  }
  return labels;
}

// PRICE AXIS FUNCTIONS

function getPriceConfig() {
  return PRICEFRAME[state.timeframe];
}

function clampPriceRange(min: number, max: number): { min: number; max: number } {
  const config = getPriceConfig();
  let range = max - min;
  range = clamp(range, config.minRange, config.maxRange);
  min = Math.max(0.01, min);
  return { min, max: min + range };
}

function priceToY(price: number): number {
  return state.top + (1 - (price - state.priceMin) / (state.priceMax - state.priceMin)) * plotHeight();
}

function yToPrice(y: number): number {
  return state.priceMin + (1 - (y - state.top) / plotHeight()) * (state.priceMax - state.priceMin);
}

function getPriceStep(range: number): number {
  const config = getPriceConfig();
  const plotH = plotHeight();
  return findGridStep(config.gridSteps, range, plotH, 40);
}

function snapPrice(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function generatePriceLabels(): { value: number; y: number; label: string }[] {
  const range = state.priceMax - state.priceMin;
  const step = getPriceStep(range);
  const firstTick = Math.ceil(state.priceMin / step) * step;
  const labels = [];
  let lastY = -Infinity;
  const minLabelSpacing = 30;
  
  for (let p = firstTick; p <= state.priceMax; p += step) {
    const y = priceToY(p);
    if (y >= state.top && y <= state.top + plotHeight()) {
      if (Math.abs(y - lastY) >= minLabelSpacing) {
        labels.push({ 
          value: p,
          y: y,
          label: formatPriceLabel(p)
        });
        lastY = y;
      }
    }
  }
  return labels;
}

// ZOOM FUNCTIONS

function getZoomScale(level: number): number {
  return Math.pow(2, -level);
}

function zoomTime(cursorX: number, targetRange: number) {
  const cursorTime = xToTime(cursorX);
  const timeRatio = (cursorTime - state.timeStart) / (state.timeEnd - state.timeStart);
  let newTimeStart = cursorTime - timeRatio * targetRange;
  let newTimeEnd = newTimeStart + targetRange;
  state.timeStart = newTimeStart;
  state.timeEnd = newTimeEnd;
}

function zoomPrice(cursorY: number, targetRange: number) {
  const cursorPrice = yToPrice(cursorY);
  const priceRatio = (cursorPrice - state.priceMin) / (state.priceMax - state.priceMin);
  let newPriceMin = cursorPrice - priceRatio * targetRange;
  let newPriceMax = newPriceMin + targetRange;
  let priceClamp = clampPriceRange(newPriceMin, newPriceMax);
  const priceStep = getPriceStep(priceClamp.max - priceClamp.min);
  priceClamp.min = snapPrice(priceClamp.min, priceStep);
  priceClamp.max = priceClamp.min + Math.ceil((priceClamp.max - priceClamp.min) / priceStep) * priceStep;
  state.priceMin = priceClamp.min;
  state.priceMax = priceClamp.max;
}

function zoom(mx: number, my: number, delta: number) {
  const nowTime = Date.now();
  if (nowTime - state.zoomLastTime < state.zoomCooldown) return;
  state.zoomLastTime = nowTime;
  
  const zoomIn = delta < 0;
  const zoomDelta = zoomIn ? 1 : -1;
  const timeConfig = getTimeConfig();
  const priceConfig = getPriceConfig();

  let newTimeZoomLevel = state.timeZoomLevel + zoomDelta;
  let newPriceZoomLevel = state.priceZoomLevel + zoomDelta;

  newTimeZoomLevel = clamp(newTimeZoomLevel, timeConfig.minZoomLevel, timeConfig.maxZoomLevel);
  newPriceZoomLevel = clamp(newPriceZoomLevel, priceConfig.minZoomLevel, priceConfig.maxZoomLevel);

  if (newTimeZoomLevel === state.timeZoomLevel && newPriceZoomLevel === state.priceZoomLevel) return;

  const timeScale = getZoomScale(newTimeZoomLevel);
  const priceScale = getZoomScale(newPriceZoomLevel);

  let targetTimeRange = timeConfig.defaultRange * timeScale;
  let targetPriceRange = priceConfig.defaultRange * priceScale;

  targetTimeRange = clampTimeRange(targetTimeRange);
  targetPriceRange = clamp(targetPriceRange, priceConfig.minRange, priceConfig.maxRange);

  zoomTime(mx, targetTimeRange);
  zoomPrice(my, targetPriceRange);

  state.timeZoomLevel = newTimeZoomLevel;
  state.priceZoomLevel = newPriceZoomLevel;
  draw();
}

// PAN FUNCTIONS

function panTime(deltaX: number) {
  const tRange = state.timeEnd - state.timeStart;
  let newStart = state.timeStart - deltaX * (tRange / plotWidth());
  let newEnd = newStart + tRange;
  state.timeStart = newStart;
  state.timeEnd = newEnd;
}

function pan(dx: number) {
  panTime(dx);
  draw();
}


// RENDERING FUNCTIONS

function drawTimeGrid(timeLabels: { value: number; x: number; label: string }[]) {
  ctx.save();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 0.8;
  for (const label of timeLabels) {
    ctx.beginPath();
    ctx.moveTo(label.x, state.top);
    ctx.lineTo(label.x, state.top + plotHeight());
    ctx.stroke();
  }
  ctx.restore();
}

function drawPriceGrid(priceLabels: { value: number; y: number; label: string }[]) {
  ctx.save();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 0.8;
  for (const label of priceLabels) {
    ctx.beginPath();
    ctx.moveTo(state.left, label.y);
    ctx.lineTo(state.left + plotWidth(), label.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTimeLabels(timeLabels: { value: number; x: number; label: string }[]) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "11px monospace";
  ctx.fillStyle = "#1e293b";
  for (const label of timeLabels) {
    ctx.fillText(label.label, label.x, state.height - state.bottom + 8);
  }
  ctx.restore();
}

function drawPriceLabels(priceLabels: { value: number; y: number; label: string }[]) {
  ctx.save();
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const label of priceLabels) {
    ctx.fillText(label.label, state.left + plotWidth() + 6, label.y);
  }
  ctx.restore();
}

// TIMEFRAME MANAGEMENT

function setTimeframe(tf: Timeframe) {
  state.timeframe = tf;
  state.timeZoomLevel = 0;
  state.timeStart = Date.now() - TIMEFRAME[tf].defaultRange;
  state.timeEnd = Date.now();
  state.priceZoomLevel = 0;
  state.priceMin = 980;
  state.priceMax = 1020;
  draw();
}

function draw() {
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.fillStyle = "#fafcff";
  ctx.fillRect(state.left, state.top, plotWidth(), plotHeight());
  
  const timeLabels = generateTimeLabels();
  const priceLabels = generatePriceLabels();
  
  drawTimeGrid(timeLabels);
  drawPriceGrid(priceLabels);
  drawTimeLabels(timeLabels);
  drawPriceLabels(priceLabels);
  
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(state.left, state.top, plotWidth(), plotHeight());
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(state.left + 0.5, state.top + 0.5, plotWidth() - 1, plotHeight() - 1);
}


// UI SETUP

const controls = document.createElement("div");
controls.style.cssText = "display:flex;gap:12px;padding:12px 20px;background:#f1f5f9;border-top:1px solid #e2e8f0;justify-content:center;";

(["1m", "1D"] as Timeframe[]).forEach((tf) => {
  const btn = document.createElement("button");
  btn.innerText = tf;
  btn.onclick = () => setTimeframe(tf);
  controls.appendChild(btn);
});

container.parentElement?.appendChild(controls);

// EVENT HANDLERS

let lastDragX = 0;

canvas.addEventListener("mousedown", (e) => {
  state.isDragging = true;
  const pos = getMousePos(canvas, e);
  lastDragX = pos.x;
});

canvas.addEventListener("mousemove", (e) => {
  if (!state.isDragging) return;
  const pos = getMousePos(canvas, e);
  pan(pos.x - lastDragX);
  lastDragX = pos.x;
});

window.addEventListener("mouseup", () => {
  state.isDragging = false;
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const pos = getMousePos(canvas, e);
  zoom(pos.x, pos.y, e.deltaY);
});

window.addEventListener("resize", () => {
  const newWidth = container.clientWidth;
  const newHeight = container.clientHeight;
  state.width = newWidth;
  state.height = newHeight;
  canvas.width = newWidth * DPR;
  canvas.height = newHeight * DPR;
  canvas.style.width = newWidth + "px";
  canvas.style.height = newHeight + "px";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(DPR, DPR);
  draw();
});

// INITIAL RENDER

setTimeframe("1m");
draw();