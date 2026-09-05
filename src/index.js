// EF Checkins Kiosk - Faye Real-time Client

// --- Config ---
const FAYE_ENDPOINT = 'wss://faye.chalamministries.com:8999';
const FAYE_CHANNEL = '/notifications';

// --- DOM Elements ---
const checkinCard = document.getElementById('checkin-card');
const memberPhoto = document.getElementById('member-photo');
const welcomeMessage = document.getElementById('welcome-message');
const memberName = document.getElementById('member-name');
const expires = document.getElementById('expires');
const redAlert = document.getElementById('red-alert');
const redAlertText = document.getElementById('red-alert-text');
const yellowAlert = document.getElementById('yellow-alert');
const yellowAlertText = document.getElementById('yellow-alert-text');
const greenAlert = document.getElementById('green-alert');
const greenAlertText = document.getElementById('green-alert-text');
const balance = document.getElementById('balance');
const balanceAmount = document.getElementById('balance-amount');
const toastContainer = document.getElementById('toast-container');
const statusBar = document.getElementById('status-bar');

// --- Sound loader (loads from assets/sounds/) ---
const SOUND_FILES = {
  red: 'assets/sounds/red.wav',
  yellow: 'assets/sounds/yellow.wav',
  green: 'assets/sounds/green.wav'
};

let audioContext = null;
let soundBuffers = {};

// Preload all sounds on first play request
async function loadSound(color) {
  if (soundBuffers[color]) return soundBuffers[color];

  try {
    const response = await fetch(SOUND_FILES[color]);
    if (!response.ok) {
      console.warn(`Sound file not found: ${SOUND_FILES[color]}. Using silent fallback.`);
      // Return silent 1-sec buffer
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioContext;
      const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i++) channelData[i] = 0;
      soundBuffers[color] = buffer;
      return buffer;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = await audioContext.decodeAudioData(arrayBuffer);
    soundBuffers[color] = buffer;
    return buffer;
  } catch (e) {
    console.error(`Failed to load sound '${color}':`, e);
    // Silent fallback
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioContext;
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i++) channelData[i] = 0;
    soundBuffers[color] = buffer;
    return buffer;
  }
}

// --- Play sound ---
async function playSound(color) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const buffer = await loadSound(color);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (e) {
    console.warn('Sound playback failed:', e);
  }
}

// --- Toast utility ---
function showToast(message, color = 'green') {
  const toast = document.createElement('div');
  toast.className = `toast ${color} show`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Auto-hide after 3s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}

// --- Play sound ---
async function playSound(color) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (!soundBuffers[color]) {
      // Decode base64 WAV to AudioBuffer
      const bin = atob(sounds[color]);
      const buffer = new ArrayBuffer(bin.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < bin.length; i++) {
        view[i] = bin.charCodeAt(i);
      }
      soundBuffers[color] = await audioContext.decodeAudioData(buffer);
    }

    const source = audioContext.createBufferSource();
    source.buffer = soundBuffers[color];
    source.connect(audioContext.destination);
    source.start();
  } catch (e) {
    console.warn('Sound playback failed:', e);
  }
}

// --- Render payload ---
function renderPayload(payload) {
  // Reset alerts
  [redAlert, yellowAlert, greenAlert].forEach(el => el.classList.add('hidden'));

  // Set welcome & name
  welcomeMessage.textContent = payload.message || 'WELCOME';
  memberName.textContent = payload.memberName || 'Unknown';

  // Photo
  if (payload.imageURL) {
    memberPhoto.src = payload.imageURL;
    memberPhoto.onerror = () => {
      memberPhoto.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzQ0NDQiLz48dGV4dCB4PSIxMCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiPk5vIFBob3RvPC90ZXh0Pjwvc3ZnPg==';
    };
  } else {
    memberPhoto.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzQ0NDQiLz48dGV4dCB4PSIxMCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiPk5vIFBob3RvPC90ZXh0Pjwvc3ZnPg==';
  }

  // Membership
  if (payload.membership && payload.expires) {
    const membershipEl = document.getElementById('membership');
    membershipEl.innerHTML = `${payload.membership} • Expires: <span id="expires">${payload.expires}</span>`;
    expires.textContent = payload.expires;
  }

  // Alerts
  if (payload.redAlert && payload.redAlertTxt) {
    redAlertText.textContent = payload.redAlertTxt;
    redAlert.classList.remove('hidden');
  }
  if (payload.yellowAlert && payload.yellowAlertTxt) {
    yellowAlertText.textContent = payload.yellowAlertTxt;
    yellowAlert.classList.remove('hidden');
  }
  if (payload.balanceDue) {
    balanceAmount.textContent = `$${(payload.balance || 0).toFixed(2)}`;
    balance.classList.remove('hidden');
  } else {
    balance.classList.add('hidden');
  }

  // Show card
  checkinCard.classList.remove('hidden');
}

// --- Faye setup ---
const Faye = require('faye');

function initFaye() {
  try {
    const client = new Faye.Client(FAYE_ENDPOINT);

    // Status indicator
    statusBar.textContent = '● Connecting...';

    client.on('transport:up', () => {
      statusBar.innerHTML = '● <span style="color:#10b981;">Online</span>';
      showToast('Connected to Faye server', 'green');
      playSound('green');
    });

    client.on('transport:down', () => {
      statusBar.innerHTML = '● <span style="color:#ef4444;">Offline</span>';
      showToast('Lost connection — retrying...', 'red');
      playSound('red');
    });

    client.subscribe(FAYE_CHANNEL, (payload) => {
      console.log('Received Faye payload:', payload);
      
      // Validate required fields
      if (!payload.clientID || !payload.validScan) return;
      
      // Render
      renderPayload(payload);
      
      // Toast & sound by color
      const color = payload.color || 'green';
      const msg = payload.message || 'Check-in received';
      showToast(msg, color);
      playSound(color);
    });

    client.onError((error) => {
      console.error('Faye error:', error);
      statusBar.innerHTML = '● <span style="color:#ef4444;">Error</span>';
      showToast(`Faye error: ${error.message}`, 'red');
      playSound('red');
    });

  } catch (err) {
    console.error('Failed to load Faye:', err);
    statusBar.innerHTML = '● <span style="color:#ef4444;">Load Error</span>';
    showToast('Failed to load Faye client', 'red');
  }
}

// --- Init ---
window.addEventListener('DOMContentLoaded', () => {
  // Hide card initially
  checkinCard.classList.add('hidden');

  // Listen for checkin-data from Rust
  window.__TAURI__.listen('checkin-data', (event) => {
    console.log('Received checkin-data:', event.payload);
    renderPayload(event.payload);
    const color = event.payload.color || 'green';
    const msg = event.payload.message || 'Check-in received';
    showToast(msg, color);
    playSound(color);
  });
});
