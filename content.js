//Script de código que controlará el contador de mensajes en ChatGPT e interrumpe el uso cuando se llega al límite

const DAILY_LIMIT = 5; // Límite diario de consultas de prueba

function checkUsage(event) {
  const today = new Date().toISOString().split('T')[0];

  chrome.storage.local.get([today], (result) => {
    let currentCount = result[today] || 0;

    if (currentCount >= DAILY_LIMIT) {
      // Bloquea el envío del mensaje en la plataforma
      event.preventDefault();
      event.stopPropagation();

      // Muestra la alerta con el mensaje reflexivo preprogramado
      const alertMsg = getRandomMessage();
      alert(`⚠️ LÍMITE DIARIO ALCANZADO ⚠️\n\n${alertMsg}`);
    } else {
      // Incrementa el contador del día actual
      chrome.storage.local.set({ [today]: currentCount + 1 });
    }
  });
}

// Escuchar cuando el usuario presiona "Enter" en la caja de texto de ChatGPT
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    checkUsage(e);
  }
}, true);