import { drawPriceGrid, drawTimeGrid } from "./drawGrid";
import { drawPriceLabels, drawTimeLabels } from "./drawLabels";
import { buildPriceAxis, updatePriceRangeFromData, validateAndFixPriceRange } from "./price";
import { plotHeight, plotWidth } from "./state";
import { buildTimeAxis } from "./time";
import type { State } from "./types";
import { drawLineChart, drawAreaChart, drawCandleChart, drawHollowCandleChart, drawOHLCChart } from "./drawChartTypes";
import { getVisibleData } from "./data";
import { ticksToOHLC, getVisibleCandles } from "./ohlc";

export function drawChart(ctx: CanvasRenderingContext2D, state: State): void {
  validateAndFixPriceRange(state);
  if (state.useDataRange && state.chartData && state.chartData.length > 0) {
    updatePriceRangeFromData(state);
  }
  
  if (state.priceMax <= state.priceMin) {
    state.priceMax = state.priceMin + 1;
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
    const visibleData = getVisibleData(state.chartData, state.timeStart, state.timeEnd);
    
    if (visibleData.length > 0) {
      if (state.chartType === "line") {
        drawLineChart(ctx, state, visibleData, "#3b82f6", 2);
      } else if (state.chartType === "area") {
        drawAreaChart(ctx, state, visibleData, "#3b82f6", 0.3);
      } else if (state.chartType === "candle") {
        const candles = ticksToOHLC(state.chartData, state.timeframe);
        const visibleCandles = getVisibleCandles(candles, state.timeStart, state.timeEnd);
        drawCandleChart(ctx, state, visibleCandles, "#26a69a", "#ef5350", "#666666");
      } else if (state.chartType === "hollow") {
        const candles = ticksToOHLC(state.chartData, state.timeframe);
        const visibleCandles = getVisibleCandles(candles, state.timeStart, state.timeEnd);
        drawHollowCandleChart(ctx, state, visibleCandles, "#26a69a", "#ef5350", "#666666");
      } else if (state.chartType === "ohlc") {
        const candles = ticksToOHLC(state.chartData, state.timeframe);
        const visibleCandles = getVisibleCandles(candles, state.timeStart, state.timeEnd);
        drawOHLCChart(ctx, state, visibleCandles, "#26a69a", "#ef5350");
      }
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