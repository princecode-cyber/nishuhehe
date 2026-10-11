const hugButton = document.querySelector('#hug-button');
const heartBurst = document.querySelector('#heart-burst');
const finalButton = document.querySelector('#final-button');
const waddleButton = document.querySelector('#waddle-button');
const stagePenguin = document.querySelector('#stage-penguin');
const waddleStatus = document.querySelector('#waddle-status');
const scribbleCanvas = document.querySelector('#scribble-canvas');
const scribbleHelp = document.querySelector('#scribble-help');
const scribbleStatus = document.querySelector('#scribble-status');
const scribbleContext = scribbleCanvas?.getContext('2d');

let scribbleTimer;
let scribbleFadeTimer;
let isScribbling = false;
let scribbleArmed = false;
let lastPoint = null;
let pressPoint = null;
let lastSprinkleAt = 0;

function resizeScribbleCanvas() {
  if (!scribbleCanvas || !scribbleContext) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  scribbleCanvas.width = Math.floor(window.innerWidth * ratio);
  scribbleCanvas.height = Math.floor(window.innerHeight * ratio);
  scribbleCanvas.style.width = `${window.innerWidth}px`;
  scribbleCanvas.style.height = `${window.innerHeight}px`;
  scribbleContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function pointFromEvent(event) {
  return { x: event.clientX, y: event.clientY };
}

function targetIsInteractive(target) {
  return Boolean(target.closest('button, a, input, textarea, select, summary, [data-no-scribble]'));
}

function addScribbleHeart(point) {
  const heart = document.createElement('span');
  heart.className = 'scribble-heart';
  heart.textContent = Math.random() > .35 ? '♥' : '✦';
  heart.style.left = `${point.x + (Math.random() - .5) * 12}px`;
  heart.style.top = `${point.y + (Math.random() - .5) * 12}px`;
  heart.style.setProperty('--scribble-drift', `${(Math.random() - .5) * 55}px`);
  heart.style.setProperty('--scribble-rotate', `${(Math.random() - .5) * 80}deg`);
  document.body.appendChild(heart);
  window.setTimeout(() => heart.remove(), 1400);
}

function clearScribble() {
  if (!scribbleContext || !scribbleCanvas) return;
  scribbleContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
  scribbleCanvas.classList.remove('is-visible');
}

function beginScribble(point) {
  if (!scribbleContext || !scribbleCanvas) return;
  isScribbling = true;
  lastPoint = point;
  lastSprinkleAt = 0;
  window.clearTimeout(scribbleFadeTimer);
  scribbleCanvas.classList.add('is-visible');
  document.body.classList.add('is-scribbling');
  scribbleContext.beginPath();
  scribbleContext.moveTo(point.x, point.y);
  scribbleContext.lineWidth = Math.max(2.5, Math.min(5, window.innerWidth / 130));
  scribbleContext.lineCap = 'round';
  scribbleContext.lineJoin = 'round';
  scribbleContext.strokeStyle = 'rgba(236, 133, 119, .78)';
  scribbleContext.shadowColor = 'rgba(236, 133, 119, .25)';
  scribbleContext.shadowBlur = 8;
  scribbleStatus.textContent = 'your little love doodle is blooming';
}

function drawScribble(point) {
  if (!isScribbling || !scribbleContext || !lastPoint) return;
  scribbleContext.lineTo(point.x, point.y);
  scribbleContext.stroke();
  const now = performance.now();
  if (now - lastSprinkleAt > 42) {
    addScribbleHeart(point);
    lastSprinkleAt = now;
  }
  lastPoint = point;
}

function endScribble() {
  if (!isScribbling) return;
  isScribbling = false;
  document.body.classList.remove('is-scribbling');
  if (lastPoint) makeHeartBurst(lastPoint);
  scribbleStatus.textContent = 'a little more love, drawn by you';
  window.clearTimeout(scribbleFadeTimer);
  scribbleFadeTimer = window.setTimeout(clearScribble, 5200);
  lastPoint = null;
}

function cancelScribble() {
  window.clearTimeout(scribbleTimer);
  if (isScribbling) endScribble();
}

resizeScribbleCanvas();
window.addEventListener('resize', resizeScribbleCanvas);

document.addEventListener('pointerdown', (event) => {
  if (targetIsInteractive(event.target)) return;
  if (event.pointerType === 'mouse') return;
  window.clearTimeout(scribbleTimer);
  const point = pointFromEvent(event);
  pressPoint = point;
  scribbleTimer = window.setTimeout(() => beginScribble(point), scribbleArmed ? 0 : 430);
}, { passive: true });

document.addEventListener('contextmenu', (event) => {
  if (targetIsInteractive(event.target)) return;
  event.preventDefault();
  window.clearTimeout(scribbleTimer);
  pressPoint = null;
  beginScribble(pointFromEvent(event));
});

document.addEventListener('pointermove', (event) => {
  if (isScribbling) {
    event.preventDefault();
    drawScribble(pointFromEvent(event));
    return;
  }
  if (scribbleTimer && pressPoint) {
    const point = pointFromEvent(event);
    if (Math.hypot(point.x - pressPoint.x, point.y - pressPoint.y) > 14) {
      window.clearTimeout(scribbleTimer);
      pressPoint = null;
    }
  }
}, { passive: false });

document.addEventListener('pointerup', () => {
  window.clearTimeout(scribbleTimer);
  pressPoint = null;
  endScribble();
}, { passive: true });
document.addEventListener('pointercancel', cancelScribble, { passive: true });

scribbleHelp?.addEventListener('click', () => {
  scribbleArmed = !scribbleArmed;
  scribbleHelp.setAttribute('aria-pressed', String(scribbleArmed));
  scribbleHelp.innerHTML = scribbleArmed
    ? '<span aria-hidden="true">✦</span> ready — draw anywhere'
    : '<span aria-hidden="true">✎</span> long-press phone · right-click PC';
  scribbleStatus.textContent = scribbleArmed ? 'ready — draw anywhere, or right-click on PC' : 'long-press on phone · right-click on PC';
});

function makeHeartBurst(origin = { x: window.innerWidth / 2, y: window.innerHeight / 2 }) {
  const hearts = ['♥', '♡', '✦', '♥', '✿', '♡'];
  hearts.forEach((symbol, index) => {
    const heart = document.createElement('span');
    heart.className = 'burst-heart';
    heart.textContent = symbol;
    heart.style.left = `${origin.x + (Math.random() - 0.5) * 30}px`;
    heart.style.top = `${origin.y + (Math.random() - 0.5) * 12}px`;
    heart.style.setProperty('--x', `${(Math.random() - 0.5) * 150}px`);
    heart.style.setProperty('--r', `${(Math.random() - 0.5) * 75}deg`);
    heart.style.animationDelay = `${index * 55}ms`;
    heartBurst.appendChild(heart);
    window.setTimeout(() => heart.remove(), 1700);
  });
}

hugButton?.addEventListener('click', (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  makeHeartBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  hugButton.innerHTML = '<span class="button-icon" aria-hidden="true">♥</span> hug delivered';
  hugButton.setAttribute('aria-label', 'Warm hug delivered');
  window.setTimeout(() => {
    hugButton.innerHTML = '<span class="button-icon" aria-hidden="true">♡</span> send a warm hug';
    hugButton.setAttribute('aria-label', 'Send a warm hug');
  }, 2800);
});

finalButton?.addEventListener('click', (event) => {
  makeHeartBurst({ x: event.clientX || window.innerWidth / 2, y: event.clientY || window.innerHeight / 2 });
  finalButton.innerHTML = 'this reminder is yours now <span aria-hidden="true">✦</span>';
  finalButton.classList.add('button-dark');
});

document.querySelectorAll('.bloom-button').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.garden-card');
    const message = card.querySelector('.card-message');
    const isBloomed = card.classList.toggle('is-bloomed');
    message.textContent = isBloomed ? button.dataset.message : '';
    button.innerHTML = isBloomed ? 'keep growing <span aria-hidden="true">✦</span>' : 'make it bloom <span aria-hidden="true">↗</span>';
  });
});

document.querySelectorAll('.note').forEach((note) => {
  note.addEventListener('click', () => {
    const expanded = note.getAttribute('aria-expanded') === 'true';
    note.setAttribute('aria-expanded', String(!expanded));
  });
});

let waddleCount = 0;
waddleButton?.addEventListener('click', () => {
  waddleCount += 1;
  stagePenguin.classList.remove('is-waddling');
  void stagePenguin.offsetWidth;
  stagePenguin.classList.add('is-waddling');
  const statuses = [
    'waddle initiated — he believes in you',
    'tiny feet, enormous emotional support',
    'he brought backup tulips this time',
    'official report: Nishu is very, very loved'
  ];
  waddleStatus.textContent = statuses[Math.min(waddleCount - 1, statuses.length - 1)];
  if (waddleCount % 2 === 0) makeHeartBurst({ x: window.innerWidth * .72, y: window.innerHeight * .62 });
});

const revealTargets = document.querySelectorAll('.garden-card, .note, .waddle-card, .closing');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((element) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(14px)';
    element.style.transition = 'opacity .65s ease, transform .65s ease, box-shadow .25s ease';
    revealObserver.observe(element);
  });
}
