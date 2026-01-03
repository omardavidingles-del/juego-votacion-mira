// --- SISTEMA DE SONIDO (Sintetizador Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function tocarSonido(tipo) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  if (tipo === 'click') {
    // Sonido corto "pop"
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
    
  } else if (tipo === 'win') {
    // Fanfarria de victoria
    playTone(523.25, 0, 0.1); // Do
    playTone(659.25, 0.1, 0.1); // Mi
    playTone(783.99, 0.2, 0.2); // Sol
    playTone(1046.50, 0.3, 0.4); // Do agudo
    
  } else if (tipo === 'error') {
    // Sonido grave de error
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  }
}

function playTone(freq, delay, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.start(audioCtx.currentTime + delay);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
  osc.stop(audioCtx.currentTime + delay + duration);
}

// --- VARIABLES ---
let puntos = 0;
let tiempo = 60;
let intervalo;
let votoSenado = null;
let votoCamara = null;

// --- DOM ---
const inicioScreen = document.getElementById('pantalla-inicio');
const juegoScreen = document.getElementById('pantalla-juego');
const modalRes = document.getElementById('modal-resultado');
const tiempoTxt = document.getElementById('tiempo');
const puntosTxt = document.getElementById('puntos');
const tarjeton = document.querySelector('.tarjeton-wrapper');

// --- EVENTOS ---
document.querySelectorAll('.btn-perfil').forEach(btn => {
  btn.addEventListener('click', () => {
    tocarSonido('click');
    iniciarJuego();
  });
});

document.querySelectorAll('.casilla').forEach(casilla => {
  casilla.addEventListener('click', function() {
    tocarSonido('click');
    
    const tipo = this.dataset.tipo;
    const valor = this.dataset.valor;

    // Desmarcar otros de la misma columna
    document.querySelectorAll(`.casilla[data-tipo="${tipo}"]`).forEach(c => {
      c.classList.remove('seleccionada');
    });

    // Marcar este
    this.classList.add('seleccionada');

    if (tipo === 'senado') votoSenado = valor;
    if (tipo === 'camara') votoCamara = valor;
  });
});

document.getElementById('btn-votar').addEventListener('click', procesarVoto);
document.getElementById('btn-reiniciar').addEventListener('click', iniciarJuego);
document.getElementById('btn-salir-modal').addEventListener('click', volverAlInicio);
document.getElementById('btn-home').addEventListener('click', () => {
  if (confirm("¿Seguro que quieres salir?")) volverAlInicio();
});

// --- LÓGICA ---
function iniciarJuego() {
  puntos = 0;
  tiempo = 60;
  votoSenado = null;
  votoCamara = null;
  
  puntosTxt.textContent = puntos;
  tiempoTxt.textContent = tiempo;
  tiempoTxt.style.color = "inherit";
  
  document.querySelectorAll('.casilla').forEach(c => c.classList.remove('seleccionada'));
  inicioScreen.classList.remove('activo');
  inicioScreen.classList.add('oculto');
  modalRes.classList.add('oculto');
  juegoScreen.classList.remove('oculto');
  juegoScreen.classList.add('activo');

  clearInterval(intervalo);
  intervalo = setInterval(() => {
    tiempo--;
    tiempoTxt.textContent = tiempo;
    if(tiempo <= 10) tiempoTxt.style.color = "#d32f2f";
    if (tiempo <= 0) finalizarPartida(false, "tiempo");
  }, 1000);
}

function procesarVoto() {
  if (!votoSenado || !votoCamara) {
    alert("⚠️ ¡Falta marcar! Elige una opción en Senado y una en Cámara.");
    return;
  }

  if (votoSenado === 'bien' && votoCamara === 'bien') {
    // GANÓ
    tocarSonido('win');
    puntos += 100;
    puntosTxt.textContent = puntos;
    lanzarConfeti(); // Efecto especial
    finalizarPartida(true, "victoria");
  } else {
    // PERDIÓ
    tocarSonido('error');
    tarjeton.classList.add('shake');
    setTimeout(() => tarjeton.classList.remove('shake'), 500);
    
    puntos = Math.max(0, puntos - 10);
    puntosTxt.textContent = puntos;
    
    let msg = "Voto Incorrecto.\n";
    if (votoSenado !== 'bien') msg += "❌ Senado: Busca MIRA y el número 2.\n";
    if (votoCamara !== 'bien') msg += "❌ Cámara: Busca MIRA y el número 12.";
    alert(msg);
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
    icono.textContent = "🏆";
    mensaje.textContent = "¡Has votado correctamente por MIRA (2 y 12)!";
  } else {
    titulo.textContent = motivo === "tiempo" ? "¡TIEMPO AGOTADO!" : "VOTO NULO";
    titulo.style.color = "#dc3545";
    icono.textContent = motivo === "tiempo" ? "⏰" : "💀";
    mensaje.textContent = "Inténtalo de nuevo. Recuerda: Logo Azul y números 2 y 12.";
  }
}

function volverAlInicio() {
  clearInterval(intervalo);
  juegoScreen.classList.remove('activo');
  juegoScreen.classList.add('oculto');
  modalRes.classList.add('oculto');
  inicioScreen.classList.remove('oculto');
  inicioScreen.classList.add('activo');
}

// Función Confeti
function lanzarConfeti() {
  var count = 200;
  var defaults = { origin: { y: 0.7 } };
  function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, {
      particleCount: Math.floor(count * particleRatio)
    }));
  }
  fire(0.25, { spread: 26, startVelocity: 55, });
  fire(0.2, { spread: 60, });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45, });
}
