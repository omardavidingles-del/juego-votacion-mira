// --- VARIABLES DE ESTADO ---
let puntos = 0;
let tiempo = 60;
let intervalo;
let votoSenado = null;
let votoCamara = null;

// --- REFERENCIAS DOM ---
const inicioScreen = document.getElementById('pantalla-inicio');
const juegoScreen = document.getElementById('pantalla-juego');
const modalRes = document.getElementById('modal-resultado');

const tiempoTxt = document.getElementById('tiempo');
const puntosTxt = document.getElementById('puntos');
const tarjeton = document.querySelector('.tarjeton-wrapper');

// --- EVENTOS INICIALES ---

// 1. Selección de Perfil (Inicia el juego)
document.querySelectorAll('.btn-perfil').forEach(btn => {
  btn.addEventListener('click', () => {
    iniciarJuego();
  });
});

// 2. Mecánica de Votación (Clic en casillas)
document.querySelectorAll('.casilla').forEach(casilla => {
  casilla.addEventListener('click', function() {
    const tipo = this.dataset.tipo; // 'senado' o 'camara'
    const valor = this.dataset.valor; // 'bien' o 'mal'

    // a. Desmarcar cualquier otra casilla en la misma columna
    // Esto asegura que solo haya un voto por corporación
    document.querySelectorAll(`.casilla[data-tipo="${tipo}"]`).forEach(c => {
      c.classList.remove('seleccionada');
    });

    // b. Marcar la casilla actual
    this.classList.add('seleccionada');

    // c. Guardar la elección
    if (tipo === 'senado') votoSenado = valor;
    if (tipo === 'camara') votoCamara = valor;
  });
});

// 3. Botón VOTAR
document.getElementById('btn-votar').addEventListener('click', procesarVoto);

// 4. Botones de Navegación (Reiniciar y Salir)
document.getElementById('btn-reiniciar').addEventListener('click', iniciarJuego);

document.getElementById('btn-home').addEventListener('click', () => {
  if (confirm("¿Seguro que quieres salir? Perderás el progreso actual.")) {
    volverAlInicio();
  }
});

document.getElementById('btn-salir-modal').addEventListener('click', volverAlInicio);

// --- FUNCIONES DEL JUEGO ---

function iniciarJuego() {
  // Resetear variables
  puntos = 0;
  tiempo = 60;
  votoSenado = null;
  votoCamara = null;

  // Resetear UI
  puntosTxt.textContent = puntos;
  tiempoTxt.textContent = tiempo;
  tiempoTxt.style.color = "inherit"; // Resetear color rojo
  document.querySelectorAll('.casilla').forEach(c => c.classList.remove('seleccionada'));

  // Cambiar pantallas
  inicioScreen.classList.remove('activo');
  inicioScreen.classList.add('oculto');
  
  modalRes.classList.add('oculto');
  
  juegoScreen.classList.remove('oculto');
  juegoScreen.classList.add('activo');

  // Iniciar Temporizador
  clearInterval(intervalo);
  intervalo = setInterval(() => {
    tiempo--;
    tiempoTxt.textContent = tiempo;
    
    // Alerta visual de poco tiempo (rojo)
    if(tiempo <= 10) tiempoTxt.style.color = "#d32f2f";

    if (tiempo <= 0) {
      finalizarPartida(false, "tiempo");
    }
  }, 1000);
}

function procesarVoto() {
  // Validación 1: ¿Votó en ambos?
  if (!votoSenado || !votoCamara) {
    alert("⚠️ ¡Atención! Tu voto no es válido si no marcas una opción en Senado y una en Cámara.");
    return;
  }

  // Validación 2: ¿Votó correctamente?
  if (votoSenado === 'bien' && votoCamara === 'bien') {
    puntos += 100; // Puntos por victoria
    puntosTxt.textContent = puntos;
    finalizarPartida(true, "victoria");
  } else {
    // Penalización y Feedback visual
    tarjeton.classList.add('shake'); // Efecto de temblor
    setTimeout(() => tarjeton.classList.remove('shake'), 500);
    
    puntos = Math.max(0, puntos - 10);
    puntosTxt.textContent = puntos;
    
    // Mensaje educativo específico
    let mensajeError = "Tu voto sería nulo o incorrecto.\n";
    if (votoSenado !== 'bien') mensajeError += "❌ En Senado busca el logo MIRA y el número 2.\n";
    if (votoCamara !== 'bien') mensajeError += "❌ En Cámara busca el logo MIRA y el número 12.";
    
    alert(mensajeError);
  }
}

function finalizarPartida(gano, motivo) {
  clearInterval(intervalo);
  
  const titulo = document.getElementById('titulo-res');
  const icono = document.getElementById('icono-res');
  const mensaje = document.getElementById('mensaje-res');

  modalRes.classList.remove('oculto');

  if (gano) {
    titulo.textContent = "¡VOTO PERFECTO!";
    titulo.style.color = "#28a745";
    icono.textContent = "🎉";
    mensaje.textContent = "¡Has marcado correctamente MIRA (2) y MIRA (12)! Tu voto es válido.";
  } else if (motivo === "tiempo") {
    titulo.textContent = "¡TIEMPO AGOTADO!";
    titulo.style.color = "#dc3545";
    icono.textContent = "⏰";
    mensaje.textContent = "Se acabó el tiempo en la urna. Recuerda ubicar el logo Azul de MIRA rápidamente.";
  }
}

function volverAlInicio() {
  clearInterval(intervalo);
  // Ocultar juego y resultados
  juegoScreen.classList.remove('activo');
  juegoScreen.classList.add('oculto');
  modalRes.classList.add('oculto');
  
  // Mostrar inicio
  inicioScreen.classList.remove('oculto');
  inicioScreen.classList.add('activo');
}

