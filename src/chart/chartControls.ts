import type { State } from "./types";
import { goToLatest, shouldShowLatestButton } from "./time";

export function createFloatingLatestButton(
  state: State,
  redraw: () => void,
  paddingRatio: number = 0.30
): HTMLButtonElement {
  const button = document.createElement("button");
  button.innerText = "LATEST";
  button.title = "Go to latest data";
  
  // Style the button to appear in bottom right
  button.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    padding: 10px 20px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    font-family: monospace;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    transition: all 0.2s ease;
    opacity: 0;
    transform: translateY(10px);
    pointer-events: none;
  `;
  
  // Add hover effect
  button.onmouseenter = () => {
    button.style.background = "#2563eb";
    button.style.transform = "scale(1.05)";
  };
  
  button.onmouseleave = () => {
    button.style.background = "#3b82f6";
    button.style.transform = "scale(1)";
  };
  
  // Function to update button visibility
  function updateVisibility() {
    const shouldShow = shouldShowLatestButton(state);
    
    if (shouldShow) {
      button.style.opacity = "1";
      button.style.transform = "translateY(0)";
      button.style.pointerEvents = "auto";
    } else {
      button.style.opacity = "0";
      button.style.transform = "translateY(10px)";
      button.style.pointerEvents = "none";
    }
  }
  
  // Click handler
  button.onclick = () => {
    goToLatest(state, paddingRatio);
    updateVisibility();
    redraw();
  };
  
  // Store the update function on the button for external calls
  (button as any).updateVisibility = updateVisibility;
  
  // Initial visibility check
  updateVisibility();
  
  return button;
}

// Update existing createChartTypeControls if needed
export function createChartTypeControls(
  state: State,
  redraw: () => void
): HTMLDivElement {
  const container = document.createElement("div");
  container.style.cssText = "display:flex;gap:8px;margin-top:8px;justify-content:center;";
  
  const types = [
    { id: "line", label: "Line Chart" },
    { id: "area", label: "Area Chart" },
    { id: "candle", label: "Candlestick" },
    { id: "hollow", label: "Hollow Candle" },
    { id: "ohlc", label: "OHLC" }
  ] as const;
  
  types.forEach(({ id, label }) => {
    const btn = document.createElement("button");
    btn.innerText = label;
    btn.style.cssText = `
      padding: 6px 16px;
      background: ${state.chartType === id ? "#3b82f6" : "#e2e8f0"};
      color: ${state.chartType === id ? "white" : "#1e293b"};
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    `;
    
    btn.onmouseenter = () => {
      if (state.chartType !== id) {
        btn.style.background = "#cbd5e1";
      }
    };
    
    btn.onmouseleave = () => {
      if (state.chartType !== id) {
        btn.style.background = "#e2e8f0";
      }
    };
    
    btn.onclick = () => {
      state.chartType = id;
      redraw();
      container.querySelectorAll("button").forEach(button => {
        button.style.background = "#e2e8f0";
        button.style.color = "#1e293b";
      });
      btn.style.background = "#3b82f6";
      btn.style.color = "white";
    };
    
    container.appendChild(btn);
  });
  
  return container;
}