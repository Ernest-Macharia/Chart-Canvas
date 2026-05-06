export type IndicatorType = "none" | "sma" | "ema";

export type IndicatorSeriesPoint = number | null;

export function sma(data: number[], period: number): IndicatorSeriesPoint[] {
  const result: IndicatorSeriesPoint[] = [];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    sum += data[i];

    if (i >= period) {
      sum -= data[i - period];
    }

    if (i < period - 1) {
      result.push(null);
    } else {
      result.push(sum / period);
    }
  }

  return result;
}

export function ema(data: number[], period: number): IndicatorSeriesPoint[] {
  const result: IndicatorSeriesPoint[] = [];
  const alpha = 2 / (period + 1);

  let prevEma: number | null = null;

  for (let i = 0; i < data.length; i++) {
    const price: number = data[i];

    if (i < period - 1) {
      result.push(null);
      continue;
    }

    if (prevEma === null) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += data[j];
      }
      prevEma = sum / period;
      result.push(prevEma);
      continue;
    }

    const currentEma: number = alpha * price + (1 - alpha) * prevEma;
    result.push(currentEma);
    prevEma = currentEma;
  }

  return result;
}

export function computeIndicator(data: number[], type: IndicatorType, period: number): IndicatorSeriesPoint[] {
  if (type === "sma") return sma(data, period);
  if (type === "ema") return ema(data, period);
  return data.map(() => null);
}
