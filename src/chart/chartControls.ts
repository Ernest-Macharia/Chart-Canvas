import type { State } from "./types";

export function createChartTypeControls(
  state: State,
  redraw: () => void
): HTMLDivElement {
  const container = document.createElement("div");
  container.style.cssText = "display:flex;gap:8px;margin-top:8px;justify-content:center;";
  
  const types = [
    { id: "line", label: "Line Chart" },
    { id: "area", label: "Area Chart" }
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
