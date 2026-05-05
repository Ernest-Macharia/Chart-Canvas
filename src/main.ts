import { drawChart, markStaticDirty } from "./chart/draw";
import { createState } from "./chart/state";
import { DEFAULT_TIMERANGE, TIMEFRAME } from "./chart/timeFrame";
import type { Timeframe } from "./chart/types";
import { createChartTypeControls, createFloatingLatestButton } from "./chart/chartControls";
import { setupChartEvents } from "./chart/events";
import { liveDataManager } from "./chart/liveData";
import { getLatestDataTime } from "./chart/data";
import { fitPriceRangeInstant } from "./chart/price";
import { clearAllCache, invalidateTimeframeCache, precomputeTimeframeCache, ticksToOHLC } from "./chart/ohlc";

const SIMULATED_LOAD_MS = 220;

const container = document.getElementById("chart")!;
const canvas = document.createElement("canvas");
const ctxMaybe = canvas.getContext("2d");
if (!ctxMaybe) throw new Error("2D context unavailable");
const ctx = ctxMaybe;
container.appendChild(canvas);

if (getComputedStyle(container).position === "static") {
  container.style.position = "relative";
}

const loadingEl = document.createElement("div");
loadingEl.style.cssText = "position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:#ffffff;z-index:30;";
loadingEl.innerHTML = `
  <div style="display:flex;gap:6px;align-items:flex-end;height:22px;">
    <span style="width:4px;height:8px;background:#3b82f6;animation:cwPulse 0.8s ease-in-out infinite;"></span>
    <span style="width:4px;height:14px;background:#3b82f6;animation:cwPulse 0.8s ease-in-out 0.1s infinite;"></span>
    <span style="width:4px;height:20px;background:#3b82f6;animation:cwPulse 0.8s ease-in-out 0.2s infinite;"></span>
    <span style="width:4px;height:14px;background:#3b82f6;animation:cwPulse 0.8s ease-in-out 0.3s infinite;"></span>
  </div>
  <span style="font:600 13px 'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#131722;">Loading chart data...</span>
`;
container.appendChild(loadingEl);

const animStyle = document.createElement("style");
animStyle.textContent = "@keyframes cwPulse{0%,100%{opacity:0.35;transform:scaleY(0.7)}50%{opacity:1;transform:scaleY(1)}}";
document.head.appendChild(animStyle);

function showLoading() {
  loadingEl.style.display = "flex";
  canvas.style.visibility = "hidden";
}

function hideLoading() {
  loadingEl.style.display = "none";
  canvas.style.visibility = "visible";
}

const state = createState(container.clientWidth, container.clientHeight);
let rafId: number | null = null;
let lastKnownLatestTime = 0;

function applySize() {
  const dpr = window.devicePixelRatio || 1;
  const width = container.clientWidth;
  const height = container.clientHeight;
  state.width = width;
  state.height = height;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  markStaticDirty();
}

function requestRender() {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    drawChart(ctx, state);
  });
}

function resetWindowToTimeframe(tf: Timeframe) {
  const cfg = TIMEFRAME[tf];
  const latest = liveDataManager.getLatestTick();
  const nowMs = latest ? latest.epoch * 1000 : Date.now();
  const windowMs = cfg.defaultRange;
  const rightPadMs = windowMs * 0.3;
  state.timeStart = nowMs + rightPadMs - windowMs;
  state.timeEnd = nowMs + rightPadMs;
}

function applyTimeframeImmediate(tf: Timeframe) {
  state.chartData = liveDataManager.getData();
  ticksToOHLC(state.chartData, tf);
  state.timeframe = tf;
  state.timeZoomLevel = 0;
  state.priceZoomLevel = 0;
  resetWindowToTimeframe(tf);
  fitPriceRangeInstant(state);
  markStaticDirty();
  requestRender();
}

function cleanupOldState(activeTimeframe: Timeframe): void {
  const allTimeframes: Timeframe[] = ["1t", "1m", "2m", "3m", "5m", "10m", "15m", "30m", "1h", "2h", "4h", "8h", "1D"];
  for (const tf of allTimeframes) {
    if (tf !== activeTimeframe) invalidateTimeframeCache(tf);
  }
}

function precomputeBackgroundTimeframes(): void {
  const targets: Timeframe[] = ["1m", "5m", "15m", "30m", "1h"];
  const run = () => {
    for (const tf of targets) {
      if (tf !== state.timeframe) precomputeTimeframeCache(state.chartData, tf);
    }
  };

  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
      .requestIdleCallback(run, { timeout: 3000 });
  } else {
    globalThis.setTimeout(run, 300);
  }
}

showLoading();
state.chartData = liveDataManager.getData();
lastKnownLatestTime = getLatestDataTime(state.chartData);
resetWindowToTimeframe(state.timeframe);
fitPriceRangeInstant(state);
applySize();
requestRender();
setTimeout(() => hideLoading(), SIMULATED_LOAD_MS);

const floatingLatestButton = createFloatingLatestButton(state, requestRender, 0.3);
document.body.appendChild(floatingLatestButton);

const timeframeButtons: Map<string, HTMLButtonElement> = new Map();

function setTimeframe(tf: Timeframe) {
  showLoading();
  updateTimeframeButtonStyles(tf);
  setTimeout(() => {
    applyTimeframeImmediate(tf);
    cleanupOldState(tf);
    hideLoading();
  }, SIMULATED_LOAD_MS);
}

function updateTimeframeButtonStyles(activeTimeframe: Timeframe) {
  timeframeButtons.forEach((button, timeframe) => {
    if (timeframe === activeTimeframe) {
      button.style.background = "#3b82f6";
      button.style.color = "white";
    } else {
      button.style.background = "#e2e8f0";
      button.style.color = "#1e293b";
    }
  });
}

const bottomControls = document.createElement("div");
bottomControls.style.cssText = "display:flex;flex-direction:column;gap:12px;padding:12px 20px;background:#f1f5f9;border-top:1px solid #e2e8f0; position: relative; z-index: 10;";

const timeframeControls = document.createElement("div");
timeframeControls.style.cssText = "display:flex;gap:12px;justify-content:center;flex-wrap:wrap;";

const timeframes: Timeframe[] = ["1t", "1m", "2m", "3m", "5m", "10m", "15m", "30m", "1h", "2h", "4h", "8h", "1D"];

for (const tf of timeframes) {
  const btn = document.createElement("button");
  btn.innerText = tf;
  btn.style.cssText = "padding: 6px 14px; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s ease; font-family: monospace;";
  btn.onmouseenter = () => {
    if (state.timeframe !== tf) btn.style.background = "#cbd5e1";
  };
  btn.onmouseleave = () => {
    if (state.timeframe !== tf) btn.style.background = "#e2e8f0";
  };
  btn.onclick = () => setTimeframe(tf);
  timeframeControls.appendChild(btn);
  timeframeButtons.set(tf, btn);
}

bottomControls.appendChild(timeframeControls);
const separator = document.createElement("div");
separator.style.cssText = "height:1px;background:#cbd5e1;margin:4px 0;";
bottomControls.appendChild(separator);

const chartTypeControls = createChartTypeControls(state, requestRender);
bottomControls.appendChild(chartTypeControls);
container.parentElement?.appendChild(bottomControls);

updateTimeframeButtonStyles(DEFAULT_TIMERANGE);

setupChartEvents({
  canvas,
  container,
  ctx,
  dpr: window.devicePixelRatio || 1,
  state,
  redraw: requestRender,
  onVisibilityChange: () => {
    markStaticDirty();
    if ((floatingLatestButton as any).updateVisibility) {
      (floatingLatestButton as any).updateVisibility();
    }
  },
});

liveDataManager.addListener((newData) => {
  state.chartData = newData;
  const newLatestTime = getLatestDataTime(newData);

  if (newLatestTime > lastKnownLatestTime) {
    const windowMs = state.timeEnd - state.timeStart;
    const rightPadMs = windowMs * 0.3;
    const expectedEnd = lastKnownLatestTime + rightPadMs;
    const isAtLatest = Math.abs(state.timeEnd - expectedEnd) < windowMs * 0.05;

    if (isAtLatest) {
      state.timeEnd = newLatestTime + rightPadMs;
      state.timeStart = state.timeEnd - windowMs;
    }

    lastKnownLatestTime = newLatestTime;
  }

  if (state.useDataRange) fitPriceRangeInstant(state);
  markStaticDirty();
  requestRender();
});

window.addEventListener("resize", () => {
  applySize();
  fitPriceRangeInstant(state);
  markStaticDirty();
  requestRender();
});

window.addEventListener("beforeunload", () => {
  clearAllCache();
  liveDataManager.stop();
});

window.setTimeout(() => precomputeBackgroundTimeframes(), 1000);
