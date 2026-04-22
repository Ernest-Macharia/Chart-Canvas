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

// Redraws the chart using current state.
function draw() {
  drawChart(ctx, state);
}

// Applies a timeframe change, refreshes data, then redraws.
function setTimeframe(tf: Timeframe) {
  const previousLastPrice = state.chartData[state.chartData.length - 1]?.value ?? 100;
  setTimeframeState(state, tf);
  state.chartData = regenerateDataForTimeframe(tf, previousLastPrice);
  draw();
}

const timeframeControls = document.createElement("div");
timeframeControls.style.cssText =
  "display:flex;gap:12px;padding:12px 20px;background:#f1f5f9;border-top:1px solid #e2e8f0;justify-content:center;";

(["1m", "1D"] as Timeframe[]).forEach((tf) => {
  const btn = document.createElement("button");
  btn.innerText = tf;
  btn.onclick = () => setTimeframe(tf);
  timeframeControls.appendChild(btn);
});

container.parentElement?.appendChild(timeframeControls);

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

setTimeframe(DEFAULT_TIMERANGE);
draw();
