/**
 * TradeVision Pro v3 – simulator.js
 * Simulador de compra/venta con saldo demo, posiciones, historial,
 * Stop Loss / Take Profit automáticos y persistencia en localStorage.
 */

'use strict';

class Simulator {
  constructor() {
    this.STORAGE_KEY = 'tradevision_v3';
    this._load();
  }

  /* ─── Persistencia ────────────────────────────────────────────── */
  _load() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
      if (saved) {
        this.cash      = saved.cash      ?? 100000;
        this.positions = saved.positions ?? [];
        this.history   = saved.history   ?? [];
        this.limitOrders = saved.limitOrders ?? [];
        return;
      }
    } catch (_) {}
    this.cash        = 100000;
    this.positions   = [];
    this.history     = [];
    this.limitOrders = [];
  }

  _save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      cash: this.cash,
      positions: this.positions,
      history: this.history,
      limitOrders: this.limitOrders
    }));
  }

  reset() {
    this.cash = 100000;
    this.positions   = [];
    this.history     = [];
    this.limitOrders = [];
    this._save();
  }

  /* ─── Ejecutar orden ──────────────────────────────────────────── */
  execute({ symbol, type, direction, qty, limitPrice, sl, tp, currentPrice }) {
    qty = parseInt(qty, 10);
    if (!qty || qty <= 0) return { ok: false, msg: 'La cantidad debe ser un número positivo.' };

    let execPrice = currentPrice;

    if (type === 'limit') {
      limitPrice = parseFloat(limitPrice);
      if (isNaN(limitPrice) || limitPrice <= 0) return { ok: false, msg: 'Ingresa un precio límite válido.' };
      // Guardar como orden pendiente
      this.limitOrders.push({ symbol, direction, qty, limitPrice, sl, tp, createdAt: Date.now() });
      this._save();
      return { ok: true, msg: `✅ Orden limit creada. Se ejecutará cuando ${symbol} ${direction === 'buy' ? 'baje a' : 'suba a'} $${limitPrice.toFixed(2)}.`, pending: true };
    }

    if (direction === 'buy') {
      const cost = execPrice * qty;
      if (cost > this.cash) return { ok: false, msg: `❌ Saldo insuficiente. Necesitas $${cost.toFixed(2)} y tienes $${this.cash.toFixed(2)}.` };
      this.cash -= cost;

      // Agregar posición (o aumentar existente)
      const existing = this.positions.find(p => p.symbol === symbol && p.direction === 'buy');
      if (existing) {
        const totalQty  = existing.qty + qty;
        existing.avgPrice = (existing.avgPrice * existing.qty + execPrice * qty) / totalQty;
        existing.qty      = totalQty;
        if (sl) existing.sl = parseFloat(sl);
        if (tp) existing.tp = parseFloat(tp);
      } else {
        this.positions.push({
          id: Date.now(),
          symbol, direction: 'buy', qty,
          avgPrice: execPrice,
          sl: sl ? parseFloat(sl) : null,
          tp: tp ? parseFloat(tp) : null
        });
      }

      this._addHistory({ symbol, type, direction, qty, price: execPrice, pnl: null });
      this._save();
      return { ok: true, msg: `✅ Compra ejecutada: ${qty} ${symbol} a $${execPrice.toFixed(2)}. Total: $${(qty * execPrice).toFixed(2)}.` };

    } else {
      // Venta
      const pos = this.positions.find(p => p.symbol === symbol && p.direction === 'buy');
      if (!pos) return { ok: false, msg: `❌ No tienes posiciones abiertas de ${symbol} para vender.` };
      if (qty > pos.qty) return { ok: false, msg: `❌ Solo tienes ${pos.qty} acciones de ${symbol}.` };

      const revenue = execPrice * qty;
      const cost    = pos.avgPrice * qty;
      const pnl     = revenue - cost;
      this.cash    += revenue;
      pos.qty      -= qty;
      if (pos.qty === 0) this.positions = this.positions.filter(p => p.id !== pos.id);

      this._addHistory({ symbol, type, direction, qty, price: execPrice, pnl });
      this._save();
      const pnlStr = (pnl >= 0 ? '+' : '') + '$' + pnl.toFixed(2);
      return { ok: true, msg: `✅ Venta ejecutada: ${qty} ${symbol} a $${execPrice.toFixed(2)}. P&L: ${pnlStr}.` };
    }
  }

  /* ─── Verificar SL/TP ─────────────────────────────────────────── */
  checkSLTP(prices) {
    const triggered = [];
    this.positions.forEach(pos => {
      const price = prices[pos.symbol];
      if (!price) return;
      let reason = null;
      if (pos.sl && price <= pos.sl) reason = `Stop Loss alcanzado ($${pos.sl.toFixed(2)})`;
      if (pos.tp && price >= pos.tp) reason = `Take Profit alcanzado ($${pos.tp.toFixed(2)})`;
      if (reason) triggered.push({ pos, price, reason });
    });

    triggered.forEach(({ pos, price, reason }) => {
      const revenue = price * pos.qty;
      const pnl     = revenue - pos.avgPrice * pos.qty;
      this.cash    += revenue;
      this.positions = this.positions.filter(p => p.id !== pos.id);
      this._addHistory({ symbol: pos.symbol, type: 'auto', direction: 'sell', qty: pos.qty, price, pnl, reason });
    });

    if (triggered.length > 0) this._save();
    return triggered;
  }

  /* ─── Verificar órdenes limit ─────────────────────────────────── */
  checkLimitOrders(prices) {
    const executed = [];
    this.limitOrders = this.limitOrders.filter(ord => {
      const price = prices[ord.symbol];
      if (!price) return true;
      const triggered =
        (ord.direction === 'buy'  && price <= ord.limitPrice) ||
        (ord.direction === 'sell' && price >= ord.limitPrice);

      if (triggered) {
        const result = this.execute({ ...ord, type: 'market', currentPrice: price });
        executed.push({ ...ord, result });
        return false; // Remover de pendientes
      }
      return true;
    });

    if (executed.length > 0) this._save();
    return executed;
  }

  /* ─── Historial ───────────────────────────────────────────────── */
  _addHistory(op) {
    this.history.unshift({
      ...op,
      ts: Date.now()
    });
    if (this.history.length > 500) this.history = this.history.slice(0, 500);
  }

  /* ─── Métricas de portafolio ──────────────────────────────────── */
  getPortfolioMetrics(prices) {
    let equity = 0;
    const positions = this.positions.map(pos => {
      const currentPrice = prices[pos.symbol] || pos.avgPrice;
      const value        = currentPrice * pos.qty;
      const pnl          = value - pos.avgPrice * pos.qty;
      equity            += value;
      return { ...pos, currentPrice, value, pnl, pnlPct: ((currentPrice - pos.avgPrice) / pos.avgPrice) * 100 };
    });

    const total = this.cash + equity;
    const startingCash = 100000;
    const totalPnl = total - startingCash;

    const realizedPnl = this.history
      .filter(h => h.pnl !== null && h.pnl !== undefined)
      .reduce((sum, h) => sum + h.pnl, 0);

    return { cash: this.cash, equity, total, totalPnl, realizedPnl, positions };
  }

  /* ─── Estadísticas de historial ───────────────────────────────── */
  getHistoryStats() {
    const trades = this.history.filter(h => h.pnl !== null && h.pnl !== undefined);
    const wins   = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const realizedPnl = trades.reduce((s, t) => s + t.pnl, 0);
    return { total: this.history.length, wins: wins.length, losses: losses.length, realizedPnl };
  }

  /* ─── Exportar CSV ────────────────────────────────────────────── */
  exportCSV() {
    const rows = [
      ['Fecha', 'Símbolo', 'Tipo', 'Dirección', 'Cantidad', 'Precio', 'Total', 'P&L']
    ];
    this.history.forEach(h => {
      const date = new Date(h.ts).toLocaleDateString('es-CO');
      rows.push([
        date, h.symbol, h.type || 'market',
        h.direction === 'buy' ? 'COMPRA' : 'VENTA',
        h.qty,
        h.price?.toFixed(2) ?? '',
        (h.qty * h.price)?.toFixed(2) ?? '',
        h.pnl !== null && h.pnl !== undefined ? h.pnl.toFixed(2) : ''
      ]);
    });
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `tradevision_historial_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
