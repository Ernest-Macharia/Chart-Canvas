import { world } from "./world";
import { clampTimeRange } from "./clamp";

let isDragging = false;
let lastMouseX = 0;

const data = {
  timeMin: 0,
  timeMax: 200
};

/**
 * Enables click + drag panning
 */
export function enablePan(
  canvas: HTMLCanvasElement,
  plotLeft: number,
  plotRight: number,
  redraw: () => void
) {
  // Start dragging
  canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
  });

  // Stop dragging
  canvas.addEventListener("mouseup", () => {
    isDragging = false;
  });

  canvas.addEventListener("mouseleave", () => {
    isDragging = false;
  });

  // Handle movement
  canvas.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    // calculate pixel movement
    const deltaPixels = e.clientX - lastMouseX;

    // update last position
    lastMouseX = e.clientX;

    // convert movement → world shift
    panTime(
      deltaPixels,
      canvas.clientWidth,
      plotLeft,
      plotRight,
      data.timeMin,
      data.timeMax
    );

    redraw();
  });
}

/**
 * Moves the visible time window
 */
export function panTime(
  deltaPixels: number,
  canvasWidth: number,
  plotLeft: number,
  plotRight: number,
  dataMin: number,
  dataMax: number
) {
  // Define usable width (ignore gutters)
  const screenStart = plotLeft;
  const screenEnd = canvasWidth - plotRight;
  const screenWidth = screenEnd - screenStart;

  // Current visible world range
  const worldRange = world.timeEnd - world.timeStart;

  // How much 1 pixel = in world units
  const worldPerPixel = worldRange / screenWidth;

  // Convert pixel movement to world movement
  const shift = deltaPixels * worldPerPixel;

  // Move the "camera window"
  world.timeStart -= shift;
  world.timeEnd -= shift;

  // clamp after movement
  clampTimeRange(dataMin, dataMax);
}