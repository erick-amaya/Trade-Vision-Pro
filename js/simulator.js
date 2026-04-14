// =============================================================================
// SIMULATOR.JS — Motor de simulación de compra/venta con portafolio
// =============================================================================

const INITIAL_BALANCE = 100000;

// Estado de la simulación (persistido en localStorage)
let simState = {
    cash: INITIAL_BALANCE,
    positions: {},   // { symbol: { qty, avgPrice, totalInvested } }
    history: [],     // [ { date, symbol, type, qty, price, total, pnl } ]
    realizedPnL: 0
};

function loadSimState() {
    try {
        const saved = localStorage.getItem('tradeVisionSimState_v3');
        if (saved) simState = JSON.parse(saved);
    } catch (e) { /* nada */ }
}

function saveSimState() {
    try {
        localStorage.setItem('tradeVisionSimState_v3', JSON.stringify(simState));
    } catch (e) { /* nada */ }
}

function resetSimState() {
    simState = {
        cash: INITIAL_BALANCE,
        positions: {},
        history: [],
        realizedPnL: 0
    };
    saveSimState();
}

// ------------------------------------------------------------------
// Comprar
// ------------------------------------------------------------------
function executeBuy(symbol, qty, price, stopLoss = null, takeProfit = null) {
    const total = qty * price;
    if (total > simState.cash) {
        return { success: false, message: `❌ Saldo insuficiente. Tienes ${formatCurrency(simState.cash)} y necesitas ${formatCurrency(total)}.` };
    }
    if (qty <= 0) return { success: false, message: '❌ La cantidad debe ser mayor a 0.' };

    simState.cash -= total;

    if (!simState.positions[symbol]) {
        simState.positions[symbol] = { qty: 0, avgPrice: 0, totalInvested: 0, stopLoss: null, takeProfit: null };
    }
    const pos = simState.positions[symbol];
    const prevTotal = pos.qty * pos.avgPrice;
    pos.qty          += qty;
    pos.totalInvested = prevTotal + total;
    pos.avgPrice      = pos.totalInvested / pos.qty;
    if (stopLoss)   pos.stopLoss   = parseFloat(stopLoss);
    if (takeProfit) pos.takeProfit = parseFloat(takeProfit);

    simState.history.unshift({
        date: new Date().toISOString(),
        symbol, type: 'COMPRA', qty, price, total,
        pnl: null
    });

    saveSimState();
    return {
        success: true,
        message: `✅ Compraste ${qty} acción(es) de ${symbol} a ${formatCurrency(price)} = ${formatCurrency(total, 2)}`
    };
}

// ------------------------------------------------------------------
// Vender
// ------------------------------------------------------------------
function executeSell(symbol, qty, price) {
    const pos = simState.positions[symbol];
    if (!pos || pos.qty <= 0) return { success: false, message: `❌ No tienes acciones de ${symbol} para vender.` };
    if (qty > pos.qty) return { success: false, message: `❌ Solo tienes ${pos.qty} acciones de ${symbol}.` };

    const total     = qty * price;
    const costBasis = qty * pos.avgPrice;
    const pnl       = total - costBasis;

    simState.cash += total;
    pos.qty       -= qty;
    pos.totalInvested = pos.qty * pos.avgPrice;
    simState.realizedPnL += pnl;

    if (pos.qty === 0) {
        delete simState.positions[symbol];
    }

    simState.history.unshift({
        date: new Date().toISOString(),
        symbol, type: 'VENTA', qty, price, total,
        pnl: pnl
    });

    saveSimState();
    const pnlStr = pnl >= 0 ? `✅ Ganancia: +${formatCurrency(pnl)}` : `⚠️ Pérdida: -${formatCurrency(Math.abs(pnl))}`;
    return {
        success: true,
        message: `✅ Vendiste ${qty} acción(es) de ${symbol} a ${formatCurrency(price)} = ${formatCurrency(total, 2)}. ${pnlStr}`
    };
}

// ------------------------------------------------------------------
// Calcula métricas del portafolio
// ------------------------------------------------------------------
function getPortfolioMetrics() {
    let totalCurrentValue = 0;
    let totalInvested     = 0;

    const positions = Object.entries(simState.positions).map(([sym, pos]) => {
        const currentPrice = currentPrices[sym] || pos.avgPrice;
        const currentVal   = pos.qty * currentPrice;
        const invested     = pos.qty * pos.avgPrice;
        const unrealizedPnL = currentVal - invested;
        totalCurrentValue  += currentVal;
        totalInvested      += invested;
        return {
            symbol: sym, qty: pos.qty,
            avgPrice: pos.avgPrice, currentPrice,
            invested, currentVal,
            unrealizedPnL,
            pnlPct: (unrealizedPnL / invested) * 100,
            stopLoss: pos.stopLoss, takeProfit: pos.takeProfit
        };
    });

    const totalUnrealized = totalCurrentValue - totalInvested;
    const totalPortfolio  = simState.cash + totalCurrentValue;

    return {
        cash: simState.cash,
        invested: totalInvested,
        currentValue: totalCurrentValue,
        totalPortfolio,
        unrealizedPnL: totalUnrealized,
        realizedPnL: simState.realizedPnL,
        positions
    };
}

// ------------------------------------------------------------------
// Estadísticas del historial
// ------------------------------------------------------------------
function getHistoryStats() {
    const sells  = simState.history.filter(h => h.type === 'VENTA');
    const wins   = sells.filter(h => h.pnl > 0).length;
    const losses = sells.filter(h => h.pnl <= 0).length;
    const total  = simState.history.length;
    const winRate = sells.length > 0 ? (wins / sells.length) * 100 : 0;
    return { total, wins, losses, winRate, realizedPnL: simState.realizedPnL };
}

// ------------------------------------------------------------------
// Exportar historial CSV
// ------------------------------------------------------------------
function exportHistoryCSV() {
    const header = 'Fecha,Activo,Tipo,Cantidad,Precio,Total,G/P\n';
    const rows = simState.history.map(h => {
        const d   = new Date(h.date).toLocaleString('es-CO');
        const pnl = h.pnl !== null ? h.pnl.toFixed(2) : '';
        return `"${d}","${h.symbol}","${h.type}",${h.qty},${h.price.toFixed(2)},${h.total.toFixed(2)},"${pnl}"`;
    });
    const csv  = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'historial_operaciones.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// ------------------------------------------------------------------
// Verificar stop loss / take profit (simulado)
// ------------------------------------------------------------------
function checkStopLossTP() {
    Object.entries(simState.positions).forEach(([sym, pos]) => {
        const price = currentPrices[sym];
        if (!price) return;
        if (pos.stopLoss && price <= pos.stopLoss) {
            const res = executeSell(sym, pos.qty, price);
            showToast(`🛑 STOP LOSS activado en ${sym}: ${res.message}`, 'warning');
        } else if (pos.takeProfit && price >= pos.takeProfit) {
            const res = executeSell(sym, pos.qty, price);
            showToast(`🎯 TAKE PROFIT activado en ${sym}: ${res.message}`, 'success');
        }
    });
}

// Inicializar
loadSimState();
