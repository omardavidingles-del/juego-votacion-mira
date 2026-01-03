// --- 1. CONFIGURACIÓN DEL CURSOR ---
const cursor = document.getElementById('cursor-pro');

document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
document.addEventListener('mousedown', () => document.body.classList.add('clicking'));
document.addEventListener('mouseup', () => document.body.classList.remove('clicking'));

// --- 2. SISTEMA DE SONIDO SINTETIZADO ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function tocarSonido(tipo) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  if (tipo === 'click') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  } else if (tipo === 'win') {
    // Fanfarria
    playTone(523, now, 0.1); playTone(659, now+0.1, 0.1); playTone(784, now+0.2, 0.3); playTone(1046, now+0.3, 0.4);
  } else if (tipo === 'error') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.start(now); osc.stop(now + 0.3);
  } else if (tipo === 'combo') {
    playTone(880, now, 0.1); // Sonido agudo combo
  }
}

function playTone(freq, time, duration) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.frequency.value = freq;
  o.start(time);
  g.gain.setValueAtTime(0.1, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + duration);
  o.stop(time + duration);
}

// --- 3. VARIABLES DE ESTADO ---
let puntos = 0;
let tiempo = 60;
let intervalo;
let votoSenado = null;
let votoCamara = null;
let combo = 1;
let record = localStorage.getItem('votaBien_record') || 0;

// Referencias DOM
const inicioScreen = document.getElementById('pantalla-inicio');
const juegoScreen = document.getElementById('pantalla-juego');
const modalRes = document.getElementById('modal-resultado');
const tiempoTxt = document.getElementById('tiempo');
const puntosTxt = document.getElementById('puntos');
const highScoreTxt = document.getElementById('high-score');
const comboDisplay = document.getElementById('combo-display');
const tarjeton = document.querySelector('.tarjeton-wrapper');
const btnShare = document.getElementById('btn-share');

// Inicializar Récord visual
highScoreTxt.textContent = record;

// --- 4. EVENTOS ---
document.querySelectorAll('.btn-perfil').forEach(btn => {
  btn.addEventListener('click', () => {
    tocarSonido('click');
    iniciarJuego();
  });
});

document.querySelectorAll('.casilla').forEach(casilla => {
  casilla.addEventListener('click', function() {
    tocarSonido('click');
    if (navigator.vibrate) navigator.vibrate(30); // Vibración háptica

    const tipo = this.dataset.tipo;
    const valor = this.dataset.valor;

    document.querySelectorAll(`.casilla[data-tipo="${tipo}"]`).forEach(c => c.classList.remove('seleccionada'));
    this.classList.add('seleccionada');

    if (tipo === 'senado') votoSenado = valor;
    if (tipo === 'camara') votoCamara = valor;

    // Lógica de Combos
    if (valor === 'bien') {
      combo++;
      if (combo > 1) {
        comboDisplay.classList.remove('oculto');
        comboDisplay.textContent = `🔥 x${combo}`;
        tocarSonido('combo');
      }
    } else {
      combo = 1;
      comboDisplay.classList.add('oculto');
    }
  });
});

document.getElementById('btn-votar').addEventListener('click', procesarVoto);
document.getElementById('btn-reiniciar').addEventListener('click', iniciarJuego);
document.getElementById('btn-salir-modal').addEventListener('click', volverAlInicio);
document.getElementById('btn-home').addEventListener('click', () => {
  if(confirm("¿Salir?")) volverAlInicio();
});

// --- 5. FUNCIONES DEL JUEGO ---
function iniciarJuego() {
  puntos = 0; tiempo = 60; votoSenado = null; votoCamara = null; combo = 1;
  puntosTxt.textContent = "0";
  tiempoTxt.textContent = "60";
  tiempoTxt.style.color = "inherit";
  comboDisplay.classList.add('oculto');
  highScoreTxt.textContent = record;

  document.querySelectorAll('.casilla').forEach(c => c.classList.remove('seleccionada'));
  inicioScreen.classList.remove('activo'); inicioScreen.classList.add('oculto');
  modalRes.classList.add('oculto');
  juegoScreen.classList.remove('oculto'); juegoScreen.classList.add('activo');

  clearInterval(intervalo);
  intervalo = setInterval(() => {
    tiempo--;
    tiempoTxt.textContent = tiempo;
    if (tiempo <= 10) tiempoTxt.style.color = "#d32f2f";
    if (tiempo <= 0) finalizarPartida(false, "tiempo");
  }, 1000);
}

function procesarVoto() {
  if (!votoSenado || !votoCamara) {
    if(navigator.vibrate) navigator.vibrate([100,50,100]);
    alert("⚠️ ¡Falta marcar! Elige MIRA en Senado y Cámara.");
    return;
  }

  if (votoSenado === 'bien' && votoCamara === 'bien') {
    let puntosGanados = 100 * combo;
    puntos += puntosGanados;
    puntosTxt.textContent = puntos;
    tocarSonido('win');
    lanzarConfeti();
    if(navigator.vibrate) navigator.vibrate(200);
    finalizarPartida(true, "ok");
  } else {
    tocarSonido('error');
    if(navigator.vibrate) navigator.vibrate(500);
    tarjeton.classList.add('shake');
    setTimeout(() => tarjeton.classList.remove('shake'), 500);
    
    puntos = Math.max(0, puntos - 10);
    puntosTxt.textContent = puntos;
    combo = 1;
    comboDisplay.classList.add('oculto');
    
    alert("❌ Error. Busca los números 2 y 102.");
  }
}

function finalizarPartida(gano, motivo) {
  clearInterval(intervalo);
  const titulo = document.getElementById('titulo-res');
  const icono = document.getElementById('icono-res');
  const mensaje = document.getElementById('mensaje-res');
  
  modalRes.classList.remove('oculto');

  // Guardar Récord
  let nuevoRecord = false;
  if (puntos > record) {
    record = puntos;
    localStorage.setItem('votaBien_record', record);
    nuevoRecord = true;
  }

  if (gano) {
    titulo.textContent = nuevoRecord ? "¡NUEVO RÉCORD!" : "¡VOTO PERFECTO!";
    titulo.style.color = nuevoRecord ? "#ff9800" : "#28a745";
    icono.textContent = nuevoRecord ? "👑" : "🏆";
    mensaje.innerHTML = `Puntos: <strong>${puntos}</strong><br>Voto correcto: MIRA (2) y MIRA (102).`;
    
    btnShare.style.display = "inline-flex";
    configurarShare(puntos);
  } else {
    titulo.textContent = motivo === "tiempo" ? "¡TIEMPO AGOTADO!" : "VOTO NULO";
    titulo.style.color = "#dc3545";
    icono.textContent = "💀";
    mensaje.textContent = "Inténtalo de nuevo. Recuerda: 2 y 102.";
    btnShare.style.display = "none";
  }
}

function configurarShare(score) {
  btnShare.onclick = () => {
    const link = window.location.href;
    const text = `🗳️ ¡Reto Vota Bien! \nSaqué ${score} puntos buscando el MIRA 2 y 102. \n¿Puedes ganarme? \n👉 ${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };
}

function volverAlInicio() {
  clearInterval(intervalo);
  juegoScreen.classList.remove('activo'); juegoScreen.classList.add('oculto');
  modalRes.classList.add('oculto');
  inicioScreen.classList.remove('oculto'); inicioScreen.classList.add('activo');
}

function lanzarConfeti() {
  var count = 200; var defaults = { origin: { y: 0.7 } };
  function fire(ratio, opts) {
    confetti(Object.assign({}, defaults, opts, { particleCount: Math.floor(count * ratio) }));
  }
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
}


