import { drawChart } from "./chart/draw";
import { getMousePos } from "./chart/mouse";
import { pan } from "./chart/pan";
import { createState, setTimeframeState } from "./chart/state";
import { DEFAULT_TIMERANGE } from "./chart/timeFrame";
import type { Timeframe } from "./chart/types";
import { zoom } from "./chart/zoom";
import { createChartTypeControls } from "./chart/chartControls";
import { regenerateDataForTimeframe } from "./chart/data";

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

let lastDragX = 0;

canvas.addEventListener("mousedown", (e) => {
  state.isDragging = true;
  const pos = getMousePos(canvas, e);
  lastDragX = pos.x;
});

canvas.addEventListener("mousemove", (e) => {
  if (!state.isDragging) return;
  const pos = getMousePos(canvas, e);
  pan(state, pos.x - lastDragX, draw);
  lastDragX = pos.x;
});

window.addEventListener("mouseup", () => {
  state.isDragging = false;
});

canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const pos = getMousePos(canvas, e);
  zoom(state, pos.x, pos.y, e.deltaY, draw);
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

setTimeframe(DEFAULT_TIMERANGE);
draw();
