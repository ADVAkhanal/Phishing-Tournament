// public/js/confetti.js — tiny CSS-driven confetti burst (no canvas, no deps).
// Pure visual flourish for the leaderboard champion card.
window.confetti = function (host, opts) {
  opts = opts || {};
  const count = opts.count || 30;
  const colors = ['#EE2D24', '#FFD34E', '#F4F4F5', '#B81C16', '#10B981'];
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('span');
    piece.style.cssText = `
      position: absolute;
      top: ${Math.random() * 30}%;
      left: ${Math.random() * 100}%;
      width: ${4 + Math.random() * 6}px;
      height: ${8 + Math.random() * 14}px;
      background: ${colors[i % colors.length]};
      border-radius: 2px;
      transform: rotate(${Math.random() * 360}deg);
      animation: pgFall ${2 + Math.random() * 1.5}s ${Math.random()}s ease-in forwards;
      opacity: 0;
      pointer-events: none;
    `;
    host.appendChild(piece);
  }
  if (!document.getElementById('pg-confetti-style')) {
    const s = document.createElement('style');
    s.id = 'pg-confetti-style';
    s.textContent = `@keyframes pgFall {
      0% { transform: translateY(-30px) rotate(0deg); opacity: 0; }
      15% { opacity: 1; }
      100% { transform: translateY(140px) rotate(720deg); opacity: 0; }
    }`;
    document.head.appendChild(s);
  }
};
