// =============================================================================
// APP.JS — Controlador principal de TradeVision Pro v3
// =============================================================================

// Estado de la app
let activeSymbol = 'AAPL';
let activeTimeframe = '1D';
let isDarkTheme = true;
let activeOrderType = 'buy';
let portPieChart = null;
let portBarChart = null;

// ------------------------------------------------------------------
// Init
// ------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initClock();
    initChart();
    initWatchlist();
    initIndicatorToggles();
    initChartTools();
    initOrderPanel();
    initSimulator();
    initPortfolio();
    initHistory();
    initLearn();
    initThemeToggle();
    initTickerTape();
    initInfoTips();
    updateMetricsPanel();
    updateNavBalance();

    // Actualización periódica
    setInterval(() => {
        checkStopLossTP();
        updateNavBalance();
        updateSimBalance();
        updatePortfolioCharts();
    }, 5000);
});

// ------------------------------------------------------------------
// Pestañas
// ------------------------------------------------------------------
function initTabs() {
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + tab).classList.add('active');

            // Rerender gráficos en portafolio
            if (tab === 'portfolio') { setTimeout(updatePortfolioCharts, 100); }
            if (tab === 'history')   { renderHistory(); }
        });
    });
}

// ------------------------------------------------------------------
// Reloj
// ------------------------------------------------------------------
function initClock() {
    const update = () => {
        const now = new Date();
        document.getElementById('clock').textContent = now.toLocaleTimeString('es-CO');
    };
    update();
    setInterval(update, 1000);
}

// ------------------------------------------------------------------
// Gráfico principal
// ------------------------------------------------------------------
function initChart() {
    chartEngine = new CandleChartEngine();
    chartEngine.loadData(activeSymbol, activeTimeframe);
    updateMetricsPanel();

    // Timeframes
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeTimeframe = btn.dataset.tf;
            chartEngine.loadData(activeSymbol, activeTimeframe);
            updateMetricsPanel();
        });
    });
}

function updateMetricsPanel() {
    const data = getMarketData(activeSymbol, activeTimeframe);
    if (!data.length) return;
    const last = data[data.length - 1];
    const stock = STOCKS[activeSymbol];

    document.getElementById('symbolName').textContent     = activeSymbol;
    document.getElementById('symbolFullName').textContent = stock.name;
    document.getElementById('currentPrice').textContent   = '$' + currentPrices[activeSymbol].toFixed(2);

    const change  = priceChanges[activeSymbol];
    const changePct = priceChangePct[activeSymbol];
    const el = document.getElementById('priceChange');
    el.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`;
    el.className = 'price-change ' + (change >= 0 ? 'positive' : 'negative');

    document.getElementById('mOpen').textContent  = '$' + last.open.toFixed(2);
    document.getElementById('mHigh').textContent  = '$' + last.high.toFixed(2);
    document.getElementById('mLow').textContent   = '$' + last.low.toFixed(2);
    document.getElementById('mClose').textContent = '$' + last.close.toFixed(2);
    document.getElementById('mVol').textContent   = formatVolume(last.volume);
    document.getElementById('mCap').textContent   = stock.marketCap;

    updateSignalMeter();
    updateOrderPrice();
    updateNews();
}

// ------------------------------------------------------------------
// Señal técnica
// ------------------------------------------------------------------
function updateSignalMeter() {
    const data = getMarketData(activeSymbol, activeTimeframe);
    if (data.length < 20) return;

    const rsi   = calcRSI(data);
    const ma20  = calcMA(data, 20);
    const ma50  = calcMA(data, Math.min(50, data.length));
    const last  = data[data.length - 1];
    const lastIdx = data.length - 1;

    let score = 0, signals = [];

    // RSI
    const rsiVal = rsi[lastIdx];
    if (rsiVal !== null) {
        if (rsiVal < 30) { score += 2; signals.push({ text: `RSI: ${rsiVal.toFixed(1)} — Sobrevendido (señal compra)`, type: 'buy' }); }
        else if (rsiVal > 70) { score -= 2; signals.push({ text: `RSI: ${rsiVal.toFixed(1)} — Sobrecomprado (señal venta)`, type: 'sell' }); }
        else { signals.push({ text: `RSI: ${rsiVal.toFixed(1)} — Zona neutra`, type: 'neutral' }); }
    }

    // MA20
    if (ma20[lastIdx]) {
        if (last.close > ma20[lastIdx]) { score += 1; signals.push({ text: `Precio sobre MM20 (alcista)`, type: 'buy' }); }
        else { score -= 1; signals.push({ text: `Precio bajo MM20 (bajista)`, type: 'sell' }); }
    }

    // MA50
    if (ma50[lastIdx]) {
        if (last.close > ma50[lastIdx]) { score += 1; signals.push({ text: `Precio sobre MM50 (alcista)`, type: 'buy' }); }
        else { score -= 1; signals.push({ text: `Precio bajo MM50 (bajista)`, type: 'sell' }); }
    }

    // Cambio diario
    if (priceChangePct[activeSymbol] > 1) { score += 1; signals.push({ text: `Tendencia diaria positiva +${priceChangePct[activeSymbol].toFixed(2)}%`, type: 'buy' }); }
    else if (priceChangePct[activeSymbol] < -1) { score -= 1; signals.push({ text: `Tendencia diaria negativa ${priceChangePct[activeSymbol].toFixed(2)}%`, type: 'sell' }); }

    // Normalizar a 0-100
    const normalized = Math.max(0, Math.min(100, ((score + 5) / 10) * 100));
    const fill  = document.getElementById('signalFill');
    const result = document.getElementById('signalResult');
    const detail = document.getElementById('signalDetail');

    fill.style.width = normalized + '%';
    if (score > 1) {
        result.textContent = '📈 Señal de COMPRA';
        result.className = 'signal-result positive';
        fill.className = 'signal-fill buy';
    } else if (score < -1) {
        result.textContent = '📉 Señal de VENTA';
        result.className = 'signal-result negative';
        fill.className = 'signal-fill sell';
    } else {
        result.textContent = '➡️ NEUTRAL';
        result.className = 'signal-result';
        fill.className = 'signal-fill neutral';
    }

    detail.innerHTML = signals.slice(0, 3).map(s =>
        `<div class="signal-item ${s.type}">${s.text}</div>`
    ).join('');
}

// ------------------------------------------------------------------
// Watchlist
// ------------------------------------------------------------------
function initWatchlist() {
    renderWatchlist();
    window.appUpdateWatchlist = renderWatchlist;
}

function renderWatchlist() {
    const el = document.getElementById('watchlist');
    el.innerHTML = Object.keys(STOCKS).map(sym => {
        const price  = currentPrices[sym];
        const change = priceChanges[sym];
        const pct    = priceChangePct[sym];
        const up     = change >= 0;
        return `
        <div class="watchlist-item ${sym === activeSymbol ? 'active' : ''}" data-sym="${sym}">
            <div class="wl-left">
                <span class="wl-sym">${sym}</span>
                <span class="wl-name">${STOCKS[sym].name.split(' ')[0]}</span>
            </div>
            <div class="wl-right">
                <span class="wl-price">$${price.toFixed(2)}</span>
                <span class="wl-change ${up ? 'positive' : 'negative'}">${up ? '+' : ''}${pct.toFixed(2)}%</span>
            </div>
        </div>`;
    }).join('');

    el.querySelectorAll('.watchlist-item').forEach(item => {
        item.addEventListener('click', () => {
            activeSymbol = item.dataset.sym;
            chartEngine.loadData(activeSymbol, activeTimeframe);
            updateMetricsPanel();
            renderWatchlist();
        });
    });
}

// ------------------------------------------------------------------
// Ticker tape
// ------------------------------------------------------------------
function initTickerTape() {
    const render = () => {
        const items = Object.keys(STOCKS).map(sym => {
            const p  = currentPrices[sym];
            const c  = priceChangePct[sym];
            const up = c >= 0;
            return `<span class="tick-item"><strong>${sym}</strong> $${p.toFixed(2)} <span class="${up ? 'positive' : 'negative'}">${up ? '▲' : '▼'}${Math.abs(c).toFixed(2)}%</span></span>`;
        });
        document.getElementById('tickerTape').innerHTML = items.join('') + items.join('');
    };
    render();
    setInterval(render, 5000);
}

// ------------------------------------------------------------------
// Noticias
// ------------------------------------------------------------------
function updateNews() {
    const stock = STOCKS[activeSymbol];
    const el    = document.getElementById('newsFeed');
    el.innerHTML = (stock.news || []).map(n => `
        <div class="news-item ${n.sentiment}">
            <span class="news-dot"></span>
            <div>
                <p class="news-headline">${n.headline}</p>
                <span class="news-time">${n.time}</span>
            </div>
        </div>`).join('');
}

// ------------------------------------------------------------------
// Indicadores toggle
// ------------------------------------------------------------------
function initIndicatorToggles() {
    document.querySelectorAll('.ind-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const name = btn.dataset.ind;
            const active = btn.classList.contains('active');
            chartEngine.toggleIndicator(name, active);
        });
    });
}

// ------------------------------------------------------------------
// Herramientas del gráfico
// ------------------------------------------------------------------
function initChartTools() {
    document.getElementById('btnZoomIn').addEventListener('click', () => chartEngine.zoom(1));
    document.getElementById('btnZoomOut').addEventListener('click', () => chartEngine.zoom(-1));
    document.getElementById('btnReset').addEventListener('click', () => chartEngine.resetView());
}

// ------------------------------------------------------------------
// Panel de orden rápida
// ------------------------------------------------------------------
function initOrderPanel() {
    document.querySelectorAll('.order-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.order-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeOrderType = btn.dataset.order;
            document.getElementById('quickBuyBtn').classList.toggle('hidden', activeOrderType !== 'buy');
            document.getElementById('quickSellBtn').classList.toggle('hidden', activeOrderType !== 'sell');
        });
    });

    document.getElementById('quickQty').addEventListener('input', updateOrderPrice);

    document.getElementById('quickBuyBtn').addEventListener('click', () => {
        const qty   = parseInt(document.getElementById('quickQty').value);
        const price = currentPrices[activeSymbol];
        const res   = executeBuy(activeSymbol, qty, price);
        showToast(res.message, res.success ? 'success' : 'error');
        if (res.success) { updateNavBalance(); updateSimBalance(); }
    });

    document.getElementById('quickSellBtn').addEventListener('click', () => {
        const qty   = parseInt(document.getElementById('quickQty').value);
        const price = currentPrices[activeSymbol];
        const res   = executeSell(activeSymbol, qty, price);
        showToast(res.message, res.success ? 'success' : 'error');
        if (res.success) { updateNavBalance(); updateSimBalance(); }
    });
}

function updateOrderPrice() {
    const qty   = parseInt(document.getElementById('quickQty').value) || 0;
    const price = currentPrices[activeSymbol] || 0;
    document.getElementById('orderPrice').textContent = '$' + price.toFixed(2);
    document.getElementById('orderTotal').textContent = '$' + (qty * price).toFixed(2);
}

function updateNavBalance() {
    const metrics = getPortfolioMetrics();
    document.getElementById('navBalance').textContent = formatCurrency(metrics.totalPortfolio);
}

// ------------------------------------------------------------------
// Simulador
// ------------------------------------------------------------------
function initSimulator() {
    const simSymbol     = document.getElementById('simSymbol');
    const simOrderType  = document.getElementById('simOrderType');
    const simQty        = document.getElementById('simQty');
    const simLimitPrice = document.getElementById('simLimitPrice');

    const updateSimPrice = () => {
        const sym   = simSymbol.value;
        const qty   = parseInt(simQty.value) || 0;
        const isLim = simOrderType.value === 'limit';
        const price = isLim && parseFloat(simLimitPrice.value) > 0
            ? parseFloat(simLimitPrice.value)
            : currentPrices[sym];
        document.getElementById('simCurrentPrice').textContent = '$' + (currentPrices[sym] || 0).toFixed(2);
        document.getElementById('simTotal').textContent        = '$' + (qty * price).toFixed(2);
    };

    simSymbol.addEventListener('change', updateSimPrice);
    simQty.addEventListener('input', updateSimPrice);
    simLimitPrice.addEventListener('input', updateSimPrice);
    simOrderType.addEventListener('change', () => {
        const isLim = simOrderType.value === 'limit';
        document.getElementById('limitPriceGroup').style.display = isLim ? '' : 'none';
        updateSimPrice();
    });
    document.getElementById('refreshSimPrice').addEventListener('click', updateSimPrice);

    document.getElementById('simBuyBtn').addEventListener('click', () => {
        const sym   = simSymbol.value;
        const qty   = parseInt(simQty.value);
        const isLim = simOrderType.value === 'limit';
        const price = isLim && parseFloat(simLimitPrice.value) > 0
            ? parseFloat(simLimitPrice.value)
            : currentPrices[sym];
        const sl  = document.getElementById('simStopLoss').value;
        const tp  = document.getElementById('simTakeProfit').value;
        const res = executeBuy(sym, qty, price, sl || null, tp || null);
        showSimMessage(res.message, res.success);
        updateSimBalance();
        if (res.success) updateNavBalance();
    });

    document.getElementById('simSellBtn').addEventListener('click', () => {
        const sym   = simSymbol.value;
        const qty   = parseInt(simQty.value);
        const price = currentPrices[sym];
        const res   = executeSell(sym, qty, price);
        showSimMessage(res.message, res.success);
        updateSimBalance();
        if (res.success) updateNavBalance();
    });

    document.getElementById('simResetBtn').addEventListener('click', () => {
        if (confirm('¿Seguro que quieres reiniciar la simulación? Perderás todo el historial.')) {
            resetSimState();
            updateSimBalance();
            updateNavBalance();
            showToast('✅ Simulación reiniciada. Balance restaurado a $100,000.', 'success');
        }
    });

    updateSimPrice();
    updateSimBalance();
}

function showSimMessage(msg, success) {
    const el = document.getElementById('simMessage');
    el.textContent  = msg;
    el.className    = 'sim-message ' + (success ? 'success' : 'error');
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function updateSimBalance() {
    const m = getPortfolioMetrics();
    document.getElementById('simBalance').textContent    = formatCurrency(m.cash);
    document.getElementById('simInvested').textContent   = formatCurrency(m.invested);
    document.getElementById('simPortValue').textContent  = formatCurrency(m.totalPortfolio);
    const unrealEl = document.getElementById('simUnrealized');
    unrealEl.textContent = (m.unrealizedPnL >= 0 ? '+' : '') + formatCurrency(m.unrealizedPnL);
    unrealEl.className = m.unrealizedPnL >= 0 ? 'positive' : 'negative';

    renderSimPositions();
}

function renderSimPositions() {
    const m  = getPortfolioMetrics();
    const el = document.getElementById('simPositions');
    if (!m.positions.length) {
        el.innerHTML = '<p class="empty-msg">No tienes posiciones abiertas. ¡Compra tu primera acción!</p>';
        return;
    }
    el.innerHTML = m.positions.map(p => `
        <div class="position-item">
            <div class="pos-header">
                <strong>${p.symbol}</strong>
                <span class="${p.unrealizedPnL >= 0 ? 'positive' : 'negative'}">
                    ${p.unrealizedPnL >= 0 ? '+' : ''}${formatCurrency(p.unrealizedPnL)} (${p.pnlPct.toFixed(2)}%)
                </span>
            </div>
            <div class="pos-detail">
                ${p.qty} acciones | Entrada: $${p.avgPrice.toFixed(2)} | Actual: $${p.currentPrice.toFixed(2)}
                ${p.stopLoss ? ` | SL: $${p.stopLoss}` : ''}
                ${p.takeProfit ? ` | TP: $${p.takeProfit}` : ''}
            </div>
        </div>`).join('');
}

// ------------------------------------------------------------------
// Portafolio
// ------------------------------------------------------------------
function initPortfolio() {
    updatePortfolioCharts();
}

function updatePortfolioCharts() {
    const m = getPortfolioMetrics();
    document.getElementById('portCash').textContent = formatCurrency(m.cash);
    document.getElementById('portInvested').textContent = formatCurrency(m.invested);
    document.getElementById('portTotal').textContent = formatCurrency(m.totalPortfolio);
    const relEl = document.getElementById('portRealized');
    relEl.textContent = (m.realizedPnL >= 0 ? '+' : '') + formatCurrency(m.realizedPnL);
    relEl.className = 'summary-value ' + (m.realizedPnL >= 0 ? 'positive' : 'negative');
    const unrelEl = document.getElementById('portUnrealized');
    unrelEl.textContent = (m.unrealizedPnL >= 0 ? '+' : '') + formatCurrency(m.unrealizedPnL);
    unrelEl.className = 'summary-value ' + (m.unrealizedPnL >= 0 ? 'positive' : 'negative');

    // Tabla de posiciones
    const tbody = document.getElementById('portPositionsBody');
    if (!m.positions.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-msg">No hay posiciones abiertas</td></tr>';
    } else {
        tbody.innerHTML = m.positions.map(p => `
            <tr>
                <td><strong>${p.symbol}</strong></td>
                <td>${p.qty}</td>
                <td>$${p.avgPrice.toFixed(2)}</td>
                <td>$${p.currentPrice.toFixed(2)}</td>
                <td>${formatCurrency(p.invested)}</td>
                <td>${formatCurrency(p.currentVal)}</td>
                <td class="${p.unrealizedPnL >= 0 ? 'positive' : 'negative'}">
                    ${p.unrealizedPnL >= 0 ? '+' : ''}${formatCurrency(p.unrealizedPnL)}
                    (${p.pnlPct.toFixed(2)}%)
                </td>
                <td>
                    <button class="sell-btn-small" onclick="quickSellPosition('${p.symbol}', ${p.qty})">
                        Vender todo
                    </button>
                </td>
            </tr>`).join('');
    }

    // Gráfico de torta
    renderPieChart(m);
    renderBarPLChart(m);
}

window.quickSellPosition = function(symbol, qty) {
    const res = executeSell(symbol, qty, currentPrices[symbol]);
    showToast(res.message, res.success ? 'success' : 'error');
    updatePortfolioCharts();
    updateNavBalance();
    updateSimBalance();
};

function renderPieChart(m) {
    const pieCanvas = document.getElementById('pieChart');
    if (!pieCanvas) return;
    const allLabels = ['Efectivo', ...m.positions.map(p => p.symbol)];
    const allValues = [m.cash, ...m.positions.map(p => p.currentVal)];
    const allColors = ['#64748b', '#26a69a', '#42a5f5', '#FFD700', '#ef5350', '#ce93d8', '#FF9800', '#4CAF50', '#E91E63', '#00BCD4', '#FF5722'];

    if (portPieChart) { portPieChart.destroy(); portPieChart = null; }
    portPieChart = new Chart(pieCanvas, {
        type: 'doughnut',
        data: {
            labels: allLabels,
            datasets: [{ data: allValues, backgroundColor: allColors.slice(0, allLabels.length), borderWidth: 2, borderColor: isDarkTheme ? '#1a1d2e' : '#fff' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)} (${((ctx.raw / m.totalPortfolio) * 100).toFixed(1)}%)`
                    }
                }
            }
        }
    });

    // Leyenda manual
    document.getElementById('pieLegend').innerHTML = allLabels.map((l, i) =>
        `<span class="legend-item"><span style="background:${allColors[i]}" class="legend-dot"></span>${l} ${((allValues[i] / m.totalPortfolio) * 100).toFixed(1)}%</span>`
    ).join('');
}

function renderBarPLChart(m) {
    const barCanvas = document.getElementById('barPLChart');
    if (!barCanvas || !m.positions.length) return;
    if (portBarChart) { portBarChart.destroy(); portBarChart = null; }
    portBarChart = new Chart(barCanvas, {
        type: 'bar',
        data: {
            labels: m.positions.map(p => p.symbol),
            datasets: [{
                label: 'G/P No Realizado',
                data: m.positions.map(p => p.unrealizedPnL),
                backgroundColor: m.positions.map(p => p.unrealizedPnL >= 0 ? 'rgba(38,166,154,0.7)' : 'rgba(239,83,80,0.7)'),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.07)' }, ticks: { color: '#aaa' } },
                y: { grid: { color: 'rgba(255,255,255,0.07)' }, ticks: { color: '#aaa', callback: v => '$' + v.toFixed(0) } }
            }
        }
    });
}

// ------------------------------------------------------------------
// Historial
// ------------------------------------------------------------------
function initHistory() {
    document.getElementById('histSearch').addEventListener('input', renderHistory);
    document.getElementById('exportCSV').addEventListener('click', exportHistoryCSV);
    renderHistory();
}

function renderHistory() {
    const stats = getHistoryStats();
    document.getElementById('statTotal').textContent   = stats.total;
    document.getElementById('statWins').textContent    = stats.wins;
    document.getElementById('statLosses').textContent  = stats.losses;
    document.getElementById('statWinRate').textContent = stats.winRate.toFixed(1) + '%';
    const plEl = document.getElementById('statPL');
    plEl.textContent = (stats.realizedPnL >= 0 ? '+' : '') + formatCurrency(stats.realizedPnL);
    plEl.className = 'stat-value ' + (stats.realizedPnL >= 0 ? 'positive' : 'negative');

    const filter = document.getElementById('histSearch').value.toLowerCase();
    const filtered = simState.history.filter(h => h.symbol.toLowerCase().includes(filter));
    const tbody = document.getElementById('historyBody');
    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">No hay operaciones registradas</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(h => {
        const d   = new Date(h.date).toLocaleString('es-CO');
        const pnl = h.pnl !== null
            ? `<span class="${h.pnl >= 0 ? 'positive' : 'negative'}">${h.pnl >= 0 ? '+' : ''}${formatCurrency(h.pnl)}</span>`
            : '-';
        return `<tr>
            <td>${d}</td>
            <td><strong>${h.symbol}</strong></td>
            <td><span class="type-badge ${h.type === 'COMPRA' ? 'buy' : 'sell'}">${h.type}</span></td>
            <td>${h.qty}</td>
            <td>$${h.price.toFixed(2)}</td>
            <td>${formatCurrency(h.total)}</td>
            <td>${pnl}</td>
        </tr>`;
    }).join('');
}

// ------------------------------------------------------------------
// Academia / Aprender
// ------------------------------------------------------------------
function initLearn() {
    const grid = document.getElementById('lessonsGrid');
    grid.innerHTML = LESSONS.map(l => `
        <div class="lesson-card" data-lesson="${l.id}">
            <div class="lesson-icon"><i class="${l.icon}"></i></div>
            <h3>${l.title}</h3>
            <p>${l.summary}</p>
            <button class="lesson-btn">Leer lección <i class="fas fa-arrow-right"></i></button>
        </div>`).join('');

    grid.querySelectorAll('.lesson-card').forEach(card => {
        card.addEventListener('click', () => openLesson(card.dataset.lesson));
    });

    // Modal
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === document.getElementById('modalOverlay')) closeModal();
    });
}

function openLesson(id) {
    const lesson = LESSONS.find(l => l.id === id);
    if (!lesson) return;
    document.getElementById('modalContent').innerHTML = lesson.content;
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// Info tips
function initInfoTips() {
    document.querySelectorAll('.info-tip[data-lesson]').forEach(tip => {
        tip.addEventListener('click', () => openLesson(tip.dataset.lesson));
        tip.style.cursor = 'pointer';
    });
}

// ------------------------------------------------------------------
// Tema
// ------------------------------------------------------------------
function initThemeToggle() {
    document.getElementById('themeToggle').addEventListener('click', () => {
        isDarkTheme = !isDarkTheme;
        document.body.classList.toggle('dark-theme',  isDarkTheme);
        document.body.classList.toggle('light-theme', !isDarkTheme);
        const icon = document.querySelector('#themeToggle i');
        icon.className = isDarkTheme ? 'fas fa-moon' : 'fas fa-sun';
        chartEngine.updateTheme(isDarkTheme);
    });
}

// ------------------------------------------------------------------
// Toast notifications
// ------------------------------------------------------------------
function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast     = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${msg}</span><button onclick="this.parentElement.remove()">✕</button>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 5000);
}
