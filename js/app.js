/**
 * TradeVision Pro v3 – app.js
 * Controlador principal: inicialización, tabs, watchlist,
 * ticker tape, reloj, simulador UI y academia.
 */

'use strict';

/* ─── Estado global ────────────────────────────────────────────────── */
let chart     = null;
let sim       = null;
let isDark    = true;
let curSymbol = 'AAPL';
let curPeriod = '1M';
let prices    = {};
let tickInterval  = null;
let slMonitor     = null;

/* ─── Init ─────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  chart = new CandleChart('main-canvas', 'vol-canvas');
  sim   = new Simulator();

  initPrices();
  buildWatchlist();
  buildSymbolSelect();
  buildSimSymbolSelect();
  buildAcademy();
  loadChart();
  updatePortfolioUI();
  updateHistoryUI();
  startTicker();
  startClock();
  startPriceTick();
  bindTabNav();
  bindSymbolSelect();
  bindPeriodBtns();
  bindIndicatorBtns();
  bindSimulator();
  bindHistorialControls();
  bindThemeToggle();
  bindModalClose();
  bindHelpBtns();
});

/* ─── Precios iniciales ─────────────────────────────────────────────── */
function initPrices() {
  STOCKS.forEach(s => {
    const last = MARKET_DATA[s.symbol].candles.slice(-1)[0];
    prices[s.symbol] = last.close;
  });
}

/* ─── Cargar gráfico ────────────────────────────────────────────────── */
function loadChart() {
  const data = getChartData(curSymbol, curPeriod);
  chart.loadData(data);
  updateIndicatorsRow(data);
  updateSymbolInfo();
}

/* ─── Watchlist ─────────────────────────────────────────────────────── */
function buildWatchlist() {
  const ul = document.getElementById('watchlist-ul');
  ul.innerHTML = '';
  STOCKS.forEach(s => {
    const last = MARKET_DATA[s.symbol].candles.slice(-1)[0];
    const prev = MARKET_DATA[s.symbol].candles.slice(-2)[0];
    const chg  = ((last.close - prev.close) / prev.close) * 100;
    const li   = document.createElement('li');
    li.className = 'wl-item' + (s.symbol === curSymbol ? ' active' : '');
    li.dataset.symbol = s.symbol;
    li.innerHTML = `
      <span class="wl-sym">${s.symbol}</span>
      <span class="wl-name">${s.name.split(' ').slice(0,2).join(' ')}</span>
      <span class="wl-price">$${last.close.toFixed(2)}</span>
      <span class="wl-chg ${chg >= 0 ? 'positive' : 'negative'}">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span>`;
    li.addEventListener('click', () => {
      curSymbol = s.symbol;
      document.querySelectorAll('.wl-item').forEach(el => el.classList.remove('active'));
      li.classList.add('active');
      document.getElementById('symbol-select').value = curSymbol;
      loadChart();
    });
    ul.appendChild(li);
  });
}

function updateWatchlistPrices() {
  STOCKS.forEach(s => {
    const last = MARKET_DATA[s.symbol].candles.slice(-1)[0];
    const prev = MARKET_DATA[s.symbol].candles.slice(-2)[0];
    const chg  = ((last.close - prev.close) / prev.close) * 100;
    const li   = document.querySelector(`.wl-item[data-symbol="${s.symbol}"]`);
    if (!li) return;
    li.querySelector('.wl-price').textContent = '$' + last.close.toFixed(2);
    const chgEl = li.querySelector('.wl-chg');
    chgEl.textContent = (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%';
    chgEl.className = 'wl-chg ' + (chg >= 0 ? 'positive' : 'negative');
  });
}

/* ─── Select de símbolo ─────────────────────────────────────────────── */
function buildSymbolSelect() {
  const sel = document.getElementById('symbol-select');
  STOCKS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.symbol;
    opt.textContent = `${s.symbol} – ${s.name}`;
    if (s.symbol === curSymbol) opt.selected = true;
    sel.appendChild(opt);
  });
}

function buildSimSymbolSelect() {
  const sel = document.getElementById('sim-symbol');
  STOCKS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.symbol;
    opt.textContent = `${s.symbol} – ${s.name}`;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', updateSimPreview);
}

function bindSymbolSelect() {
  document.getElementById('symbol-select').addEventListener('change', e => {
    curSymbol = e.target.value;
    document.querySelectorAll('.wl-item').forEach(el => {
      el.classList.toggle('active', el.dataset.symbol === curSymbol);
    });
    loadChart();
  });
}

/* ─── Ticker tape ───────────────────────────────────────────────────── */
function buildTicker() {
  const content = document.getElementById('ticker-content');
  let html = '';
  STOCKS.forEach(s => {
    const last = MARKET_DATA[s.symbol].candles.slice(-1)[0];
    const prev = MARKET_DATA[s.symbol].candles.slice(-2)[0];
    const chg  = ((last.close - prev.close) / prev.close) * 100;
    const cls  = chg >= 0 ? 'positive' : 'negative';
    const arrow= chg >= 0 ? '▲' : '▼';
    html += `<span class="tk-item"><b>${s.symbol}</b> $${last.close.toFixed(2)} <span class="${cls}">${arrow}${Math.abs(chg).toFixed(2)}%</span></span>`;
  });
  content.innerHTML = html + html; // duplicar para loop continuo
}

function startTicker() {
  buildTicker();
  setInterval(buildTicker, 5000);
}

/* ─── Reloj ─────────────────────────────────────────────────────────── */
function startClock() {
  const update = () => {
    document.getElementById('clock-time').textContent =
      new Date().toLocaleTimeString('es-CO', { hour12: false });
  };
  update();
  setInterval(update, 1000);
}

/* ─── Tick de precios ───────────────────────────────────────────────── */
function startPriceTick() {
  tickInterval = setInterval(() => {
    STOCKS.forEach(s => {
      const tick = simulatePriceTick(s.symbol);
      prices[s.symbol] = tick.close;
    });

    updateWatchlistPrices();
    updateSymbolInfo();
    updateSimPreview();
    updatePortfolioUI();

    // Verificar SL/TP
    const triggered = sim.checkSLTP(prices);
    triggered.forEach(t => {
      showFlash(`🤖 ${t.reason} en ${t.pos.symbol}. Posición cerrada automáticamente.`, t.pnl >= 0 ? 'success' : 'warning');
      updateHistoryUI();
    });

    // Verificar limit orders
    const execLimits = sim.checkLimitOrders(prices);
    execLimits.forEach(l => {
      showFlash(`✅ Orden limit ejecutada: ${l.qty} ${l.symbol}`, 'success');
    });

    // Re-renderizar si el símbolo activo cambió
    if (document.getElementById('tab-panel').classList.contains('active')) {
      loadChart();
    }
  }, 2500);
}

/* ─── Info del símbolo activo ────────────────────────────────────────── */
function updateSymbolInfo() {
  const last = MARKET_DATA[curSymbol].candles.slice(-1)[0];
  const prev = MARKET_DATA[curSymbol].candles.slice(-2)[0];
  const chg  = ((last.close - prev.close) / prev.close) * 100;
  const chgAbs = last.close - prev.close;

  document.getElementById('sym-price').textContent = '$' + last.close.toFixed(2);
  const chgEl = document.getElementById('sym-change');
  chgEl.textContent = `${chgAbs >= 0 ? '+' : ''}${chgAbs.toFixed(2)} (${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%)`;
  chgEl.className   = chg >= 0 ? 'positive' : 'negative';

  // Sidebar summary
  const metrics = sim.getPortfolioMetrics(prices);
  document.getElementById('cash-display').textContent  = '$' + metrics.cash.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  document.getElementById('portfolio-value').textContent = '$' + metrics.total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const pnlEl = document.getElementById('pnl-total');
  pnlEl.textContent = (metrics.totalPnl >= 0 ? '+' : '') + '$' + metrics.totalPnl.toFixed(2);
  pnlEl.className   = metrics.totalPnl >= 0 ? 'positive' : 'negative';
}

/* ─── Indicadores ────────────────────────────────────────────────────── */
function updateIndicatorsRow(data) {
  const closes = data.candles.map(c => c.close);
  const n      = closes.length;
  if (!n) return;
  const last   = closes[n - 1];
  const fmt    = v => v !== null ? '$' + v.toFixed(2) : '--';

  // RSI
  const rsiVal = data.rsi[n - 1];
  const rsiEl  = document.getElementById('rsi-value');
  const rsiSig = document.getElementById('rsi-signal');
  if (rsiVal !== null) {
    rsiEl.textContent = rsiVal.toFixed(1);
    if (rsiVal > 70)      { rsiSig.textContent = 'Sobrecomprado'; rsiSig.className = 'ind-signal negative'; }
    else if (rsiVal < 30) { rsiSig.textContent = 'Sobrevendido';  rsiSig.className = 'ind-signal positive'; }
    else                  { rsiSig.textContent = 'Normal';        rsiSig.className = 'ind-signal neutral'; }
  }

  // MACD
  const macdVal = data.macd.histogram[n - 1];
  const macdEl  = document.getElementById('macd-value');
  const macdSig = document.getElementById('macd-signal');
  if (macdVal !== undefined) {
    macdEl.textContent = macdVal.toFixed(3);
    macdSig.textContent = macdVal > 0 ? 'Alcista' : 'Bajista';
    macdSig.className   = 'ind-signal ' + (macdVal > 0 ? 'positive' : 'negative');
  }

  // MA20 / MA50
  const ma20v = data.ma20[n - 1];
  const ma50v = data.ma50[n - 1];
  document.getElementById('ma20-value').textContent = fmt(ma20v);
  document.getElementById('ma50-value').textContent = fmt(ma50v);
  const ma20Sig = document.getElementById('ma20-signal');
  const ma50Sig = document.getElementById('ma50-signal');
  if (ma20v !== null) {
    ma20Sig.textContent = last > ma20v ? 'Precio arriba' : 'Precio abajo';
    ma20Sig.className   = 'ind-signal ' + (last > ma20v ? 'positive' : 'negative');
  }
  if (ma50v !== null) {
    ma50Sig.textContent = last > ma50v ? 'Precio arriba' : 'Precio abajo';
    ma50Sig.className   = 'ind-signal ' + (last > ma50v ? 'positive' : 'negative');
  }

  // Señal general
  let bullish = 0, bearish = 0;
  if (rsiVal !== null)      { if (rsiVal < 50) bearish++; else bullish++; }
  if (macdVal !== undefined){ if (macdVal > 0) bullish++; else bearish++; }
  if (ma20v !== null)       { if (last > ma20v) bullish++; else bearish++; }
  if (ma50v !== null)       { if (last > ma50v) bullish++; else bearish++; }
  const sigEl    = document.getElementById('signal-value');
  const sigBadge = document.getElementById('signal-badge');
  if (bullish > bearish) {
    sigEl.textContent = 'Alcista'; sigBadge.textContent = '📈 COMPRA';
    sigBadge.className = 'signal-badge buy';
  } else if (bearish > bullish) {
    sigEl.textContent = 'Bajista'; sigBadge.textContent = '📉 VENTA';
    sigBadge.className = 'signal-badge sell';
  } else {
    sigEl.textContent = 'Neutral'; sigBadge.textContent = '⚖️ NEUTRO';
    sigBadge.className = 'signal-badge neutral';
  }
}

/* ─── Tabs ───────────────────────────────────────────────────────────── */
function bindTabNav() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');
      if (tab === 'panel') { setTimeout(() => chart._resize(), 50); }
      if (tab === 'portafolio') updatePortfolioUI();
      if (tab === 'historial')  updateHistoryUI();
    });
  });
}

/* ─── Períodos ───────────────────────────────────────────────────────── */
function bindPeriodBtns() {
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      curPeriod = btn.dataset.period;
      loadChart();
    });
  });
}

/* ─── Indicadores on/off ─────────────────────────────────────────────── */
function bindIndicatorBtns() {
  document.querySelectorAll('.ind-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      chart.setIndicator(btn.dataset.ind, btn.classList.contains('active'));
    });
  });
}

/* ─── Simulador UI ───────────────────────────────────────────────────── */
function bindSimulator() {
  // Tipo de orden (market / limit)
  document.querySelectorAll('#tab-simulador .radio-btn[data-val="market"], #tab-simulador .radio-btn[data-val="limit"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tab-simulador .radio-btn[data-val="market"], #tab-simulador .radio-btn[data-val="limit"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isLimit = btn.dataset.val === 'limit';
      document.getElementById('limit-price-group').style.display = isLimit ? '' : 'none';
      document.getElementById('tip-market').style.display = isLimit ? 'none' : '';
      document.getElementById('tip-limit').style.display  = isLimit ? '' : 'none';
    });
  });

  // Dirección (buy / sell)
  document.querySelectorAll('#tab-simulador .radio-btn[data-val="buy"], #tab-simulador .radio-btn[data-val="sell"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#tab-simulador .radio-btn[data-val="buy"], #tab-simulador .radio-btn[data-val="sell"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Actualizar preview al cambiar campos
  ['sim-qty', 'sim-symbol'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateSimPreview);
    document.getElementById(id)?.addEventListener('change', updateSimPreview);
  });

  // Ejecutar
  document.getElementById('sim-execute-btn').addEventListener('click', executeSimOrder);

  updateSimPreview();
}

function updateSimPreview() {
  const sym   = document.getElementById('sim-symbol')?.value;
  const qty   = parseInt(document.getElementById('sim-qty')?.value || '1');
  if (!sym || !qty) return;
  const price = prices[sym] || 0;
  const total = price * qty;
  const metrics = sim.getPortfolioMetrics(prices);

  document.getElementById('prev-price').textContent = '$' + price.toFixed(2);
  document.getElementById('prev-total').textContent = '$' + total.toFixed(2);
  document.getElementById('prev-cash').textContent  = '$' + metrics.cash.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function executeSimOrder() {
  const symbol     = document.getElementById('sim-symbol').value;
  const type       = document.querySelector('#tab-simulador .radio-btn[data-val="market"].active, #tab-simulador .radio-btn[data-val="limit"].active')?.dataset.val || 'market';
  const direction  = document.querySelector('#tab-simulador .radio-btn[data-val="buy"].active, #tab-simulador .radio-btn[data-val="sell"].active')?.dataset.val || 'buy';
  const qty        = document.getElementById('sim-qty').value;
  const limitPrice = document.getElementById('sim-limit-price').value;
  const sl         = document.getElementById('sim-sl').value;
  const tp         = document.getElementById('sim-tp').value;
  const currentPrice = prices[symbol];

  const result = sim.execute({ symbol, type, direction, qty, limitPrice, sl, tp, currentPrice });

  const msgEl = document.getElementById('sim-message');
  msgEl.textContent = result.msg;
  msgEl.className   = 'sim-msg ' + (result.ok ? 'success' : 'error');

  if (result.ok) {
    updatePortfolioUI();
    updateHistoryUI();
    updateSimPreview();
  }

  setTimeout(() => msgEl.textContent = '', 6000);
}

/* ─── Portafolio UI ──────────────────────────────────────────────────── */
function updatePortfolioUI() {
  const m = sim.getPortfolioMetrics(prices);

  document.getElementById('port-cash').textContent   = '$' + m.cash.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  document.getElementById('port-equity').textContent = '$' + m.equity.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  document.getElementById('port-total').textContent  = '$' + m.total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const pnlEl = document.getElementById('port-pnl');
  const sign  = m.totalPnl >= 0 ? '+' : '';
  pnlEl.textContent = `${sign}$${m.totalPnl.toFixed(2)} (${sign}${((m.totalPnl / 100000) * 100).toFixed(2)}%)`;
  pnlEl.className   = 'pmc-value ' + (m.totalPnl >= 0 ? 'positive' : 'negative');

  const tbody = document.getElementById('positions-tbody');
  if (!m.positions.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-msg">No tienes posiciones abiertas aún.</td></tr>';
    return;
  }
  tbody.innerHTML = m.positions.map(p => `
    <tr>
      <td><b>${p.symbol}</b></td>
      <td>${p.qty}</td>
      <td>$${p.avgPrice.toFixed(2)}</td>
      <td>$${p.currentPrice.toFixed(2)}</td>
      <td class="${p.pnl >= 0 ? 'positive' : 'negative'}">${p.pnl >= 0 ? '+' : ''}$${p.pnl.toFixed(2)} (${p.pnlPct >= 0 ? '+' : ''}${p.pnlPct.toFixed(2)}%)</td>
      <td>${p.sl ? '$' + p.sl.toFixed(2) : '–'}</td>
      <td>${p.tp ? '$' + p.tp.toFixed(2) : '–'}</td>
      <td><button class="btn-close-pos" data-id="${p.id}" data-sym="${p.symbol}" data-qty="${p.qty}">Cerrar</button></td>
    </tr>`).join('');

  tbody.querySelectorAll('.btn-close-pos').forEach(btn => {
    btn.addEventListener('click', () => {
      const sym = btn.dataset.sym;
      const qty = btn.dataset.qty;
      const result = sim.execute({ symbol: sym, type: 'market', direction: 'sell', qty, currentPrice: prices[sym] });
      showFlash(result.msg, result.ok ? 'success' : 'error');
      updatePortfolioUI();
      updateHistoryUI();
    });
  });
}

/* ─── Historial UI ───────────────────────────────────────────────────── */
function updateHistoryUI() {
  const stats = sim.getHistoryStats();
  document.getElementById('hs-total').textContent  = stats.total;
  document.getElementById('hs-wins').textContent   = stats.wins;
  document.getElementById('hs-losses').textContent = stats.losses;
  const pnlEl = document.getElementById('hs-pnl');
  pnlEl.textContent = (stats.realizedPnl >= 0 ? '+' : '') + '$' + stats.realizedPnl.toFixed(2);
  pnlEl.className   = stats.realizedPnl >= 0 ? 'positive' : 'negative';

  const tbody = document.getElementById('history-tbody');
  if (!sim.history.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-msg">No hay operaciones registradas.</td></tr>';
    return;
  }
  tbody.innerHTML = sim.history.map(h => {
    const date = new Date(h.ts).toLocaleString('es-CO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    const pnlStr = h.pnl !== null && h.pnl !== undefined
      ? `<span class="${h.pnl >= 0 ? 'positive' : 'negative'}">${h.pnl >= 0 ? '+' : ''}$${h.pnl.toFixed(2)}</span>`
      : '–';
    return `<tr>
      <td>${date}</td>
      <td><b>${h.symbol}</b></td>
      <td>${h.type || 'market'}</td>
      <td class="${h.direction === 'buy' ? 'positive' : 'negative'}">${h.direction === 'buy' ? 'COMPRA' : 'VENTA'}</td>
      <td>${h.qty}</td>
      <td>$${(h.price || 0).toFixed(2)}</td>
      <td>$${((h.qty || 0) * (h.price || 0)).toFixed(2)}</td>
      <td>${pnlStr}</td>
    </tr>`;
  }).join('');
}

function bindHistorialControls() {
  document.getElementById('export-csv-btn').addEventListener('click', () => sim.exportCSV());
  document.getElementById('reset-sim-btn').addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres reiniciar la simulación? Se perderá todo el progreso.')) {
      sim.reset();
      updatePortfolioUI();
      updateHistoryUI();
      updateSimPreview();
      showFlash('✅ Simulación reiniciada. Nuevo saldo: $100,000', 'success');
    }
  });
}

/* ─── Academia ───────────────────────────────────────────────────────── */
function buildAcademy() {
  const container = document.getElementById('lessons-container');
  container.innerHTML = ACADEMY_LESSONS.map((lesson, i) => `
    <details class="lesson-card" ${i === 0 ? 'open' : ''}>
      <summary class="lesson-summary">
        <i class="fas ${lesson.icon}"></i>
        <span>${lesson.title}</span>
        <i class="fas fa-chevron-down lesson-arrow"></i>
      </summary>
      <div class="lesson-body">${lesson.body}</div>
    </details>`).join('');
}

/* ─── Tema ───────────────────────────────────────────────────────────── */
function bindThemeToggle() {
  document.getElementById('theme-toggle').addEventListener('click', () => {
    isDark = !isDark;
    document.body.classList.toggle('dark-theme',  isDark);
    document.body.classList.toggle('light-theme', !isDark);
    document.getElementById('theme-toggle').innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    chart.setTheme(isDark);
  });
}

/* ─── Modal de ayuda ─────────────────────────────────────────────────── */
function bindHelpBtns() {
  document.querySelectorAll('.help-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tip = TIPS[btn.dataset.tip];
      if (!tip) return;
      document.getElementById('modal-title').textContent = tip.title;
      document.getElementById('modal-body').textContent  = tip.body;
      document.getElementById('tip-modal').classList.remove('hidden');
    });
  });
}

function bindModalClose() {
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('tip-modal').classList.add('hidden');
  });
  document.getElementById('tip-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('tip-modal'))
      document.getElementById('tip-modal').classList.add('hidden');
  });
}

/* ─── Flash notifications ────────────────────────────────────────────── */
function showFlash(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `flash-msg flash-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('flash-show'), 10);
  setTimeout(() => {
    el.classList.remove('flash-show');
    setTimeout(() => el.remove(), 400);
  }, 4000);
}
