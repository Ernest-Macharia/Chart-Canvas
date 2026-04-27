import { drawChart } from "./chart/draw";
import { createState } from "./chart/state";
import { DEFAULT_TIMERANGE } from "./chart/timeFrame";
import type { Timeframe } from "./chart/types";
import { createChartTypeControls } from "./chart/chartControls";
import { RANDOM_CHART_DATA, getDataTimeRange } from "./chart/hardcodedData";
import { setupChartEvents } from "./chart/events";

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

const state = createState(width, height);

// Get hardcoded data range
const { minTime, maxTime, minPrice, maxPrice } = getDataTimeRange();
const priceMargin = (maxPrice - minPrice) * 0.1;

// Override state with hardcoded data
state.chartData = RANDOM_CHART_DATA;
state.timeStart = minTime;
state.timeEnd = maxTime;
state.priceMin = Math.max(0.01, minPrice - priceMargin);
state.priceMax = maxPrice + priceMargin;
state.timeZoomLevel = 0;
state.priceZoomLevel = 0;

function draw() {
  drawChart(ctx, state);
}

let timeframeButtons: Map<string, HTMLButtonElement> = new Map();

function setTimeframe(tf: Timeframe) {
  state.chartData = RANDOM_CHART_DATA;
  state.timeframe = tf;
  
  // Reset to full data range
  state.timeStart = minTime;
  state.timeEnd = maxTime;
  state.priceMin = Math.max(0.01, minPrice - priceMargin);
  state.priceMax = maxPrice + priceMargin;
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

// Create timeframe controls
const timeframeControls = document.createElement("div");
timeframeControls.style.cssText =
  "display:flex;gap:12px;padding:12px 20px;background:#f1f5f9;border-top:1px solid #e2e8f0;justify-content:center;flex-wrap:wrap;";

const timeframes: Timeframe[] = ["1t", "1m", "2m", "3m", "5m", "10m", "15m", "30m", "1h", "2h", "4h", "8h", "1D"];

timeframes.forEach((tf) => {
  const btn = document.createElement("button");
  btn.innerText = tf;
  btn.style.cssText = `
    padding: 6px 14px;
    background: #e2e8f0;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
    font-family: monospace;
  `;
  
  btn.onmouseenter = () => {
    if (state.timeframe !== tf) {
      btn.style.background = "#cbd5e1";
    }
  };
  
  btn.onmouseleave = () => {
    if (state.timeframe !== tf) {
      btn.style.background = "#e2e8f0";
    }
  };
  
  btn.onclick = () => setTimeframe(tf);
  
  timeframeControls.appendChild(btn);
  timeframeButtons.set(tf, btn);
});

container.parentElement?.appendChild(timeframeControls);
updateTimeframeButtonStyles(DEFAULT_TIMERANGE);

const chartTypeControls = createChartTypeControls(state, draw);
container.parentElement?.appendChild(chartTypeControls);

setupChartEvents({
  canvas,
  container,
  ctx,
  dpr: DPR,
  state,
  redraw: draw,
});

draw();