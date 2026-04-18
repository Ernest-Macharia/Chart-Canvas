export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function findGridStep(
  steps: readonly number[],
  range: number,
  plotSize: number,
  minPixelsPerTick = 60,
): number {
  const idealTickCount = plotSize / minPixelsPerTick;
  const idealStep = range / idealTickCount;

  let bestStep = steps[0];
  for (const step of steps) {
    if (step >= idealStep) {
      bestStep = step;
      break;
    }
    bestStep = step;
  }

  let tickCount = range / bestStep;
  if (tickCount > plotSize / 30) {
    for (const step of steps) {
      if (step > bestStep) {
        bestStep = step;
        break;
      }
    }
  }

  return bestStep;
}
