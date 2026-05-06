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

export function createIndicatorControls(
  state: State,
  redraw: () => void
): HTMLDivElement {
  const container = document.createElement("div");
  container.style.cssText = "display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap;";

  const label = document.createElement("span");
  label.innerText = "Indicator";
  label.style.cssText = "font-size:13px;font-weight:600;color:#1e293b;font-family:monospace;";
  container.appendChild(label);

  const select = document.createElement("select");
  select.style.cssText = "padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;background:#ffffff;color:#0f172a;font-size:13px;font-family:monospace;";
  const options = [
    { value: "none", label: "None" },
    { value: "sma", label: "SMA" },
    { value: "ema", label: "EMA" },
  ] as const;
  for (const option of options) {
    const el = document.createElement("option");
    el.value = option.value;
    el.innerText = option.label;
    if (state.indicatorType === option.value) el.selected = true;
    select.appendChild(el);
  }

  const periodInput = document.createElement("input");
  periodInput.type = "number";
  periodInput.min = "2";
  periodInput.max = "500";
  periodInput.step = "1";
  periodInput.value = String(state.indicatorPeriod);
  periodInput.style.cssText = "width:80px;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;background:#ffffff;color:#0f172a;font-size:13px;font-family:monospace;";
  periodInput.title = "Indicator period";

  const periodLabel = document.createElement("span");
  periodLabel.innerText = "Period";
  periodLabel.style.cssText = "font-size:13px;font-weight:500;color:#334155;font-family:monospace;";

  const colorLabel = document.createElement("span");
  colorLabel.innerText = "Color";
  colorLabel.style.cssText = "font-size:13px;font-weight:500;color:#334155;font-family:monospace;";

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = state.indicatorColor;
  colorInput.style.cssText = "width:42px;height:32px;padding:0;border:1px solid #cbd5e1;border-radius:6px;background:#ffffff;cursor:pointer;";
  colorInput.title = "Indicator color";

  const widthLabel = document.createElement("span");
  widthLabel.innerText = "Width";
  widthLabel.style.cssText = "font-size:13px;font-weight:500;color:#334155;font-family:monospace;";

  const widthInput = document.createElement("input");
  widthInput.type = "number";
  widthInput.min = "1";
  widthInput.max = "8";
  widthInput.step = "1";
  widthInput.value = String(state.indicatorLineWidth);
  widthInput.style.cssText = "width:64px;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;background:#ffffff;color:#0f172a;font-size:13px;font-family:monospace;";
  widthInput.title = "Indicator line width";

  const refreshPeriodState = () => {
    const disabled = state.indicatorType === "none";
    periodInput.disabled = disabled;
    colorInput.disabled = disabled;
    widthInput.disabled = disabled;
    periodLabel.style.opacity = disabled ? "0.5" : "1";
    colorLabel.style.opacity = disabled ? "0.5" : "1";
    widthLabel.style.opacity = disabled ? "0.5" : "1";
    periodInput.style.opacity = disabled ? "0.6" : "1";
    colorInput.style.opacity = disabled ? "0.6" : "1";
    widthInput.style.opacity = disabled ? "0.6" : "1";
  };

  select.onchange = () => {
    const next = select.value;
    if (next === "none" || next === "sma" || next === "ema") {
      state.indicatorType = next;
      refreshPeriodState();
      redraw();
    }
  };

  const applyPeriod = () => {
    const parsed = Number.parseInt(periodInput.value, 10);
    const normalized = Number.isFinite(parsed) ? Math.max(2, Math.min(500, parsed)) : 20;
    periodInput.value = String(normalized);
    if (state.indicatorPeriod !== normalized) {
      state.indicatorPeriod = normalized;
      redraw();
    }
  };
  periodInput.oninput = applyPeriod;
  periodInput.onchange = applyPeriod;

  colorInput.oninput = () => {
    if (state.indicatorColor !== colorInput.value) {
      state.indicatorColor = colorInput.value;
      redraw();
    }
  };

  const applyWidth = () => {
    const parsed = Number.parseInt(widthInput.value, 10);
    const normalized = Number.isFinite(parsed) ? Math.max(1, Math.min(6, parsed)) : 2;
    widthInput.value = String(normalized);
    if (state.indicatorLineWidth !== normalized) {
      state.indicatorLineWidth = normalized;
      redraw();
    }
  };
  widthInput.oninput = applyWidth;
  widthInput.onchange = applyWidth;

  refreshPeriodState();
  container.appendChild(select);
  container.appendChild(periodLabel);
  container.appendChild(periodInput);
  container.appendChild(colorLabel);
  container.appendChild(colorInput);
  container.appendChild(widthLabel);
  container.appendChild(widthInput);

  return container;
}
