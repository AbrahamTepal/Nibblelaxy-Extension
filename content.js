//Script de código que controlará el contador de mensajes en ChatGPT e interrumpe el uso cuando se llega al límite

const DAILY_LIMIT = 5; // Límite diario de prueba

// Función para aplicar bloqueo visual y técnico persistente en la página
function enforceBlockade(message) {
  // 1. Inyecta un estilo global que bloquea cualquier intento de escribir o hacer clic en los controles del chat
  if (!document.getElementById("nibblelaxy-block-style")) {
    const style = document.createElement("style");
    style.id = "nibblelaxy-block-style";
    style.innerHTML = `
      #nibblelaxy-block-banner {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        background-color: #d9534f !important;
        color: white !important;
        text-align: center !important;
        padding: 14px 20px !important;
        z-index: 2147483647 !important;
        font-weight: bold !important;
        font-size: 15px !important;
        box-shadow: 0px 4px 10px rgba(0,0,0,0.3) !important;
        font-family: system-ui, -apple-system, sans-serif !important;
      }
      /* Deshabilita el área del prompt y el botón de enviar */
      form, #prompt-textarea, button[data-testid="send-button"] {
        pointer-events: none !important;
        opacity: 0.4 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 2. Muestra el banner superior reflexivo
  if (!document.getElementById("nibblelaxy-block-banner")) {
    const banner = document.createElement("div");
    banner.id = "nibblelaxy-block-banner";
    banner.innerText = `LÍMITE DIARIO ALCANZADO\n${message}`;
    document.body.appendChild(banner);
  }
}

function checkUsageAndBlock(event) {
  const today = new Date().toISOString().split('T')[0];

  chrome.storage.local.get([today], (result) => {
    let currentCount = result[today] || 0;

    if (currentCount >= DAILY_LIMIT) {
      // Bloquea el evento de inmediato
      if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
      const alertMsg = getRandomMessage();
      enforceBlockade(alertMsg);
    } else if (event) {
      // Si aún no alcanza el límite, incrementa el contador
      chrome.storage.local.set({ [today]: currentCount + 1 });
    }
  });
}

// Verifica si ya se alcanzó el límite al cargar/recargar la página
checkUsageAndBlock(null);

// Intercepta la tecla Enter en fase de captura
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    checkUsageAndBlock(e);
  }
}, true);

// Intercepta clics en el botón de envío en fase de captura
document.addEventListener('click', (e) => {
  const sendBtn = e.target.closest('button[data-testid="send-button"], button[aria-label*="Send"]');
  if (sendBtn) {
    checkUsageAndBlock(e);
  }
}, true);