// Arreglo con mensajes reflexivos preprogramados
const REFLECTIVE_MESSAGES = [
  "Has alcanzado tu límite diario de consultas. Recuerda que ChatGPT consume aproximadamente 519 ml de agua para generar 100 palabras.",
  "Límite diario alcanzado. ¿Sabías que los centros de datos consumen miles de litros de agua dulce para enfriar sus servidores en regiones con alto estrés hídrico?",
  "Hoy has agotado tus consultas disponibles. Tómate un momento para analizar el problema por ti mismo y cuidar tu criterio propio :)",
  "¡Tiempo de reflexión! Considera investigar en otras fuentes antes de consultar a una IA para proteger los recursos hídricos de nuestro planeta :)"
];

// Función que selecciona un mensaje de manera aleatoria
function getRandomMessage() {
  const randomIndex = Math.floor(Math.random() * REFLECTIVE_MESSAGES.length);
  return REFLECTIVE_MESSAGES[randomIndex];
}