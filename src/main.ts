// main.ts
import { drawChart } from "./chart/draw";
import { createState, setTimeframeState } from "./chart/state";
import { DEFAULT_TIMERANGE } from "./chart/timeFrame";
import type { Timeframe } from "./chart/types";
import { createChartTypeControls } from "./chart/chartControls";
import { regenerateDataForTimeframe } from "./chart/data";
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

function draw() {
  drawChart(ctx, state);
}

// Store references to timeframe buttons for updating styles
let timeframeButtons: Map<string, HTMLButtonElement> = new Map();

function setTimeframe(tf: Timeframe) {
  const previousLastPrice = state.chartData[state.chartData.length - 1]?.value ?? 100;
  setTimeframeState(state, tf);
  state.chartData = regenerateDataForTimeframe(tf, previousLastPrice);
  draw();
  
  // Update button styles to show which timeframe is active
  updateTimeframeButtonStyles(tf);
}

// Function to update button styles based on selected timeframe
function updateTimeframeButtonStyles(activeTimeframe: Timeframe) {
  timeframeButtons.forEach((button, timeframe) => {
    if (timeframe === activeTimeframe) {
      // Active timeframe button style
      button.style.background = "#3b82f6";  // Blue background
      button.style.color = "white";          // White text
      button.style.border = "none";
    } else {
      // Inactive timeframe button style
      button.style.background = "#e2e8f0";  // Light gray background
      button.style.color = "#1e293b";        // Dark text
      button.style.border = "none";
    }
  });
}

// Create timeframe controls container
const timeframeControls = document.createElement("div");
timeframeControls.style.cssText =
  "display:flex;gap:12px;padding:12px 20px;background:#f1f5f9;border-top:1px solid #e2e8f0;justify-content:center;flex-wrap:wrap;";

// Add all timeframe buttons
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
  
  // Add hover effect
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

// Set initial active button style for default timeframe
updateTimeframeButtonStyles(DEFAULT_TIMERANGE);

// Create chart type controls
const chartTypeControls = createChartTypeControls(state, draw);
container.parentElement?.appendChild(chartTypeControls);

// Setup all chart events (mouse, wheel, resize)
setupChartEvents({
  canvas,
  container,
  ctx,
  dpr: DPR,
  state,
  redraw: draw,
});

setTimeframe(DEFAULT_TIMERANGE);
draw();