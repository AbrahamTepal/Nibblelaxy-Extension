// Constante basada en el promedio de consumo por consulta en ChatGPT (15 ml / prompt)
const ML_PER_PROMPT = 15;

document.addEventListener('DOMContentLoaded', () => {
  // Obtiene la fecha actual en formato AAAA-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // Consulta el almacenamiento local del navegador
  chrome.storage.local.get([today], (result) => {
    const currentCount = result[today] || 0;
    const totalMl = currentCount * ML_PER_PROMPT;

    // Actualiza los elementos del DOM en la interfaz
    document.getElementById('prompts-count').innerText = currentCount;

    // Formatea el volumen en ml o en litros si supera los 1000 ml
    if (totalMl >= 1000) {
      const liters = (totalMl / 1000).toFixed(2);
      document.getElementById('water-volume').innerText = `${liters} Litros`;
    } else {
      document.getElementById('water-volume').innerText = `${totalMl} ml`;
    }

    // Calcula y genera el texto de equivalencia cotidiana
    const equivalenceElement = document.getElementById('equivalence-text');
    if (currentCount === 0) {
      equivalenceElement.innerText = "No has realizado consultas el dia de hoy. Tu huella hidrica digital se mantiene limpia.";
    } else {
      // Equivalencia basada en vasos de agua estándar de 250 ml
      const glasses = (totalMl / 250).toFixed(1);
      equivalenceElement.innerText = `Tus ${currentCount} consultas de hoy equivalen a aproximadamente ${glasses} vasos de agua (250 ml c/u) evaporados para el enfriamiento de servidores.`;
    }
  });
});