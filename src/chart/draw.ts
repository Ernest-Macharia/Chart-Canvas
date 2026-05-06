import { getVisibleBounds } from "./data";
import type { ChartDataPoint } from "./data";
import { drawAreaChart, drawCandleChart, drawHollowCandleChart, drawIndicatorLine, drawLineChart, drawOHLCChart } from "./drawChartTypes";
import { drawPriceGrid, drawTimeGrid } from "./drawGrid";
import { drawPriceLabels, drawTimeLabels } from "./drawLabels";
import { computeIndicator } from "./indicators";
import { getVisibleCandleBounds, ticksToOHLC } from "./ohlc";
import type { CandleData } from "./ohlc";
import { buildPriceAxis, validateAndFixPriceRange } from "./price";
import { plotHeight, plotWidth } from "./state";
import { buildTimeAxis } from "./time";
import { timeToX } from "./transformation";
import type { State } from "./types";

let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenDirty = true;
let offscreenSignature = "";

function getStaticSignature(state: State): string {
  const dpr = window.devicePixelRatio || 1;
  return [
    state.width,
    state.height,
    dpr.toFixed(2),
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
  const dpr = window.devicePixelRatio || 1;
  const targetWidth = Math.max(1, Math.floor(state.width * dpr));
  const targetHeight = Math.max(1, Math.floor(state.height * dpr));

  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement("canvas");
    offscreenDirty = true;
  }
  if (offscreenCanvas.width !== targetWidth || offscreenCanvas.height !== targetHeight) {
    offscreenCanvas.width = targetWidth;
    offscreenCanvas.height = targetHeight;
    offscreenDirty = true;
  }
  return offscreenCanvas;
}

export function markStaticDirty(): void {
  offscreenDirty = true;
}

function decimateTicksForRender(
  data: ChartDataPoint[],
  from: number,
  to: number,
  maxPoints: number,
): ChartDataPoint[] {
  const count = to - from;
  if (count <= 2 || count <= maxPoints) return data.slice(from, to);

  const out: ChartDataPoint[] = [];
  const bucketSize = Math.max(2, Math.ceil(count / maxPoints));

  for (let i = from; i < to; i += bucketSize) {
    const end = Math.min(to, i + bucketSize);
    const first = data[i];
    const last = data[end - 1];

    let low = first;
    let high = first;
    for (let j = i + 1; j < end; j++) {
      const p = data[j];
      if (p.quote < low.quote) low = p;
      if (p.quote > high.quote) high = p;
    }

    out.push(first);
    if (low.epoch !== first.epoch && low.epoch !== last.epoch) out.push(low);
    if (high.epoch !== first.epoch && high.epoch !== last.epoch && high.epoch !== low.epoch) out.push(high);
    if (last.epoch !== first.epoch) out.push(last);
  }

  return out;
}

function aggregateCandlesByPixelColumn(
  state: State,
  candles: CandleData[],
  from: number,
  to: number,
): CandleData[] {
  const count = to - from;
  const visibleWidth = Math.max(1, Math.floor(plotWidth(state)));
  if (count <= visibleWidth * 1.2) return candles.slice(from, to);

  const out: CandleData[] = [];
  let i = from;

  while (i < to) {
    const first = candles[i];
    const x = Math.floor(timeToX(state, first.time));

    let last = first;
    let high = first.high;
    let low = first.low;
    i++;

    while (i < to) {
      const c = candles[i];
      const cx = Math.floor(timeToX(state, c.time));
      if (cx !== x) break;
      if (c.high > high) high = c.high;
      if (c.low < low) low = c.low;
      last = c;
      i++;
    }

    out.push({
      time: first.time,
      open: first.open,
      high,
      low,
      close: last.close,
    });
  }

  return out;
}

function drawPrimaryStatic(state: State): HTMLCanvasElement {
  const canvas = ensureOffscreen(state);
  const sig = getStaticSignature(state);
  if (!offscreenDirty && sig === offscreenSignature) return canvas;

  const offCtx = canvas.getContext("2d");
  if (!offCtx) return canvas;
  const dpr = window.devicePixelRatio || 1;
  offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

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
  if (state.priceMax <= state.priceMin) state.priceMax = state.priceMin + 1;

  const staticCanvas = drawPrimaryStatic(state);
  ctx.drawImage(staticCanvas, 0, 0);

  ctx.save();
  ctx.beginPath();
  ctx.rect(state.left, state.top, plotWidth(state), plotHeight(state));
  ctx.clip();

  if (state.chartData.length > 0) {
    const maxDrawablePoints = Math.max(200, Math.floor(plotWidth(state) * 1.5));
    const visibleBounds = getVisibleBounds(state.chartData, state.timeStart, state.timeEnd);

    if (visibleBounds) {
      const candles = ticksToOHLC(state.chartData, state.timeframe);

      if (state.chartType === "line") {
        const reduced = decimateTicksForRender(state.chartData, visibleBounds.from, visibleBounds.to, maxDrawablePoints);
        drawLineChart(ctx, state, reduced, 0, reduced.length, "#26A69A", 2);
      } else if (state.chartType === "area") {
        const reduced = decimateTicksForRender(state.chartData, visibleBounds.from, visibleBounds.to, maxDrawablePoints);
        drawAreaChart(ctx, state, reduced, 0, reduced.length, "#26A69A");
      } else {
        const visibleCandles = getVisibleCandleBounds(candles, state.timeStart, state.timeEnd);
        if (visibleCandles) {
          const merged = aggregateCandlesByPixelColumn(state, candles, visibleCandles.from, visibleCandles.to);
          if (state.chartType === "candle") {
            drawCandleChart(ctx, state, merged, 0, merged.length, "#26A69A", "#EF5350", "#666666");
          } else if (state.chartType === "hollow") {
            drawHollowCandleChart(ctx, state, merged, 0, merged.length, "#26A69A", "#EF5350", "#666666");
          } else if (state.chartType === "ohlc") {
            drawOHLCChart(ctx, state, merged, 0, merged.length, "#26A69A", "#EF5350");
          }
        }
      }

      if (state.indicatorType !== "none") {
        const indicatorSeries: ChartDataPoint[] = candles.map((c) => ({
          epoch: Math.floor(c.time / 1000),
          quote: c.close,
          symbol: state.chartData[0]?.symbol ?? "",
          pip_size: state.chartData[0]?.pip_size ?? 0,
        }));
        const candleVisibleBounds = getVisibleBounds(indicatorSeries, state.timeStart, state.timeEnd);
        if (candleVisibleBounds) {
          const prices = indicatorSeries.map((p) => p.quote);
          const period = Math.max(2, Math.floor(state.indicatorPeriod));
          const values = computeIndicator(prices, state.indicatorType, period);
          const defaultColor = state.indicatorType === "sma" ? "#1d4ed8" : "#d97706";
          const lineColor = state.indicatorColor || defaultColor;
          const lineWidth = Math.max(1, Math.min(6, state.indicatorLineWidth || 2));
          drawIndicatorLine(ctx, state, indicatorSeries, values, candleVisibleBounds.from, candleVisibleBounds.to, lineColor, lineWidth);
        }
      }
    }
  }

  ctx.restore();
}
