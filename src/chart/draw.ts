import { drawPriceGrid, drawTimeGrid } from "./drawGrid";
import { drawPriceLabels, drawTimeLabels } from "./drawLabels";
import { buildPriceAxis, updatePriceRangeFromData } from "./price";
import { plotHeight, plotWidth } from "./state";
import { buildTimeAxis } from "./time";
import type { State } from "./types";
import { drawLineChart, drawAreaChart } from "./drawChartData";
import { getVisibleData } from "./data";

// Renders one full frame of the chart.
export function drawChart(ctx: CanvasRenderingContext2D, state: State): void {
  if (state.useDataRange && state.chartData) {
    updatePriceRangeFromData(state);
  }
  
  ctx.clearRect(0, 0, state.width, state.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.fillStyle = "#fafcff";
  ctx.fillRect(state.left, state.top, plotWidth(state), plotHeight(state));

  const timeAxis = buildTimeAxis(state);
  const priceAxis = buildPriceAxis(state);

  drawTimeGrid(ctx, state, timeAxis.ticks);
  drawPriceGrid(ctx, state, priceAxis.ticks);
  
  if (state.chartData && state.chartData.length > 0) {
    const visibleData = getVisibleData(state.chartData, state.timeStart / 1000, state.timeEnd / 1000);
    
    if (state.chartType === "line") {
      drawLineChart(ctx, state, visibleData, "#3b82f6", 2);
    } else if (state.chartType === "area") {
      drawAreaChart(ctx, state, visibleData, "#3b82f6", 0.3);
    }
  }
  
  drawTimeLabels(ctx, state, timeAxis.labels);
  drawPriceLabels(ctx, state, priceAxis.labels);

  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(state.left, state.top, plotWidth(state), plotHeight(state));
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(state.left + 0.5, state.top + 0.5, plotWidth(state) - 1, plotHeight(state) - 1);
}
