import { drawPriceGrid, drawTimeGrid } from "./drawGrid";
import { drawPriceLabels, drawTimeLabels } from "./drawLabels";
import { buildPriceAxis, validateAndFixPriceRange } from "./price";
import { plotHeight, plotWidth } from "./state";
import { buildTimeAxis } from "./time";
import type { State } from "./types";
import { getVisibleBounds } from "./data";
import { getVisibleCandleBounds, ticksToOHLC } from "./ohlc";
import { drawLineChart, drawAreaChart, drawCandleChart, drawHollowCandleChart, drawOHLCChart } from "./drawChartTypes";

let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenDirty = true;
let offscreenSignature = "";

function getStaticSignature(state: State): string {
  return [
    state.width,
    state.height,
    state.left,
    state.right,
    state.top,
    state.bottom,
    state.timeStart.toFixed(2),
    state.timeEnd.toFixed(2),
    state.priceMin.toFixed(6),
    state.priceMax.toFixed(6),
    state.timeframe,
  ].join("|");
}

function ensureOffscreen(state: State): HTMLCanvasElement {
  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement("canvas");
    offscreenDirty = true;
  }
  if (offscreenCanvas.width !== state.width || offscreenCanvas.height !== state.height) {
    offscreenCanvas.width = state.width;
    offscreenCanvas.height = state.height;
    offscreenDirty = true;
  }
  return offscreenCanvas;
}

export function markStaticDirty(): void {
  offscreenDirty = true;
}

function drawPrimaryStatic(state: State): HTMLCanvasElement {
  const canvas = ensureOffscreen(state);
  const sig = getStaticSignature(state);
  if (!offscreenDirty && sig === offscreenSignature) return canvas;

  const offCtx = canvas.getContext("2d");
  if (!offCtx) return canvas;

  offCtx.clearRect(0, 0, state.width, state.height);
  offCtx.fillStyle = "#FFFFFF";
  offCtx.fillRect(0, 0, state.width, state.height);

  const timeAxis = buildTimeAxis(state);
  const priceAxis = buildPriceAxis(state);
  drawTimeGrid(offCtx, state, timeAxis.ticks);
  drawPriceGrid(offCtx, state, priceAxis.ticks);
  drawTimeLabels(offCtx, state, timeAxis.labels);
  drawPriceLabels(offCtx, state, priceAxis.labels);

  offscreenDirty = false;
  offscreenSignature = sig;
  return canvas;
}

export function drawChart(ctx: CanvasRenderingContext2D, state: State): void {
  validateAndFixPriceRange(state);

  if (state.priceMax <= state.priceMin) {
    state.priceMax = state.priceMin + 1;
  }

  const staticCanvas = drawPrimaryStatic(state);
  ctx.drawImage(staticCanvas, 0, 0);

  ctx.save();
  ctx.beginPath();
  ctx.rect(state.left, state.top, plotWidth(state), plotHeight(state));
  ctx.clip();

  if (state.chartData.length > 0) {
    const visibleBounds = getVisibleBounds(state.chartData, state.timeStart, state.timeEnd);
    if (!visibleBounds) {
      ctx.restore();
      return;
    }

    if (state.chartType === "line") {
      drawLineChart(ctx, state, state.chartData, visibleBounds.from, visibleBounds.to, "#26A69A", 2);
    } else if (state.chartType === "area") {
      drawAreaChart(ctx, state, state.chartData, visibleBounds.from, visibleBounds.to, "#26A69A");
    } else {
      const candles = ticksToOHLC(state.chartData, state.timeframe);
      const visibleCandles = getVisibleCandleBounds(candles, state.timeStart, state.timeEnd);
      if (!visibleCandles) {
        ctx.restore();
        return;
      }

      if (state.chartType === "candle") {
        drawCandleChart(ctx, state, candles, visibleCandles.from, visibleCandles.to, "#26A69A", "#EF5350", "#666666");
      } else if (state.chartType === "hollow") {
        drawHollowCandleChart(ctx, state, candles, visibleCandles.from, visibleCandles.to, "#26A69A", "#EF5350", "#666666");
      } else if (state.chartType === "ohlc") {
        drawOHLCChart(ctx, state, candles, visibleCandles.from, visibleCandles.to, "#26A69A", "#EF5350");
      }
    }
  }

  ctx.restore();
}
