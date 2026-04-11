/* =====================================================
   TradeVision Pro — App Principal
   Panel Bursátil para Principiantes
   ===================================================== */

// ---- Estado global ----
let currentSymbol = 'AAPL';
let currentPeriod = '3M';
let currentChartType = 'candlestick';
let showMA20 = true, showMA50 = true, showMA200 = false, showBollinger = false;
let currentLesson = 0;
let helpVisible = true;

// Lightweight Charts instances
let mainChartInstance = null;
let mainSeries = null;
let ma20Series = null, ma50Series = null, ma200Series = null;
let bollUpper = null, bollLower = null, bollMiddle = null;
let volumeChartInstance = null;
let volumeSeries = null;
let macdChart = null;

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  renderTicker();
  renderWatchlist();
  renderMovers();
  updateClock();
  setInterval(updateClock, 1000);
  setInterval(simulatePriceUpdates, 3000);

  selectStock(currentSymbol);
});

// =====================================================
// RELOJ
// =====================================================
function updateClock() {
  const el = document.getElementById('marketTime');
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const s = String(now.getSeconds()).padStart(2,'0');
  if (el) el.textContent = `${h}:${m}:${s} EST`;
}

// =====================================================
// TICKER TAPE
// =====================================================
function renderTicker() {
  const items = WATCHLIST.map(s => {
    const up = s.changePct >= 0;
    return `<div class="ticker-item">
      <span class="t-symbol">${s.symbol}</span>
      <span class="t-price">$${s.price.toFixed(2)}</span>
      <span class="t-change ${up?'up':'down'}">${up?'▲':'▼'} ${Math.abs(s.changePct).toFixed(2)}%</span>
    </div>`;
  }).join('');
  // Duplicar para loop continuo
  const inner = document.getElementById('tickerInner');
  if (inner) inner.innerHTML = items + items;
}

// =====================================================
// WATCHLIST
// =====================================================
function renderWatchlist(filter = '') {
  const el = document.getElementById('watchlistEl');
  if (!el) return;

  const list = WATCHLIST.filter(s =>
    s.symbol.toLowerCase().includes(filter.toLowerCase()) ||
    s.name.toLowerCase().includes(filter.toLowerCase())
  );

  el.innerHTML = list.map(stock => {
    const up = stock.changePct >= 0;
    const isActive = stock.symbol === currentSymbol;
    return `<li class="watchlist-item ${isActive ? 'active' : ''}" onclick="selectStock('${stock.symbol}')">
      <div class="wi-left">
        <span class="wi-symbol">${stock.symbol}</span>
        <span class="wi-name">${stock.name}</span>
      </div>
      <div class="wi-right">
        <span class="wi-price">$${stock.price.toFixed(2)}</span>
        <span class="wi-change ${up?'positive':'negative'}">${up?'▲':'▼'}${Math.abs(stock.changePct).toFixed(2)}%</span>
      </div>
    </li>`;
  }).join('');

  updatePortfolio();
}

function filterWatchlist() {
  const val = document.getElementById('searchInput')?.value || '';
  renderWatchlist(val);
}

function updatePortfolio() {
  // Simular un portafolio con 1 acción de cada
  const invested = WATCHLIST.reduce((sum, s) => sum + s.price, 0);
  const pnl = WATCHLIST.reduce((sum, s) => sum + s.change, 0);
  const pct = (pnl / invested) * 100;

  const totalEl = document.getElementById('portTotal');
  const pnlEl = document.getElementById('portPnl');
  const pctEl = document.getElementById('portPct');

  if (totalEl) totalEl.textContent = `$${invested.toFixed(2)}`;
  if (pnlEl) {
    pnlEl.textContent = `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`;
    pnlEl.className = `portfolio-pnl ${pnl >= 0 ? 'positive' : 'negative'}`;
  }
  if (pctEl) {
    pctEl.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
    pctEl.className = `portfolio-pct ${pct >= 0 ? 'positive' : 'negative'}`;
  }
}

// =====================================================
// SELECCIONAR ACCIÓN
// =====================================================
function selectStock(symbol) {
  currentSymbol = symbol;
  const stock = WATCHLIST.find(s => s.symbol === symbol);
  if (!stock) return;

  // Actualizar header
  document.getElementById('symbolBadge').textContent = stock.symbol;
  document.getElementById('symbolName').textContent = stock.name;
  document.getElementById('symbolSector').textContent = `${stock.sector} · ${stock.exchange}`;
  document.getElementById('priceMain').textContent = `$${stock.price.toFixed(2)}`;

  const up = stock.changePct >= 0;
  const changeEl = document.getElementById('priceChange');
  changeEl.textContent = `${up ? '▲' : '▼'} $${Math.abs(stock.change).toFixed(2)} (${up?'+':''}${stock.changePct.toFixed(2)}%)`;
  changeEl.className = `price-change ${up ? 'positive' : 'negative'}`;

  // Renderizar gráfico
  renderChart();
  renderStats(stock);
  renderNews(symbol);

  // Actualizar watchlist activa
  renderWatchlist(document.getElementById('searchInput')?.value || '');
}

// =====================================================
// GRÁFICO PRINCIPAL
// =====================================================
function renderChart() {
  const container = document.getElementById('mainChart');
  const volContainer = document.getElementById('volumeChart');
  if (!container) return;

  // Destruir charts previos
  if (mainChartInstance) {
    try { mainChartInstance.remove(); } catch(e) {}
    mainChartInstance = null;
  }
  if (volumeChartInstance) {
    try { volumeChartInstance.remove(); } catch(e) {}
    volumeChartInstance = null;
  }

  // Filtrar datos
  const allCandles = CANDLE_DATA[currentSymbol] || [];
  const candles = filterByPeriod(allCandles, currentPeriod);

  if (candles.length === 0) return;

  const isDark = !document.body.classList.contains('light');

  // ---- Main Chart ----
  const chartOptions = {
    layout: {
      background: { color: isDark ? '#0d1117' : '#f0f2f5' },
      textColor: isDark ? '#8b949e' : '#656d76',
    },
    grid: {
      vertLines: { color: isDark ? '#21262d' : '#d0d7de' },
      horzLines: { color: isDark ? '#21262d' : '#d0d7de' },
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: { color: '#555', style: 1, width: 1 },
      horzLine: { color: '#555', style: 1, width: 1 },
    },
    rightPriceScale: {
      borderColor: isDark ? '#30363d' : '#d0d7de',
    },
    timeScale: {
      borderColor: isDark ? '#30363d' : '#d0d7de',
      timeVisible: true,
      secondsVisible: false,
    },
    handleScroll: true,
    handleScale: true,
  };

  const chartHeight = Math.max(320, container.getBoundingClientRect().height || 340);
  mainChartInstance = LightweightCharts.createChart(container, {
    ...chartOptions,
    width: container.clientWidth || 600,
    height: chartHeight,
  });

  // ---- Series principal ----
  if (currentChartType === 'candlestick') {
    mainSeries = mainChartInstance.addCandlestickSeries({
      upColor: '#3fb950',
      downColor: '#f85149',
      borderUpColor: '#3fb950',
      borderDownColor: '#f85149',
      wickUpColor: '#3fb950',
      wickDownColor: '#f85149',
    });
    mainSeries.setData(candles);
  } else if (currentChartType === 'line') {
    mainSeries = mainChartInstance.addLineSeries({
      color: '#1f6feb',
      lineWidth: 2,
    });
    mainSeries.setData(candles.map(c => ({ time: c.time, value: c.close })));
  } else if (currentChartType === 'area') {
    mainSeries = mainChartInstance.addAreaSeries({
      lineColor: '#1f6feb',
      topColor: 'rgba(31,111,235,0.3)',
      bottomColor: 'rgba(31,111,235,0)',
      lineWidth: 2,
    });
    mainSeries.setData(candles.map(c => ({ time: c.time, value: c.close })));
  }

  // ---- Medias Móviles ----
  const allCandle365 = CANDLE_DATA[currentSymbol] || [];

  if (showMA20) {
    const ma20Data = calcSMA(allCandle365, 20).filter(d => d.time >= candles[0].time);
    ma20Series = mainChartInstance.addLineSeries({
      color: '#f0e68c', lineWidth: 1.5, title: 'MM20',
      crosshairMarkerVisible: false,
    });
    ma20Series.setData(ma20Data);
  }

  if (showMA50) {
    const ma50Data = calcSMA(allCandle365, 50).filter(d => d.time >= candles[0].time);
    ma50Series = mainChartInstance.addLineSeries({
      color: '#87ceeb', lineWidth: 1.5, title: 'MM50',
      crosshairMarkerVisible: false,
    });
    ma50Series.setData(ma50Data);
  }

  if (showMA200) {
    const ma200Data = calcSMA(allCandle365, 200).filter(d => d.time >= candles[0].time);
    if (ma200Data.length > 0) {
      ma200Series = mainChartInstance.addLineSeries({
        color: '#ff8c00', lineWidth: 1.5, title: 'MM200',
        crosshairMarkerVisible: false,
      });
      ma200Series.setData(ma200Data);
    }
  }

  if (showBollinger) {
    const boll = calcBollinger(allCandle365, 20, 2);
    const filteredTime = candles[0].time;
    const bUpper = boll.upper.filter(d => d.time >= filteredTime);
    const bLower = boll.lower.filter(d => d.time >= filteredTime);
    const bMiddle = boll.middle.filter(d => d.time >= filteredTime);

    if (bUpper.length > 0) {
      bollUpper = mainChartInstance.addLineSeries({ color: 'rgba(188,140,255,0.7)', lineWidth: 1, title: 'BB+', crosshairMarkerVisible: false });
      bollUpper.setData(bUpper);
      bollLower = mainChartInstance.addLineSeries({ color: 'rgba(188,140,255,0.7)', lineWidth: 1, title: 'BB-', crosshairMarkerVisible: false });
      bollLower.setData(bLower);
      bollMiddle = mainChartInstance.addLineSeries({ color: 'rgba(188,140,255,0.4)', lineWidth: 1, lineStyle: 2, crosshairMarkerVisible: false });
      bollMiddle.setData(bMiddle);
    }
  }

  // ---- Crosshair + OHLCV ----
  mainChartInstance.subscribeCrosshairMove(param => {
    if (currentChartType === 'candlestick' && param.seriesData) {
      const candleData = param.seriesData.get(mainSeries);
      if (candleData) updateOHLCV(candleData);
    }
  });

  // Mostrar último valor por defecto
  const last = candles[candles.length - 1];
  updateOHLCV(last);

  // Ajustar al contenedor
  mainChartInstance.timeScale().fitContent();

  // Resize observer
  const resizeObs = new ResizeObserver(() => {
    if (mainChartInstance) {
      mainChartInstance.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight || 340,
      });
    }
    if (volumeChartInstance) {
      volumeChartInstance.applyOptions({
        width: volContainer.clientWidth,
        height: volContainer.clientHeight || 100,
      });
    }
  });
  resizeObs.observe(container);

  // ---- Volume Chart ----
  if (volContainer) {
    volumeChartInstance = LightweightCharts.createChart(volContainer, {
      ...chartOptions,
      width: volContainer.clientWidth,
      height: volContainer.clientHeight || 100,
      rightPriceScale: {
        visible: true,
        borderColor: isDark ? '#30363d' : '#d0d7de',
        scaleMargins: { top: 0.1, bottom: 0 },
      },
      timeScale: {
        visible: false,
      },
    });

    volumeSeries = volumeChartInstance.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    const volData = candles.map(c => ({
      time: c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(63,185,80,0.5)' : 'rgba(248,81,73,0.5)',
    }));

    volumeSeries.setData(volData);
    volumeChartInstance.timeScale().fitContent();
  }

  // ---- Indicadores ----
  renderIndicators(candles, allCandle365);
}

function updateOHLCV(c) {
  const fmt = v => v != null ? `$${parseFloat(v).toFixed(2)}` : '—';
  const fmtVol = v => v ? (v >= 1e6 ? (v/1e6).toFixed(1)+'M' : (v/1e3).toFixed(0)+'K') : '—';
  document.getElementById('ohlcOpen').textContent  = fmt(c.open);
  document.getElementById('ohlcHigh').textContent  = fmt(c.high);
  document.getElementById('ohlcLow').textContent   = fmt(c.low);
  document.getElementById('ohlcClose').textContent = fmt(c.close);
  document.getElementById('ohlcVol').textContent   = fmtVol(c.volume);
}

// =====================================================
// INDICADORES INFERIORES
// =====================================================
function renderIndicators(candles, allCandles) {
  // RSI
  const rsi = calcRSI(candles, 14);
  const rsiEl = document.getElementById('rsiValue');
  const rsiBar = document.getElementById('rsiBar');
  if (rsiEl) {
    rsiEl.textContent = rsi.toFixed(1);
    rsiEl.className = `ind-value ${rsi > 70 ? 'text-negative' : rsi < 30 ? 'text-positive' : ''}`;
  }
  if (rsiBar) rsiBar.style.width = rsi + '%';

  // MACD mini
  renderMacdMini(candles);

  // MA Table
  renderMATable(candles, allCandles);

  // Signal
  renderSignal(candles, rsi, allCandles);
}

function renderMacdMini(candles) {
  const container = document.getElementById('macdMini');
  if (!container) return;
  container.innerHTML = '';

  if (candles.length < 30) {
    container.innerHTML = '<span style="color:var(--text-muted);font-size:0.75rem">Datos insuficientes</span>';
    return;
  }

  const isDark = !document.body.classList.contains('light');
  const macdData = calcMACD(candles);

  try {
    macdChart = LightweightCharts.createChart(container, {
      layout: { background: { color: 'transparent' }, textColor: isDark ? '#8b949e' : '#656d76' },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false },
      handleScroll: false,
      handleScale: false,
      width: container.clientWidth || 200,
      height: 60,
    });

    const histSeries = macdChart.addHistogramSeries({
      priceScaleId: 'right',
    });
    histSeries.setData(macdData.map(d => ({
      time: d.time,
      value: d.histogram,
      color: d.histogram >= 0 ? 'rgba(63,185,80,0.7)' : 'rgba(248,81,73,0.7)',
    })));

    const macdLine = macdChart.addLineSeries({ color: '#87ceeb', lineWidth: 1, priceScaleId: 'right' });
    macdLine.setData(macdData.map(d => ({ time: d.time, value: d.macd })));

    const sigLine = macdChart.addLineSeries({ color: '#ff8c00', lineWidth: 1, lineStyle: 2, priceScaleId: 'right' });
    sigLine.setData(macdData.map(d => ({ time: d.time, value: d.signal })));

    macdChart.timeScale().fitContent();
  } catch(e) {
    container.innerHTML = '<canvas id="macdCanvas" style="width:100%;height:60px"></canvas>';
  }
}

function renderMATable(candles, allCandles) {
  const el = document.getElementById('maTable');
  if (!el || candles.length === 0) return;

  const lastPrice = candles[candles.length - 1].close;
  const periods = [
    { period: 20, color: '#f0e68c', label: 'MM20' },
    { period: 50, color: '#87ceeb', label: 'MM50' },
    { period: 200, color: '#ff8c00', label: 'MM200' },
  ];

  el.innerHTML = periods.map(({ period, color, label }) => {
    const maData = calcSMA(allCandles, period);
    const last = maData[maData.length - 1];
    if (!last) return `<div class="ma-row"><span class="ma-label"><span class="ma-dot" style="background:${color}"></span>${label}</span><span style="color:var(--text-muted)">—</span></div>`;
    const val = last.value;
    const bullish = lastPrice > val;
    return `<div class="ma-row">
      <span class="ma-label"><span class="ma-dot" style="background:${color}"></span>${label}</span>
      <span class="ma-val">$${val.toFixed(1)}</span>
      <span class="ma-sig ${bullish?'bullish':'bearish'}">${bullish?'▲ Compra':'▼ Venta'}</span>
    </div>`;
  }).join('');
}

function renderSignal(candles, rsi, allCandles) {
  const el = document.getElementById('signalMeter');
  if (!el || candles.length === 0) return;

  const lastPrice = candles[candles.length - 1].close;
  const macdData = calcMACD(candles);
  const lastMacd = macdData[macdData.length - 1];

  // Scores (0-100 cada uno)
  let scores = [];

  // MA Score
  const ma20 = calcSMA(allCandles, 20).pop()?.value || 0;
  const ma50 = calcSMA(allCandles, 50).pop()?.value || 0;
  const ma200 = calcSMA(allCandles, 200).pop()?.value || 0;
  const maScore = ((lastPrice > ma20 ? 33 : 0) + (lastPrice > ma50 ? 34 : 0) + (lastPrice > ma200 ? 33 : 0));
  scores.push({ label: 'Medias Móviles', score: maScore, color: maScore > 50 ? 'var(--positive)' : 'var(--negative)' });

  // RSI Score
  const rsiScore = rsi > 70 ? 20 : rsi < 30 ? 80 : 50 + (50 - rsi);
  const rsiNorm = Math.min(100, Math.max(0, rsiScore));
  scores.push({ label: 'RSI', score: rsiNorm, color: rsiNorm > 50 ? 'var(--positive)' : 'var(--negative)' });

  // MACD Score
  const macdScore = lastMacd && lastMacd.macd > lastMacd.signal ? 75 : 25;
  scores.push({ label: 'MACD', score: macdScore, color: macdScore > 50 ? 'var(--positive)' : 'var(--negative)' });

  // Volume score
  const avgVol = candles.slice(-20).reduce((sum, c) => sum + c.volume, 0) / 20;
  const lastVol = candles[candles.length - 1].volume;
  const lastClose = candles[candles.length - 1];
  const volScore = (lastVol > avgVol && lastClose.close > lastClose.open) ? 75 : (lastVol > avgVol ? 40 : 55);
  scores.push({ label: 'Volumen', score: volScore, color: volScore > 50 ? 'var(--positive)' : 'var(--negative)' });

  const overall = scores.reduce((s, v) => s + v.score, 0) / scores.length;
  let signal = '', sigColor = '';
  if (overall >= 75) { signal = '● COMPRA FUERTE'; sigColor = 'var(--positive)'; }
  else if (overall >= 55) { signal = '● COMPRA'; sigColor = 'var(--positive)'; }
  else if (overall >= 45) { signal = '● NEUTRAL'; sigColor = 'var(--warning)'; }
  else if (overall >= 25) { signal = '● VENTA'; sigColor = 'var(--negative)'; }
  else { signal = '● VENTA FUERTE'; sigColor = 'var(--negative)'; }

  el.innerHTML = `
    <div style="font-size:0.82rem;font-weight:700;color:${sigColor};margin-bottom:8px">${signal}</div>
    ${scores.map(s => `
      <div class="signal-gauge">
        <span class="signal-label">${s.label}</span>
        <div class="signal-gauge-bar">
          <div class="signal-gauge-fill" style="width:${s.score}%;background:${s.color}"></div>
        </div>
        <span class="signal-pct" style="color:${s.color}">${s.score.toFixed(0)}%</span>
      </div>
    `).join('')}
  `;
}

// =====================================================
// ESTADÍSTICAS
// =====================================================
function renderStats(stock) {
  const el = document.getElementById('statsGrid');
  if (!el) return;

  const fmtNum = n => n >= 1e12 ? (n/1e12).toFixed(2)+'T' : n >= 1e9 ? (n/1e9).toFixed(0)+'B' : n >= 1e6 ? (n/1e6).toFixed(0)+'M' : n;

  const items = [
    { label: 'Cap. Bursátil', value: stock.mktCap },
    { label: 'P/E Ratio', value: stock.pe.toFixed(1) },
    { label: 'EPS', value: `$${stock.eps.toFixed(2)}` },
    { label: 'Dividendo', value: stock.dividend ? `$${stock.dividend.toFixed(2)}` : 'N/A' },
    { label: 'Máx 52s', value: `$${stock.high52.toFixed(2)}`, cls: 'up' },
    { label: 'Mín 52s', value: `$${stock.low52.toFixed(2)}`, cls: 'down' },
    { label: 'Volumen', value: `${(stock.volume/1e6).toFixed(1)}M` },
    { label: 'Beta', value: stock.beta.toFixed(2), cls: stock.beta > 1 ? 'down' : 'up' },
  ];

  el.innerHTML = items.map(it => `
    <div class="stat-cell">
      <div class="stat-cell-label">${it.label}</div>
      <div class="stat-cell-value ${it.cls || ''}">${it.value}</div>
    </div>
  `).join('');
}

// =====================================================
// NOTICIAS
// =====================================================
function renderNews(symbol) {
  const el = document.getElementById('newsList');
  if (!el) return;

  const news = NEWS_DATA[symbol] || NEWS_DATA.DEFAULT;

  el.innerHTML = news.map(n => `
    <div class="news-item">
      <div class="news-title">${n.title}</div>
      <div class="news-meta">
        <span>${n.time}</span>
        <span class="news-sentiment ${n.sentiment}">${n.sentiment === 'bullish' ? '▲ Alcista' : n.sentiment === 'bearish' ? '▼ Bajista' : '— Neutral'}</span>
      </div>
    </div>
  `).join('');
}

// =====================================================
// MOVERS
// =====================================================
function renderMovers() {
  const el = document.getElementById('moversList');
  if (!el) return;

  el.innerHTML = MOVERS.map(m => `
    <div class="mover-item">
      <span class="mover-rank">#${m.rank}</span>
      <span class="mover-symbol">${m.symbol}</span>
      <span class="mover-name">${m.name}</span>
      <span class="mover-change ${m.up?'up':'down'}">${m.up?'+':''}${m.change.toFixed(2)}%</span>
    </div>
  `).join('');
}

// =====================================================
// CONTROLES DEL GRÁFICO
// =====================================================
function setPeriod(period, btn) {
  currentPeriod = period;
  document.querySelectorAll('.btn-period').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderChart();
}

function setChartType(type, btn) {
  currentChartType = type;
  document.querySelectorAll('.chart-toolbar .toolbar-group:nth-child(2) .btn-period').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderChart();
}

function toggleMA(period) {
  if (period === 20) { showMA20 = !showMA20; document.getElementById('btnMA20').classList.toggle('active', showMA20); }
  if (period === 50) { showMA50 = !showMA50; document.getElementById('btnMA50').classList.toggle('active', showMA50); }
  if (period === 200) { showMA200 = !showMA200; document.getElementById('btnMA200').classList.toggle('active', showMA200); }
  renderChart();
}

function toggleBollinger() {
  showBollinger = !showBollinger;
  document.getElementById('btnBolling').classList.toggle('active', showBollinger);
  renderChart();
}

// =====================================================
// TEMA
// =====================================================
function toggleTheme() {
  document.body.classList.toggle('light');
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.className = document.body.classList.contains('light') ? 'fas fa-moon' : 'fas fa-sun';
  }
  renderChart();
}

// =====================================================
// PANEL EDUCATIVO
// =====================================================
function openLesson(key) {
  currentLesson = LESSON_ORDER.indexOf(key);
  if (currentLesson < 0) currentLesson = 0;
  showLesson(currentLesson);
}

function showLesson(idx) {
  const key = LESSON_ORDER[idx];
  const lesson = LESSONS[key];
  if (!lesson) return;

  document.getElementById('eduTitle').textContent = lesson.title;
  document.getElementById('eduBody').innerHTML = lesson.content;
  document.getElementById('eduProgress').textContent = `${idx + 1} de ${LESSON_ORDER.length}`;

  document.getElementById('eduOverlay').classList.add('show');
  document.getElementById('eduPanel').classList.add('show');
}

function closeLesson() {
  document.getElementById('eduOverlay').classList.remove('show');
  document.getElementById('eduPanel').classList.remove('show');
}

function nextLesson() {
  if (currentLesson < LESSON_ORDER.length - 1) {
    currentLesson++;
    showLesson(currentLesson);
  }
}

function prevLesson() {
  if (currentLesson > 0) {
    currentLesson--;
    showLesson(currentLesson);
  }
}

function toggleHelp() {
  helpVisible = !helpVisible;
  const strip = document.getElementById('eduStrip');
  const btn = document.getElementById('btnToggleHelp');
  if (strip) {
    strip.style.display = helpVisible ? '' : 'none';
  }
  if (btn) btn.classList.toggle('active', helpVisible);
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLesson();
  if (e.key === 'ArrowRight' && document.getElementById('eduPanel').classList.contains('show')) nextLesson();
  if (e.key === 'ArrowLeft' && document.getElementById('eduPanel').classList.contains('show')) prevLesson();
});

// =====================================================
// SIMULACIÓN DE PRECIOS EN TIEMPO REAL
// =====================================================
function simulatePriceUpdates() {
  WATCHLIST.forEach(stock => {
    const drift = (Math.random() - 0.499) * 0.002;
    stock.price = parseFloat((stock.price * (1 + drift)).toFixed(2));
    stock.change = parseFloat((stock.change + stock.price * drift).toFixed(2));
    stock.changePct = parseFloat((stock.changePct + drift * 100).toFixed(2));
  });

  // Actualizar ticker
  renderTicker();

  // Actualizar watchlist
  renderWatchlist(document.getElementById('searchInput')?.value || '');

  // Actualizar header del símbolo actual
  const stock = WATCHLIST.find(s => s.symbol === currentSymbol);
  if (stock) {
    const priceEl = document.getElementById('priceMain');
    const changeEl = document.getElementById('priceChange');
    if (priceEl) priceEl.textContent = `$${stock.price.toFixed(2)}`;
    if (changeEl) {
      const up = stock.changePct >= 0;
      changeEl.textContent = `${up?'▲':'▼'} $${Math.abs(stock.change).toFixed(2)} (${up?'+':''}${stock.changePct.toFixed(2)}%)`;
      changeEl.className = `price-change ${up ? 'positive' : 'negative'}`;
    }
  }
}

// =====================================================
// RESPONSIVE RESIZE
// =====================================================
window.addEventListener('resize', () => {
  if (mainChartInstance) {
    const container = document.getElementById('mainChart');
    if (container) {
      mainChartInstance.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight || 340,
      });
    }
  }
});
