/**
 * TradeVision Pro v3 – chart.js
 * Motor de gráfico de velas japonesas con Canvas nativo.
 * Soporta: zoom con rueda, arrastre horizontal, crosshair y tooltip.
 */

'use strict';

class CandleChart {
  constructor(mainCanvasId, volCanvasId) {
    this.mc    = document.getElementById(mainCanvasId);
    this.vc    = document.getElementById(volCanvasId);
    this.mCtx  = this.mc.getContext('2d');
    this.vCtx  = this.vc.getContext('2d');

    // Estado del gráfico
    this.data      = null;    // { candles, ma20, ma50, ma200, bb, rsi, macd }
    this.offset    = 0;       // desplazamiento horizontal (velas desde la derecha)
    this.visibleN  = 60;      // cantidad de velas visibles
    this.isDark    = true;

    // Opciones de indicadores
    this.showMA20  = true;
    this.showMA50  = true;
    this.showMA200 = false;
    this.showBB    = false;

    // Estado del mouse
    this.isDragging   = false;
    this.dragStartX   = 0;
    this.dragStartOff = 0;
    this.mouseX       = -1;
    this.mouseY       = -1;

    // Márgenes
    this.PAD_LEFT   = 10;
    this.PAD_RIGHT  = 70;
    this.PAD_TOP    = 20;
    this.PAD_BOTTOM = 30;

    this._bindEvents();
    this._resize();
  }

  /* ─── Resize ──────────────────────────────────────────────────── */
  _resize() {
    const wrapper  = this.mc.parentElement;
    const vWrapper = this.vc.parentElement;
    const dpr      = window.devicePixelRatio || 1;

    const mW = wrapper.clientWidth  || 800;
    const mH = wrapper.clientHeight || 420;
    const vH = vWrapper.clientHeight || 100;

    this.mc.width  = mW * dpr;
    this.mc.height = mH * dpr;
    this.mc.style.width  = mW + 'px';
    this.mc.style.height = mH + 'px';
    this.mCtx.scale(dpr, dpr);
    this.mW = mW; this.mH = mH;

    this.vc.width  = mW * dpr;
    this.vc.height = vH * dpr;
    this.vc.style.width  = mW + 'px';
    this.vc.style.height = vH + 'px';
    this.vCtx.scale(dpr, dpr);
    this.vW = mW; this.vH = vH;

    this.render();
  }

  /* ─── Eventos ─────────────────────────────────────────────────── */
  _bindEvents() {
    const mc = this.mc;

    // Zoom con rueda
    mc.addEventListener('wheel', e => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1.15 : 0.87;
      this.visibleN = Math.min(365, Math.max(5, Math.round(this.visibleN * delta)));
      this.render();
    }, { passive: false });

    // Arrastre
    mc.addEventListener('mousedown', e => {
      this.isDragging   = true;
      this.dragStartX   = e.offsetX;
      this.dragStartOff = this.offset;
      mc.style.cursor   = 'grabbing';
    });
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      mc.style.cursor = 'crosshair';
    });
    mc.addEventListener('mousemove', e => {
      this.mouseX = e.offsetX;
      this.mouseY = e.offsetY;
      if (this.isDragging) {
        const dx     = e.offsetX - this.dragStartX;
        const candleW = this._candleWidth();
        const moved  = Math.round(dx / candleW);
        this.offset  = Math.max(0, this.dragStartOff - moved);
      }
      this.render();
    });
    mc.addEventListener('mouseleave', () => {
      this.mouseX = -1; this.mouseY = -1;
      this.render();
    });

    // Touch (móvil)
    let lastTouchX = 0;
    mc.addEventListener('touchstart', e => {
      lastTouchX = e.touches[0].clientX;
    }, { passive: true });
    mc.addEventListener('touchmove', e => {
      const dx = e.touches[0].clientX - lastTouchX;
      lastTouchX = e.touches[0].clientX;
      const candleW = this._candleWidth();
      this.offset = Math.max(0, this.offset - Math.round(dx / candleW));
      this.render();
    }, { passive: true });

    // Pinch zoom
    let lastPinchDist = null;
    mc.addEventListener('touchstart', e => {
      if (e.touches.length === 2) lastPinchDist = null;
    }, { passive: true });
    mc.addEventListener('touchmove', e => {
      if (e.touches.length === 2) {
        const dx   = e.touches[0].clientX - e.touches[1].clientX;
        const dy   = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastPinchDist !== null) {
          const ratio = lastPinchDist / dist;
          this.visibleN = Math.min(365, Math.max(5, Math.round(this.visibleN * ratio)));
          this.render();
        }
        lastPinchDist = dist;
      }
    }, { passive: true });

    // Resize
    window.addEventListener('resize', () => this._resize());

    // Botones de zoom
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      this.visibleN = Math.max(5, Math.round(this.visibleN * 0.75));
      this.render();
    });
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      this.visibleN = Math.min(365, Math.round(this.visibleN * 1.33));
      this.render();
    });
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
      this.visibleN = 60; this.offset = 0;
      this.render();
    });
  }

  /* ─── Cargar datos ────────────────────────────────────────────── */
  loadData(data) {
    this.data   = data;
    this.offset = 0;
    this.render();
  }

  /* ─── Colores por tema ────────────────────────────────────────── */
  theme() {
    return this.isDark ? {
      bg:       '#0d1117',
      grid:     '#1e2a3a',
      text:     '#8b949e',
      textBold: '#c9d1d9',
      up:       '#26a641',
      down:     '#f85149',
      ma20:     '#f6c90e',
      ma50:     '#00bcd4',
      ma200:    '#ff9800',
      bbUpper:  'rgba(156,39,176,0.8)',
      bbLower:  'rgba(156,39,176,0.8)',
      bbFill:   'rgba(156,39,176,0.07)',
      cross:    'rgba(255,255,255,0.35)',
      volUp:    'rgba(38,166,65,0.55)',
      volDown:  'rgba(248,81,73,0.55)'
    } : {
      bg:       '#f6f8fa',
      grid:     '#d0d7de',
      text:     '#57606a',
      textBold: '#24292f',
      up:       '#1a7f37',
      down:     '#cf222e',
      ma20:     '#c29a06',
      ma50:     '#006785',
      ma200:    '#c55a00',
      bbUpper:  'rgba(100,0,150,0.8)',
      bbLower:  'rgba(100,0,150,0.8)',
      bbFill:   'rgba(100,0,150,0.07)',
      cross:    'rgba(0,0,0,0.3)',
      volUp:    'rgba(26,127,55,0.5)',
      volDown:  'rgba(207,34,46,0.5)'
    };
  }

  /* ─── Helpers ─────────────────────────────────────────────────── */
  _candleWidth() {
    const chartW = this.mW - this.PAD_LEFT - this.PAD_RIGHT;
    return Math.max(2, chartW / this.visibleN);
  }

  _getVisible() {
    const candles = this.data.candles;
    const total   = candles.length;
    const end     = total - this.offset;
    const start   = Math.max(0, end - this.visibleN);
    return { candles: candles.slice(start, end), startIdx: start, endIdx: end };
  }

  _scaleY(val, minV, maxV, h, padT, padB) {
    return padT + (1 - (val - minV) / (maxV - minV)) * (h - padT - padB);
  }

  _fmtDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  }

  _fmtPrice(n) {
    return '$' + n.toFixed(2);
  }

  /* ─── RENDER PRINCIPAL ────────────────────────────────────────── */
  render() {
    if (!this.data) return;
    const T = this.theme();
    const { candles, startIdx } = this._getVisible();
    if (!candles.length) return;

    this._drawMain(T, candles, startIdx);
    this._drawVolume(T, candles);
    this._updateTooltip(T, candles, startIdx);
  }

  /* ─── Gráfico principal ───────────────────────────────────────── */
  _drawMain(T, candles, startIdx) {
    const ctx = this.mCtx;
    const W = this.mW, H = this.mH;
    const PL = this.PAD_LEFT, PR = this.PAD_RIGHT;
    const PT = this.PAD_TOP,  PB = this.PAD_BOTTOM;
    const chartW = W - PL - PR;
    const cw     = chartW / candles.length;
    const body   = Math.max(1, cw * 0.6);
    const wick   = Math.max(1, cw * 0.12);

    // Fondo
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, W, H);

    // Rango Y
    let minV = Infinity, maxV = -Infinity;
    candles.forEach(c => {
      minV = Math.min(minV, c.low);
      maxV = Math.max(maxV, c.high);
    });
    // Incluir BB en rango si está activo
    if (this.showBB && this.data.bb) {
      const bbSlice = this.data.bb.slice(startIdx, startIdx + candles.length);
      bbSlice.forEach(b => {
        if (b.upper !== null) { minV = Math.min(minV, b.lower); maxV = Math.max(maxV, b.upper); }
      });
    }
    const pad = (maxV - minV) * 0.08;
    minV -= pad; maxV += pad;

    const sy = val => this._scaleY(val, minV, maxV, H, PT, PB);

    // ─── Grid horizontal ───
    ctx.strokeStyle = T.grid;
    ctx.lineWidth   = 0.5;
    const levels = 6;
    for (let i = 0; i <= levels; i++) {
      const v = minV + (maxV - minV) * (i / levels);
      const y = sy(v);
      ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(W - PR, y); ctx.stroke();
      ctx.fillStyle = T.text;
      ctx.font      = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(this._fmtPrice(v), W - PR + 4, y + 4);
    }

    // ─── Grid vertical + fechas ───
    const dateStep = Math.max(1, Math.floor(candles.length / 8));
    ctx.fillStyle   = T.text;
    ctx.font        = '10px Inter, sans-serif';
    ctx.textAlign   = 'center';
    candles.forEach((c, i) => {
      if (i % dateStep === 0) {
        const x = PL + i * cw + cw / 2;
        ctx.strokeStyle = T.grid;
        ctx.lineWidth   = 0.5;
        ctx.beginPath(); ctx.moveTo(x, PT); ctx.lineTo(x, H - PB); ctx.stroke();
        ctx.fillText(this._fmtDate(c.ts), x, H - PB + 16);
      }
    });

    // ─── Bollinger Bands ───
    if (this.showBB && this.data.bb) {
      const bbSlice = this.data.bb.slice(startIdx, startIdx + candles.length);
      ctx.beginPath();
      let firstUpper = true;
      bbSlice.forEach((b, i) => {
        if (b.upper === null) return;
        const x = PL + i * cw + cw / 2;
        if (firstUpper) { ctx.moveTo(x, sy(b.upper)); firstUpper = false; }
        else ctx.lineTo(x, sy(b.upper));
      });
      ctx.strokeStyle = T.bbUpper; ctx.lineWidth = 1.2; ctx.stroke();

      ctx.beginPath();
      let firstLower = true;
      bbSlice.forEach((b, i) => {
        if (b.lower === null) return;
        const x = PL + i * cw + cw / 2;
        if (firstLower) { ctx.moveTo(x, sy(b.lower)); firstLower = false; }
        else ctx.lineTo(x, sy(b.lower));
      });
      ctx.strokeStyle = T.bbLower; ctx.lineWidth = 1.2; ctx.stroke();

      // Fill entre bandas
      ctx.beginPath();
      const validBB = bbSlice.filter(b => b.upper !== null);
      if (validBB.length > 0) {
        validBB.forEach((b, i) => {
          const x = PL + bbSlice.findIndex(bb => bb === b) * cw + cw / 2;
          if (i === 0) ctx.moveTo(x, sy(b.upper));
          else ctx.lineTo(x, sy(b.upper));
        });
        for (let i = validBB.length - 1; i >= 0; i--) {
          const b = validBB[i];
          const x = PL + bbSlice.findIndex(bb => bb === b) * cw + cw / 2;
          ctx.lineTo(x, sy(b.lower));
        }
        ctx.closePath();
        ctx.fillStyle = T.bbFill; ctx.fill();
      }
    }

    // ─── Medias móviles ───
    const drawMA = (maData, color) => {
      const slice = maData.slice(startIdx, startIdx + candles.length);
      ctx.beginPath();
      let started = false;
      slice.forEach((v, i) => {
        if (v === null) return;
        const x = PL + i * cw + cw / 2;
        const y = sy(v);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    };

    if (this.showMA20  && this.data.ma20)  drawMA(this.data.ma20,  T.ma20);
    if (this.showMA50  && this.data.ma50)  drawMA(this.data.ma50,  T.ma50);
    if (this.showMA200 && this.data.ma200) drawMA(this.data.ma200, T.ma200);

    // ─── Velas ───
    candles.forEach((c, i) => {
      const x     = PL + i * cw;
      const xMid  = x + cw / 2;
      const isUp  = c.close >= c.open;
      const color = isUp ? T.up : T.down;
      const yHigh = sy(c.high);
      const yLow  = sy(c.low);
      const yOpen = sy(c.open);
      const yClose= sy(c.close);
      const bodyTop   = Math.min(yOpen, yClose);
      const bodyH     = Math.max(1, Math.abs(yClose - yOpen));
      const bodyLeft  = xMid - body / 2;

      // Mecha
      ctx.strokeStyle = color;
      ctx.lineWidth   = wick;
      ctx.beginPath();
      ctx.moveTo(xMid, yHigh);
      ctx.lineTo(xMid, yLow);
      ctx.stroke();

      // Cuerpo
      ctx.fillStyle = color;
      ctx.fillRect(bodyLeft, bodyTop, body, bodyH);
    });

    // ─── Crosshair ───
    if (this.mouseX >= PL && this.mouseX <= W - PR &&
        this.mouseY >= PT && this.mouseY <= H - PB) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = T.cross;
      ctx.lineWidth   = 1;
      // Línea vertical
      ctx.beginPath(); ctx.moveTo(this.mouseX, PT); ctx.lineTo(this.mouseX, H - PB); ctx.stroke();
      // Línea horizontal
      ctx.beginPath(); ctx.moveTo(PL, this.mouseY); ctx.lineTo(W - PR, this.mouseY); ctx.stroke();
      ctx.setLineDash([]);

      // Precio en el eje Y
      const hoverPrice = minV + (maxV - minV) * (1 - (this.mouseY - PT) / (H - PT - PB));
      const py = this.mouseY;
      ctx.fillStyle = this.isDark ? '#1f6feb' : '#0550ae';
      ctx.beginPath();
      ctx.roundRect(W - PR + 2, py - 9, PR - 4, 18, 3);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font      = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this._fmtPrice(hoverPrice), W - PR / 2 + 1, py + 4);
    }
  }

  /* ─── Gráfico de volumen ──────────────────────────────────────── */
  _drawVolume(T, candles) {
    const ctx = this.vCtx;
    const W = this.vW, H = this.vH;
    const PL = this.PAD_LEFT, PR = this.PAD_RIGHT;
    const cw = (W - PL - PR) / candles.length;
    const barW = Math.max(1, cw * 0.6);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, W, H);

    // Línea divisoria
    ctx.strokeStyle = T.grid;
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(PL, 0); ctx.lineTo(W - PR, 0); ctx.stroke();

    const maxVol = Math.max(...candles.map(c => c.volume));
    const PT = 8, PB = 18;

    candles.forEach((c, i) => {
      const x   = PL + i * cw;
      const xMid= x + cw / 2;
      const isUp= c.close >= c.open;
      const barH= (c.volume / maxVol) * (H - PT - PB);

      ctx.fillStyle = isUp ? T.volUp : T.volDown;
      ctx.fillRect(xMid - barW / 2, H - PB - barH, barW, barH);
    });

    // Etiqueta
    ctx.fillStyle = T.text;
    ctx.font      = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('VOL', PL, H - PB + 14);
  }

  /* ─── Tooltip flotante ────────────────────────────────────────── */
  _updateTooltip(T, candles, startIdx) {
    const tooltip = document.getElementById('chart-tooltip');
    if (!tooltip) return;
    const PL = this.PAD_LEFT, PR = this.PAD_RIGHT;
    const W  = this.mW;
    const cw = (W - PL - PR) / candles.length;

    if (this.mouseX < PL || this.mouseX > W - PR) {
      tooltip.classList.add('hidden');
      // Limpiar OHLCV bar
      return;
    }

    const idx = Math.min(candles.length - 1, Math.floor((this.mouseX - PL) / cw));
    if (idx < 0) { tooltip.classList.add('hidden'); return; }

    const c    = candles[idx];
    const isUp = c.close >= c.open;

    // Actualizar barra OHLCV
    const fmt = n => '$' + n.toFixed(2);
    const fmtVol = n => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : (n/1e3).toFixed(0)+'K';
    document.getElementById('bar-open')?.textContent  !== undefined && (document.getElementById('bar-open').textContent  = fmt(c.open));
    document.getElementById('bar-high')?.textContent  !== undefined && (document.getElementById('bar-high').textContent  = fmt(c.high));
    document.getElementById('bar-low')?.textContent   !== undefined && (document.getElementById('bar-low').textContent   = fmt(c.low));
    document.getElementById('bar-close')?.textContent !== undefined && (document.getElementById('bar-close').textContent = fmt(c.close));
    document.getElementById('bar-vol')?.textContent   !== undefined && (document.getElementById('bar-vol').textContent   = fmtVol(c.volume));

    // Tooltip
    const date = new Date(c.ts).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });
    tooltip.innerHTML = `
      <div class="tt-date">${date}</div>
      <div class="tt-row"><span>Apertura</span><b>${fmt(c.open)}</b></div>
      <div class="tt-row"><span>Máximo</span><b style="color:${T.up}">${fmt(c.high)}</b></div>
      <div class="tt-row"><span>Mínimo</span><b style="color:${T.down}">${fmt(c.low)}</b></div>
      <div class="tt-row"><span>Cierre</span><b style="color:${isUp ? T.up : T.down}">${fmt(c.close)}</b></div>
      <div class="tt-row"><span>Volumen</span><b>${fmtVol(c.volume)}</b></div>`;

    tooltip.classList.remove('hidden');
    // Posicionar tooltip
    let tx = this.mouseX + 14;
    if (tx + 160 > W) tx = this.mouseX - 170;
    tooltip.style.left = tx + 'px';
    tooltip.style.top  = (this.mouseY - 20) + 'px';
  }

  /* ─── API pública ─────────────────────────────────────────────── */
  setTheme(isDark) {
    this.isDark = isDark;
    this.render();
  }

  setIndicator(key, val) {
    if (key === 'ma20')  this.showMA20  = val;
    if (key === 'ma50')  this.showMA50  = val;
    if (key === 'ma200') this.showMA200 = val;
    if (key === 'bb')    this.showBB    = val;
    this.render();
  }
}
