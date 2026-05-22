// public/js/charts.js — analytics charts
(function () {
  if (!window.Chart) return;
  const data = window.__DATA__ || {};

  const text = '#B5B5B8';
  const grid = '#2A2A2D';
  Chart.defaults.color = text;
  Chart.defaults.borderColor = grid;
  Chart.defaults.font.family = "'Inter', sans-serif";

  if (data.monthly) {
    const labels = data.monthly.map((r) => r.label);
    const reported = data.monthly.map((r) => r.reported);
    const clicked = data.monthly.map((r) => r.clicked);
    const ctx = document.getElementById('trendChart');
    if (ctx) {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Reported', data: reported, borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.15)', tension: 0.3, fill: true },
            { label: 'Clicked', data: clicked, borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.15)', tension: 0.3, fill: true },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: text } } },
          scales: { x: { grid: { color: grid } }, y: { grid: { color: grid }, beginAtZero: true } },
        },
      });
    }
  }

  if (data.training) {
    const labels = data.training.map((r) => r.label);
    const passed = data.training.map((r) => r.passed);
    const expected = data.training.map((r) => r.expected);
    const ctx = document.getElementById('trainingChart');
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Passed', data: passed, backgroundColor: '#EE2D24' },
            { label: 'Expected (active employees)', data: expected, backgroundColor: '#3A3A3D' },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: text } } },
          scales: { x: { grid: { color: grid }, ticks: { autoSkip: false, maxRotation: 35 } }, y: { grid: { color: grid }, beginAtZero: true } },
        },
      });
    }
  }
})();
