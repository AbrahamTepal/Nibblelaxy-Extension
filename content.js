const DAILY_LIMIT = 2; // Límite diario de consultas configurado para la prueba
const ML_PER_PROMPT = 15; // Estimación basada en la investigación del proyecto (15 ml por consulta)

let blockedAttemptsToday = 0;

// Función para obtener la clave de fecha local exacta sin desfases de UTC
function getLocalDateKey(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Función principal para inyectar el panel lateral
function injectSidebarDashboard() {
  if (document.getElementById("nibblelaxy-sidebar")) return;

  const todayObj = new Date();
  const todayKey = getLocalDateKey(todayObj);

  // Generamos las claves de los últimos 5 días reales sin desfase
  const daysKeys = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(todayObj.getDate() - i);
    daysKeys.push(getLocalDateKey(d));
  }

  const storageKeys = [...daysKeys, 'blocked_' + todayKey, 'nibble_theme'];

  chrome.storage.local.get(storageKeys, (result) => {
    const currentCount = result[todayKey] || 0;
    blockedAttemptsToday = result['blocked_' + todayKey] || 0;
    const currentTheme = result['nibble_theme'] || 'dark';

    const totalMl = currentCount * ML_PER_PROMPT;
    let waterText = totalMl >= 1000 ? `${(totalMl / 1000).toFixed(2)} Litros` : `${totalMl} ml`;
    const glasses = (totalMl / 250).toFixed(1);

    const themeIcon = currentTheme === 'dark' ? '☀️' : '🌙';
    const themeTooltip = currentTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

    let statusText = "Óptimo";
    let statusColor = currentTheme === 'dark' ? "#10b981" : "#059669"; 
    let statusBg = currentTheme === 'dark' ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5";
    if (currentCount >= 1 && currentCount < DAILY_LIMIT) {
      statusText = "Moderado";
      statusColor = currentTheme === 'dark' ? "#fbbf24" : "#d97706";
      statusBg = currentTheme === 'dark' ? "rgba(251, 191, 36, 0.15)" : "#fffbeb";
    } else if (currentCount >= DAILY_LIMIT) {
      statusText = "Crítico (Bloqueado)";
      statusColor = currentTheme === 'dark' ? "#ef4444" : "#dc2626";
      statusBg = currentTheme === 'dark' ? "rgba(239, 68, 68, 0.15)" : "#fef2f2";
    }

    const savedMl = blockedAttemptsToday * ML_PER_PROMPT;

    const mlValues = daysKeys.map(key => (result[key] || 0) * ML_PER_PROMPT);

    // Mapeo corregido de días de la semana con abreviaturas claras (L, Ma, Mi, J, V, S, D)
    const dayNames = daysKeys.map(key => {
      const parts = key.split('-');
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      const weekdays = ['Do', 'L', 'Ma', 'Mi', 'J', 'V', 'S'];
      return weekdays[date.getDay()];
    });

    const scaleMax = 150;
    const heights = mlValues.map(val => Math.min((val / scaleMax) * 90, 90));

    const sidebar = document.createElement("div");
    sidebar.id = "nibblelaxy-sidebar";
    sidebar.className = currentTheme === 'light' ? 'light-theme' : 'dark-theme';
    
    sidebar.innerHTML = `
      <div id="nibblelaxy-header">
        <span>Nibblelaxy | Dashboard ODS 6</span>
        <div class="header-buttons">
          <button id="nibblelaxy-theme-toggle" title="${themeTooltip}">${themeIcon}</button>
          <button id="nibblelaxy-toggle" title="Minimizar panel">-</button>
        </div>
      </div>
      <div id="nibblelaxy-body">
        
        <div class="nibble-section-title">Estatus de Interacción</div>
        <div class="nibble-status-badge" style="background-color: ${statusBg}; border-color: ${statusColor}; color: ${statusColor};">
          Nivel: <strong id="nibble-status-text">${statusText}</strong>
        </div>

        <div class="nibble-section-title">Métricas de Uso Diario</div>
        <div class="nibble-metric hover-card">
          <span class="nibble-label">Consultas realizadas hoy:</span>
          <span class="nibble-value" id="nibble-count">${currentCount}</span>
        </div>
        <div class="nibble-metric hover-card">
          <span class="nibble-label">Agua estimada:</span>
          <span class="nibble-value" id="nibble-water">${waterText}</span>
        </div>
        
        <div class="nibble-box hover-card">
          Tus consultas equivalen a <strong>${glasses} vasos</strong> de agua (250 ml) evaporados en servidores (ODS 6 y 12).
        </div>

        <div class="nibble-section-title" style="margin-top: 14px;">Impacto de Ahorro Hídrico</div>
        <div class="nibble-saved-box hover-card">
          Agua protegida por bloqueo: <strong id="nibble-saved-val">${savedMl} ml</strong>
        </div>

        <div class="nibble-section-title" style="margin-top: 14px;">Huella Hídrica Histórica (5 Días)</div>
        
        <div class="chart-wrapper">
          <div class="y-axis-label">Agua (ml)</div>
          <div class="y-axis-scale">
            <span>150ml</span>
            <span>75ml</span>
            <span>0ml</span>
          </div>

          <div class="chart-area-container">
            <div class="nibble-chart">
              <div class="chart-bar-container">
                <span class="bar-exact-value">${Math.round(mlValues[0])}</span>
                <div class="chart-bar" style="height: ${heights[0]}px;"></div>
                <span class="chart-label">${dayNames[0]}</span>
              </div>
              <div class="chart-bar-container">
                <span class="bar-exact-value">${Math.round(mlValues[1])}</span>
                <div class="chart-bar" style="height: ${heights[1]}px;"></div>
                <span class="chart-label">${dayNames[1]}</span>
              </div>
              <div class="chart-bar-container">
                <span class="bar-exact-value">${Math.round(mlValues[2])}</span>
                <div class="chart-bar" style="height: ${heights[2]}px;"></div>
                <span class="chart-label">${dayNames[2]}</span>
              </div>
              <div class="chart-bar-container">
                <span class="bar-exact-value">${Math.round(mlValues[3])}</span>
                <div class="chart-bar" style="height: ${heights[3]}px;"></div>
                <span class="chart-label">${dayNames[3]}</span>
              </div>
              <div class="chart-bar-container">
                <span class="bar-exact-value" id="label-today-val">${Math.round(mlValues[4])}</span>
                <div class="chart-bar active-bar" style="height: ${heights[4]}px;" id="chart-today-bar"></div>
                <span class="chart-label">Hoy</span>
              </div>
            </div>
            
            <div class="x-axis-line"></div>
            <div class="x-axis-label">Días recientes</div>
          </div>
        </div>

        <div class="nibble-tip">
          "Reducir el uso innecesario de la IA fomenta el criterio propio y protege los recursos naturales de México."
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.innerHTML = `
      #nibblelaxy-sidebar {
        position: fixed !important;
        top: 60px !important;
        right: 20px !important;
        width: 320px !important;
        height: auto !important;
        max-height: 92vh !important;
        border-radius: 14px !important;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35) !important;
        z-index: 999998 !important;
        font-family: Arial, sans-serif !important;
        backdrop-filter: blur(12px);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        animation: slideInRight 0.5s ease-out;
      }
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(40px); }
        to { opacity: 1; transform: translateX(0); }
      }
      #nibblelaxy-sidebar.dark-theme {
        background: rgba(15, 23, 42, 0.92) !important;
        border: 1px solid rgba(56, 189, 248, 0.3) !important;
        color: #f8fafc !important;
      }
      #nibblelaxy-sidebar.dark-theme .nibble-metric {
        background: rgba(30, 41, 59, 0.5);
        border-bottom: 1px solid rgba(51, 65, 85, 0.8);
      }
      #nibblelaxy-sidebar.dark-theme .nibble-label { color: #94a3b8; }
      #nibblelaxy-sidebar.dark-theme .nibble-value { color: #38bdf8; }
      #nibblelaxy-sidebar.dark-theme .nibble-box {
        background: rgba(14, 116, 144, 0.2);
        border-left: 4px solid #06b6d4;
        color: #7dd3fc;
      }
      #nibblelaxy-sidebar.dark-theme .nibble-saved-box {
        background: rgba(162, 28, 175, 0.2);
        border-left: 4px solid #e879f9;
        color: #f0abfc;
      }
      #nibblelaxy-sidebar.dark-theme .chart-wrapper {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(51, 65, 85, 0.8);
      }
      #nibblelaxy-sidebar.dark-theme .y-axis-label,
      #nibblelaxy-sidebar.dark-theme .chart-label,
      #nibblelaxy-sidebar.dark-theme .x-axis-label,
      #nibblelaxy-sidebar.dark-theme .nibble-tip { color: #94a3b8; }
      #nibblelaxy-sidebar.dark-theme .bar-exact-value { color: #cbd5e1; }
      #nibblelaxy-sidebar.dark-theme .chart-bar { background-color: #475569; }
      #nibblelaxy-sidebar.dark-theme .chart-bar:hover { background-color: #38bdf8; }
      #nibblelaxy-sidebar.dark-theme .active-bar { background-color: #06b6d4 !important; }

      #nibblelaxy-sidebar.light-theme {
        background: rgba(255, 255, 255, 0.98) !important;
        border: 1px solid #cbd5e1 !important;
        color: #1e293b !important;
      }
      #nibblelaxy-sidebar.light-theme .nibble-metric {
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      #nibblelaxy-sidebar.light-theme .nibble-label { color: #475569; }
      #nibblelaxy-sidebar.light-theme .nibble-value { color: #0284c7; }
      #nibblelaxy-sidebar.light-theme .nibble-box {
        background: #f0f9ff;
        border-left: 4px solid #0284c7;
        color: #0369a1;
      }
      #nibblelaxy-sidebar.light-theme .nibble-saved-box {
        background: #fdf4ff;
        border-left: 4px solid #d946ef;
        color: #86198f;
      }
      #nibblelaxy-sidebar.light-theme .chart-wrapper {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }
      #nibblelaxy-sidebar.light-theme .y-axis-label,
      #nibblelaxy-sidebar.light-theme .chart-label,
      #nibblelaxy-sidebar.light-theme .x-axis-label,
      #nibblelaxy-sidebar.light-theme .nibble-tip { color: #64748b; }
      #nibblelaxy-sidebar.light-theme .bar-exact-value { color: #475569; }
      #nibblelaxy-sidebar.light-theme .chart-bar { background-color: #cbd5e1; }
      #nibblelaxy-sidebar.light-theme .chart-bar:hover { background-color: #0284c7; }
      #nibblelaxy-sidebar.light-theme .active-bar { background-color: #0284c7 !important; }

      #nibblelaxy-header {
        background: linear-gradient(135deg, #0284c7, #06b6d4);
        color: white;
        padding: 12px 16px;
        font-size: 14px;
        font-weight: bold;
        border-top-left-radius: 13px;
        border-top-right-radius: 13px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        letter-spacing: 0.5px;
      }
      .header-buttons {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      #nibblelaxy-toggle, #nibblelaxy-theme-toggle {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-weight: bold;
        cursor: pointer;
        font-size: 13px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      #nibblelaxy-toggle:hover, #nibblelaxy-theme-toggle:hover {
        background: rgba(255, 255, 255, 0.4);
      }
      #nibblelaxy-body {
        padding: 16px;
        font-size: 12px;
        overflow-y: auto;
      }
      .hover-card {
        transition: transform 0.25s ease, box-shadow 0.25s ease;
      }
      .hover-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 16px rgba(6, 182, 212, 0.2);
      }
      .nibble-status-badge {
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid;
        font-size: 12px;
        text-align: center;
        margin-top: 4px;
        margin-bottom: 12px;
        font-weight: bold;
      }
      .nibble-section-title {
        font-size: 10px;
        font-weight: bold;
        color: #38bdf8;
        text-transform: uppercase;
        margin-top: 8px;
        margin-bottom: 6px;
        letter-spacing: 1px;
      }
      .nibble-metric {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        padding: 6px 8px;
        border-radius: 6px;
      }
      .nibble-box, .nibble-saved-box {
        padding: 8px 10px;
        font-size: 11px;
        margin-top: 8px;
        border-radius: 4px;
      }
      .nibble-saved-box { font-weight: bold; }
      .chart-wrapper {
        display: flex;
        align-items: flex-start;
        border-radius: 8px;
        padding: 10px 8px 6px 4px;
        margin-top: 4px;
        position: relative;
      }
      .y-axis-label {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        font-size: 9px;
        font-weight: bold;
        text-align: center;
        margin-right: 4px;
        height: 90px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .y-axis-scale {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 90px;
        font-size: 8px;
        padding-right: 4px;
        text-align: right;
      }
      .chart-area-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-left: 6px;
      }
      .nibble-chart {
        display: flex;
        justify-content: space-around;
        align-items: flex-end;
        height: 90px;
        padding-bottom: 2px;
      }
      .chart-bar-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        height: 100%;
        justify-content: flex-end;
        position: relative;
      }
      .bar-exact-value {
        font-size: 8px;
        font-weight: bold;
        margin-bottom: 2px;
      }
      .chart-bar {
        width: 14px;
        border-radius: 4px 4px 0 0;
        transition: height 0.3s ease, background-color 0.2s ease, transform 0.2s ease;
        min-height: 4px;
      }
      .chart-bar:hover { transform: scaleY(1.05); }
      .x-axis-line {
        width: 100%;
        height: 1px;
        background-color: rgba(100, 116, 139, 0.4);
        margin-top: 2px;
      }
      .x-axis-label {
        font-size: 9px;
        font-weight: bold;
        text-align: center;
        margin-top: 4px;
      }
      .nibble-tip {
        font-size: 10px;
        margin-top: 12px;
        text-align: center;
        font-style: italic;
        line-height: 1.3;
        border-top: 1px solid rgba(100, 116, 139, 0.3);
        padding-top: 6px;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(sidebar);

    document.getElementById("nibblelaxy-theme-toggle").addEventListener("click", () => {
      const isDark = sidebar.classList.contains("dark-theme");
      const newTheme = isDark ? "light" : "dark";
      
      chrome.storage.local.set({ 'nibble_theme': newTheme }, () => {
        sidebar.remove();
        style.remove();
        injectSidebarDashboard();
      });
    });

    let minimized = false;
    document.getElementById("nibblelaxy-toggle").addEventListener("click", () => {
      minimized = !minimized;
      const body = document.getElementById("nibblelaxy-body");
      body.style.display = minimized ? "none" : "block";
      document.getElementById("nibblelaxy-toggle").innerText = minimized ? "+" : "-";
    });
  });
}

function enforceBlockade(message) {
  if (!document.getElementById("nibblelaxy-block-style")) {
    const style = document.createElement("style");
    style.id = "nibblelaxy-block-style";
    style.innerHTML = `
      #nibblelaxy-block-banner {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        background-color: #dc2626 !important;
        color: white !important;
        text-align: center !important;
        padding: 12px 20px !important;
        z-index: 2147483647 !important;
        font-weight: bold !important;
        font-size: 14px !important;
        box-shadow: 0px 4px 10px rgba(0,0,0,0.3) !important;
      }
      form, #prompt-textarea, button[data-testid="send-button"] {
        pointer-events: none !important;
        opacity: 0.4 !important;
      }
    `;
    document.head.appendChild(style);
  }

  if (!document.getElementById("nibblelaxy-block-banner")) {
    const banner = document.createElement("div");
    banner.id = "nibblelaxy-block-banner";
    banner.innerText = `LÍMITE DIARIO ALCANZADO (Nibblelaxy): ${message}`;
    document.body.appendChild(banner);
  }
}

function checkUsageAndBlock(event) {
  const todayKey = getLocalDateKey(new Date());

  chrome.storage.local.get([todayKey, 'blocked_' + todayKey], (result) => {
    let currentCount = result[todayKey] || 0;
    let blockedCount = result['blocked_' + todayKey] || 0;

    if (currentCount >= DAILY_LIMIT) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
      
      blockedCount += 1;
      chrome.storage.local.set({ ['blocked_' + todayKey]: blockedCount }, () => {
        const savedMl = blockedCount * ML_PER_PROMPT;
        const savedValEl = document.getElementById("nibble-saved-val");
        if (savedValEl) {
          savedValEl.innerText = `${savedMl} ml`;
        }
      });

      enforceBlockade("Considera investigar por cuenta propia para proteger los recursos hídricos.");
    } else if (event) {
      chrome.storage.local.set({ [todayKey]: currentCount + 1 }, () => {
        const newCount = currentCount + 1;
        const newMl = newCount * ML_PER_PROMPT;

        const counterEl = document.getElementById("nibble-count");
        if (counterEl) counterEl.innerText = newCount;

        const waterEl = document.getElementById("nibble-water");
        if (waterEl) {
          waterEl.innerText = newMl >= 1000 ? `${(newMl / 1000).toFixed(2)} Litros` : `${newMl} ml`;
        }

        const todayBar = document.getElementById("chart-today-bar");
        const todayValLabel = document.getElementById("label-today-val");
        if (todayBar && todayValLabel) {
          const newHeight = Math.min((newMl / 150) * 90, 90);
          todayBar.style.height = `${newHeight}px`;
          todayValLabel.innerText = Math.round(newMl);
        }
      });
    }
  });
}

window.addEventListener('load', () => {
  setTimeout(injectSidebarDashboard, 1500);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    checkUsageAndBlock(e);
  }
}, true);

document.addEventListener('click', (e) => {
  const sendBtn = e.target.closest('button[data-testid="send-button"], button[aria-label*="Send"]');
  if (sendBtn) {
    checkUsageAndBlock(e);
  }
}, true);