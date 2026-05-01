import { drawChart } from "./chart/draw";
import { createState } from "./chart/state";
import { DEFAULT_TIMERANGE, TIMEFRAME } from "./chart/timeFrame";
import type { Timeframe } from "./chart/types";
import { createChartTypeControls, createFloatingLatestButton } from "./chart/chartControls";
import { setupChartEvents } from "./chart/events";
import { liveDataManager } from "./chart/liveData";
import { applyRightPadding, isAtLatestData } from "./chart/time";

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

// Create state with default values from createState()
const state = createState(width, height);

// Initialize with live data (starts with MASTER_CHART_DATA)
state.chartData = liveDataManager.getData();

// Calculate initial range
const lastTime = liveDataManager.getLatestTick()!.epoch * 1000;
const tfConfig = TIMEFRAME[state.timeframe];
const totalVisibleRange = tfConfig.defaultRange; // 30 minutes for 1m
const paddingRatio = 0.30; // 30% offset

// Calculate: data portion is 70% of total visible range
const dataPortion = 1 - paddingRatio; // 0.70
const dataRange = totalVisibleRange * dataPortion; // 21 minutes of actual data

// Set time range with offset
state.timeStart = lastTime - dataRange;
state.timeEnd = lastTime + (totalVisibleRange * paddingRatio);
state.timeZoomLevel = 0;
state.priceZoomLevel = 0;

// Auto-update chart when new data arrives
let isUpdating = false;
liveDataManager.addListener((newData) => {
  if (isUpdating) return;
  isUpdating = true;
  
  state.chartData = newData;
  
  // If we're at the latest data, maintain the offset
  if (isAtLatestData(state)) {
    applyRightPadding(state);
  }
  
  draw();
  isUpdating = false;
});

function draw() {
  drawChart(ctx, state);
}

// Create floating Latest button
const floatingLatestButton = createFloatingLatestButton(state, draw, 0.30);
document.body.appendChild(floatingLatestButton);

let timeframeButtons: Map<string, HTMLButtonElement> = new Map();

function setTimeframe(tf: Timeframe) {
  state.chartData = liveDataManager.getData();
  state.timeframe = tf;
  
  const tfConfig = TIMEFRAME[tf];
  const lastTime = liveDataManager.getLatestTick()!.epoch * 1000;
  const totalVisibleRange = tfConfig.defaultRange;
  const paddingRatio = 0.30;
  
  // Calculate: data portion is 70% of total visible range
  const dataPortion = 1 - paddingRatio;
  const dataRange = totalVisibleRange * dataPortion;
  
  // Set time range with offset
  state.timeStart = lastTime - dataRange;
  state.timeEnd = lastTime + (totalVisibleRange * paddingRatio);
  state.timeZoomLevel = 0;
  state.priceZoomLevel = 0;
  
  draw();
  updateTimeframeButtonStyles(tf);
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

// Create bottom controls container
const bottomControls = document.createElement("div");
bottomControls.style.cssText = "display:flex;flex-direction:column;gap:12px;padding:12px 20px;background:#f1f5f9;border-top:1px solid #e2e8f0; position: relative; z-index: 10;";

// Create timeframe controls
const timeframeControls = document.createElement("div");
timeframeControls.style.cssText = "display:flex;gap:12px;justify-content:center;flex-wrap:wrap;";

const timeframes: Timeframe[] = ["1t", "1m", "2m", "3m", "5m", "10m", "15m", "30m", "1h", "2h", "4h", "8h", "1D"];

timeframes.forEach((tf) => {
  const btn = document.createElement("button");
  btn.innerText = tf;
  btn.style.cssText = `padding: 6px 14px; background: #e2e8f0; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s ease; font-family: monospace;`;
  
  btn.onmouseenter = () => { if (state.timeframe !== tf) btn.style.background = "#cbd5e1"; };
  btn.onmouseleave = () => { if (state.timeframe !== tf) btn.style.background = "#e2e8f0"; };
  btn.onclick = () => setTimeframe(tf);
  
  timeframeControls.appendChild(btn);
  timeframeButtons.set(tf, btn);
});

bottomControls.appendChild(timeframeControls);

// Add a separator line
const separator = document.createElement("div");
separator.style.cssText = "height:1px;background:#cbd5e1;margin:4px 0;";
bottomControls.appendChild(separator);

// Add chart type controls
const chartTypeControls = createChartTypeControls(state, draw);
bottomControls.appendChild(chartTypeControls);

container.parentElement?.appendChild(bottomControls);

updateTimeframeButtonStyles(DEFAULT_TIMERANGE);

// Add live indicator
const liveIndicator = document.createElement("div");
liveIndicator.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: #22c55e;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: bold;
  font-family: monospace;
  z-index: 1000;
  animation: pulse 1.5s infinite;
`;

// Add CSS animation for live indicator
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;
document.head.appendChild(style);

// Setup chart events
setupChartEvents({ 
  canvas, 
  container, 
  ctx, 
  dpr: DPR, 
  state, 
  redraw: draw,
  onVisibilityChange: () => {
    if ((floatingLatestButton as any).updateVisibility) {
      (floatingLatestButton as any).updateVisibility();
    }
  }
});

draw();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  liveDataManager.stop();
});