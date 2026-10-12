// ==========================================
// CONFIGURACIÓN Y CONSTANTES GLOBALES
// ==========================================
const DAILY_LIMIT = 5; // Límite diario de consultas permitidas configurado para la prueba
const ML_PER_PROMPT = 15; // Estimación de agua consumida basada en la investigación del proyecto (15 ml por consulta)

let blockedAttemptsToday = 0; // Contador en memoria de los intentos bloqueados el día de hoy

// Función para obtener la clave de fecha local exacta en formato 'YYYY-MM-DD' sin desfases de zonas horarias (UTC)
function getLocalDateKey(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ==========================================
// CREACIÓN E INYECCIÓN DEL DASHBOARD (SIDEBAR)
// ==========================================
function injectSidebarDashboard() {
  // Evita duplicar el panel si ya se encuentra inyectado en el DOM
  if (document.getElementById("nibblelaxy-sidebar")) return;

  const todayObj = new Date();
  const todayKey = getLocalDateKey(todayObj);

  // Generamos un arreglo con las claves de los últimos 5 días para la gráfica histórica
  const daysKeys = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    d.setDate(todayObj.getDate() - i);
    daysKeys.push(getLocalDateKey(d));
  }

  // Preparamos las llaves a consultar en el almacenamiento local de Chrome
  const storageKeys = [...daysKeys, 'blocked_' + todayKey, 'nibble_theme'];

  chrome.storage.local.get(storageKeys, (result) => {
    // Obtenemos los valores guardados o asignamos valores por defecto
    const currentCount = result[todayKey] || 0;
    blockedAttemptsToday = result['blocked_' + todayKey] || 0;
    const currentTheme = result['nibble_theme'] || 'light';

    // Cálculos individuales para la estimación unitaria (vasos de 250 ml c/u) y el total consumido hoy
    const unitWaterText = `${ML_PER_PROMPT} ml`;
    const totalMl = currentCount * ML_PER_PROMPT;
    let totalWaterText = totalMl >= 1000 ? `${(totalMl / 1000).toFixed(3)} Litros` : `${totalMl} ml`;
    const glasses = (totalMl / 250).toFixed(3);

    // Definición de iconos y textos descriptivos según el tema (claro u oscuro)
    const themeIcon = currentTheme === 'dark' ? '☀️' : '🌙';
    const themeTooltip = currentTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

    // Determinación dinámica de los estatus visuales del usuario
    let statusText = "Óptimo";
    let statusColor = currentTheme === 'dark' ? "#10b981" : "#059669"; 
    let statusBg = currentTheme === 'dark' ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5";
    
    if (currentCount > 0 && currentCount < DAILY_LIMIT) {
      statusText = "Moderado";
      statusColor = currentTheme === 'dark' ? "#fbbf24" : "#d97706";
      statusBg = currentTheme === 'dark' ? "rgba(251, 191, 36, 0.15)" : "#fffbeb";
    } else if (currentCount >= DAILY_LIMIT) {
      statusText = "Crítico (Bloqueado)";
      statusColor = currentTheme === 'dark' ? "#ef4444" : "#dc2626";
      statusBg = currentTheme === 'dark' ? "rgba(239, 68, 68, 0.15)" : "#fef2f2";
    }

    // Cálculo del ahorro total de agua protegido gracias a los bloqueos
    const savedMl = blockedAttemptsToday * ML_PER_PROMPT;

    // Mapeo de valores históricos en mililitros para la gráfica
    const mlValues = daysKeys.map(key => (result[key] || 0) * ML_PER_PROMPT);

    // Cálculo de la escala máxima del Eje Y dinámico
    const maxDataValue = Math.max(...mlValues, 150);
    const scaleMax = maxDataValue <= 150 ? 150 : Math.ceil(maxDataValue / 50) * 50; 
    const midScale = scaleMax / 2;

    // Obtención de las iniciales de los días de la semana correspondientes
    const dayNames = daysKeys.map(key => {
      const parts = key.split('-');
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      const weekdays = ['Do', 'L', 'Ma', 'Mi', 'J', 'V', 'S'];
      return weekdays[date.getDay()];
    });

    // Cálculo proporcional de la altura de las barras (máximo 90px de contenedor)
    const heights = mlValues.map(val => Math.min((val / scaleMax) * 90, 90));

    // Creación del elemento principal del Dashboard lateral
    const sidebar = document.createElement("div");
    sidebar.id = "nibblelaxy-sidebar";
    sidebar.className = currentTheme === 'light' ? 'light-theme' : 'dark-theme';
    
    // Inyección de la estructura HTML interna del panel
    sidebar.innerHTML = `
      <div id="nibblelaxy-header" title="Haz clic y arrastra para mover el panel libremente">
        <span>Control de Consumo Hídrico</span>
        <div class="header-buttons">
          <button id="nibblelaxy-theme-toggle" title="${themeTooltip}">${themeIcon}</button>
          <button id="nibblelaxy-toggle" title="Minimizar panel">-</button>
        </div>
      </div>
      <div id="nibblelaxy-body">
        
        <div class="nibble-section-title">Estatus de Interacción con la IA</div>
        <div class="nibble-status-badge" id="nibble-status-badge" style="background-color: ${statusBg}; border-color: ${statusColor}; color: ${statusColor};">
          Nivel: <strong id="nibble-status-text">${statusText}</strong>
        </div>

        <div class="nibble-section-title">Métricas de Uso Diario</div>
        <div class="nibble-metric hover-card">
          <span class="nibble-label">Consultas realizadas hoy:</span>
          <span class="nibble-value" id="nibble-count">${currentCount}</span>
        </div>
        <div class="nibble-metric hover-card">
          <span class="nibble-label">Agua estimada por consulta:</span>
          <span class="nibble-value">${unitWaterText}</span>
        </div>
        <div class="nibble-metric hover-card">
          <span class="nibble-label">Agua total consumida hoy:</span>
          <span class="nibble-value" id="nibble-water">${totalWaterText}</span>
        </div>
        
        <div class="nibble-box hover-card">
          Tus consultas equivalen a <strong id="nibble-glasses">${glasses}</strong> vasos de agua (250 ml) evaporados en servidores.
        </div>

        <div class="nibble-section-title" style="margin-top: 14px;">Impacto de Ahorro Hídrico</div>
        <div class="nibble-saved-box hover-card">
          Agua protegida por bloqueo: <strong id="nibble-saved-val">${savedMl} ml</strong>
        </div>

        <div class="nibble-section-title" style="margin-top: 14px;">Huella Hídrica Semanal (últimos 5 Días)</div>
        
        <div class="chart-wrapper">
          <div class="y-axis-label">Agua (ml)</div>
          <div class="y-axis-scale">
            <span id="scale-max-label">${scaleMax}ml</span>
            <span id="scale-mid-label">${midScale}ml</span>
            <span>0ml</span>
          </div>

          <div class="chart-area-container">
            <div class="nibble-chart">
              <div class="chart-bar-container">
                <span class="bar-exact-value">${Math.round(mlValues[0])}</span>
                <div class="chart-bar" style="height: ${heights[0]}px;"></div>
              </div>
              <div class="chart-bar-container">
                <span class="bar-exact-value">${Math.round(mlValues[1])}</span>
                <div class="chart-bar" style="height: ${heights[1]}px;"></div>
              </div>
              <div class="chart-bar-container">
                <span class="bar-exact-value">${Math.round(mlValues[2])}</span>
                <div class="chart-bar" style="height: ${heights[2]}px;"></div>
              </div>
              <div class="chart-bar-container">
                <span class="bar-exact-value">${Math.round(mlValues[3])}</span>
                <div class="chart-bar" style="height: ${heights[3]}px;"></div>
              </div>
              <div class="chart-bar-container">
                <span class="bar-exact-value" id="label-today-val">${Math.round(mlValues[4])}</span>
                <div class="chart-bar active-bar" style="height: ${heights[4]}px;" id="chart-today-bar"></div>
              </div>
            </div>
            
            <div class="x-axis-line"></div>

            <div class="chart-days-row">
              <span class="chart-label">${dayNames[0]}</span>
              <span class="chart-label">${dayNames[1]}</span>
              <span class="chart-label">${dayNames[2]}</span>
              <span class="chart-label">${dayNames[3]}</span>
              <span class="chart-label">Hoy</span>
            </div>

            <div class="x-axis-label">Días recientes</div>
          </div>
        </div>

        <div class="nibble-tip">
          "Reducir el uso innecesario de la IA fomenta el criterio propio y protege los recursos naturales del planeta."
        </div>
      </div>
    `;

    // Creación y aplicación de los estilos CSS encapsulados para el panel
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
        cursor: move;
        user-select: none;
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
      .chart-days-row {
        display: flex;
        justify-content: space-around;
        margin-top: 3px;
      }
      .chart-label {
        font-size: 9px;
        font-weight: bold;
        text-align: center;
        flex: 1;
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

    // ==========================================
    // LÓGICA DE ARRASTRE LIBRE (DRAG AND DROP)
    // ==========================================
    const header = document.getElementById("nibblelaxy-header");
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.addEventListener("mousedown", (e) => {
      // Evita activar el arrastre si se interactúa con los botones internos
      if (e.target.tagName === "BUTTON") return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      // Obtenemos la posición actual exacta en pantalla del panel
      const rect = sidebar.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      // Forzamos el uso de setProperty con '!important' para sobrescribir los estilos fijos por defecto y permitir movimiento vertical/horizontal libre
      sidebar.style.setProperty('right', 'auto', 'important');
      sidebar.style.setProperty('bottom', 'auto', 'important');
      sidebar.style.setProperty('left', `${initialLeft}px`, 'important');
      sidebar.style.setProperty('top', `${initialTop}px`, 'important');

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });

    function onMouseMove(e) {
      if (!isDragging) return;
      // Calculamos la distancia recorrida por el cursor respecto al punto inicial
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Actualizamos simultáneamente la posición en el eje X (left) y Y (top)
      sidebar.style.setProperty('left', `${initialLeft + dx}px`, 'important');
      sidebar.style.setProperty('top', `${initialTop + dy}px`, 'important');
    }

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    // Evento para alternar entre modo claro y oscuro guardando la preferencia
    document.getElementById("nibblelaxy-theme-toggle").addEventListener("click", () => {
      const isDark = sidebar.classList.contains("dark-theme");
      const newTheme = isDark ? "light" : "dark";
      
      chrome.storage.local.set({ 'nibble_theme': newTheme }, () => {
        sidebar.remove();
        style.remove();
        injectSidebarDashboard();
      });
    });

    // Evento para minimizar o expandir el panel lateral
    let minimized = false;
    document.getElementById("nibblelaxy-toggle").addEventListener("click", () => {
      minimized = !minimized;
      const body = document.getElementById("nibblelaxy-body");
      body.style.display = minimized ? "none" : "block";
      document.getElementById("nibblelaxy-toggle").innerText = minimized ? "+" : "-";
    });
  });
}

// ==========================================
// CONTROL DE BLOQUEO Y BANNER DE ALERTA
// ==========================================
function enforceBlockade(message) {
  // Inyección de estilos para el banner flotante central y bloqueo de la interfaz de ChatGPT
  if (!document.getElementById("nibblelaxy-block-style")) {
    const style = document.createElement("style");
    style.id = "nibblelaxy-block-style";
    style.innerHTML = `
      #nibblelaxy-block-banner {
        position: fixed !important;
        bottom: 90px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 450px !important;
        background: rgba(15, 23, 42, 0.95) !important;
        color: white !important;
        text-align: center !important;
        padding: 18px 24px !important;
        z-index: 2147483647 !important;
        border-radius: 12px !important;
        border: 1px solid #ef4444 !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
        font-size: 13px !important;
        backdrop-filter: blur(10px);
        animation: fadeInUp 0.4s ease-out;
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      form, #prompt-textarea, button[data-testid="send-button"] {
        pointer-events: none !important;
        opacity: 0.4 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Creación del banner de advertencia con el mensaje reflexivo en renglón aparte
  if (!document.getElementById("nibblelaxy-block-banner")) {
    const banner = document.createElement("div");
    banner.id = "nibblelaxy-block-banner";
    banner.innerHTML = `
      <div style="color: #ef4444; font-weight: bold; font-size: 14px; margin-bottom: 8px;">Has alcanzado tu límite diario de consultas.</div>
      <div style="color: #cbd5e1; font-size: 12px; line-height: 1.4; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 8px;">${message}</div>
    `;
    document.body.appendChild(banner);
  }
}

// Función principal que intercepta las acciones del usuario para validar cuotas y aplicar bloqueos
function checkUsageAndBlock(event) {
  const todayKey = getLocalDateKey(new Date());

  chrome.storage.local.get([todayKey, 'blocked_' + todayKey], (result) => {
    let currentCount = result[todayKey] || 0;
    let blockedCount = result['blocked_' + todayKey] || 0;

    // Si ya se superó el límite, se cancela el evento, se acumula el ahorro y se muestra el bloqueo
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

      const randomMsg = getRandomMessage();
      enforceBlockade(randomMsg);
      return;
    }

    const newCount = currentCount + 1;

    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    // Actualizamos el contador de consultas en el almacenamiento local
    chrome.storage.local.set({ [todayKey]: newCount }, () => {
      const newMl = newCount * ML_PER_PROMPT;
      const newGlasses = (newMl / 250).toFixed(3);

      // Actualización en tiempo real de los elementos visuales del dashboard
      const counterEl = document.getElementById("nibble-count");
      if (counterEl) counterEl.innerText = newCount;

      const waterEl = document.getElementById("nibble-water");
      if (waterEl) {
        waterEl.innerText = newMl >= 1000 ? `${(newMl / 1000).toFixed(2)} Litros` : `${newMl} ml`;
      }

      const glassesEl = document.getElementById("nibble-glasses");
      if (glassesEl) {
        glassesEl.innerText = newGlasses;
      }

      const statusTextEl = document.getElementById("nibble-status-text");
      const statusBadgeEl = document.getElementById("nibble-status-badge");
      const isDarkTheme = document.getElementById("nibblelaxy-sidebar").classList.contains("dark-theme");

      let sText = "Óptimo";
      let sColor = isDarkTheme ? "#10b981" : "#059669";
      let sBg = isDarkTheme ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5";

      if (newCount > 0 && newCount < DAILY_LIMIT) {
        sText = "Moderado";
        sColor = isDarkTheme ? "#fbbf24" : "#d97706";
        sBg = isDarkTheme ? "rgba(251, 191, 36, 0.15)" : "#fffbeb";
      } else if (newCount >= DAILY_LIMIT) {
        sText = "Crítico (Bloqueado)";
        sColor = isDarkTheme ? "#ef4444" : "#dc2626";
        sBg = isDarkTheme ? "rgba(239, 68, 68, 0.15)" : "#fef2f2";
      }

      if (statusTextEl && statusBadgeEl) {
        statusTextEl.innerText = sText;
        statusBadgeEl.style.color = sColor;
        statusBadgeEl.style.borderColor = sColor;
        statusBadgeEl.style.backgroundColor = sBg;
      }

      // Ajustes dinámicos de las barras de la gráfica
      const scaleMax = newMl <= 150 ? 150 : Math.ceil(newMl / 50) * 50;
      const newHeight = Math.min((newMl / scaleMax) * 90, 90);

      const todayBar = document.getElementById("chart-today-bar");
      const todayValLabel = document.getElementById("label-today-val");
      const scaleMaxLabel = document.getElementById("scale-max-label");
      const scaleMidLabel = document.getElementById("scale-mid-label");

      if (todayBar && todayValLabel) {
        todayBar.style.height = `${newHeight}px`;
        todayValLabel.innerText = Math.round(newMl);
      }

      if (scaleMaxLabel && scaleMidLabel) {
        scaleMaxLabel.innerText = `${scaleMax}ml`;
        scaleMidLabel.innerText = `${scaleMax / 2}ml`;
      }

      // Si justo en esta consulta se alcanza el límite, activamos de inmediato el bloqueo
      if (newCount >= DAILY_LIMIT) {
        blockedCount += 1;
        chrome.storage.local.set({ ['blocked_' + todayKey]: blockedCount }, () => {
          const savedMl = blockedCount * ML_PER_PROMPT;
          const savedValEl = document.getElementById("nibble-saved-val");
          if (savedValEl) {
            savedValEl.innerText = `${savedMl} ml`;
          }
        });

        const randomMsg = getRandomMessage();
        enforceBlockade(randomMsg);
      }
    });
  });
}

// ==========================================
// ESCUCHADORES DE EVENTOS GLOBALES (LISTENERS)
// ==========================================

// Inicialización del dashboard al cargar la página tras un pequeño retraso
window.addEventListener('load', () => {
  setTimeout(injectSidebarDashboard, 1500);
});

// Interceptamos la tecla Enter en el área de texto para validar el consumo
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    checkUsageAndBlock(e);
  }
}, true);

// Interceptamos los clics sobre el botón de envío de la interfaz de chat
document.addEventListener('click', (e) => {
  const sendBtn = e.target.closest('button[data-testid="send-button"], button[aria-label*="Send"]');
  if (sendBtn) {
    checkUsageAndBlock(e);
  }
}, true);