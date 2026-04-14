// =============================================================================
// CHART-ENGINE.JS — Motor de gráficos de velas japonesas interactivo
// Canvas nativo con zoom, pan, tooltip, medias móviles y volumen
// =============================================================================

class CandleChartEngine {
    constructor(options) {
        this.candleCanvas = document.getElementById('candleChart');
        this.volumeCanvas = document.getElementById('volumeChart');
        this.rsiCanvas    = document.getElementById('rsiChart');
        this.tooltip      = document.getElementById('chartTooltip');
        this.wrapper      = document.getElementById('chartWrapper');

        this.ctx    = this.candleCanvas.getContext('2d');
        this.volCtx = this.volumeCanvas.getContext('2d');
        this.rsiCtx = this.rsiCanvas ? this.rsiCanvas.getContext('2d') : null;

        this.data   = [];
        this.symbol = 'AAPL';
        this.tf     = '1D';

        // Indicadores activos
        this.indicators = { ma20: true, ma50: true, ma200: false, bb: false, rsi: false };

        // Viewport: qué rango de velas se muestra
        this.viewStart  = 0;    // índice inicial visible
        this.viewEnd    = 0;    // índice final visible
        this.visibleCount = 80; // cuántas velas mostrar por defecto

        // Pan
        this.isDragging   = false;
        this.dragStartX   = 0;
        this.dragStartView = 0;

        // Colores
        this.colors = {
            bullBody:   '#26a69a',
            bearBody:   '#ef5350',
            bullWick:   '#26a69a',
            bearWick:   '#ef5350',
            ma20:       '#FFD700',
            ma50:       '#42a5f5',
            ma200:      '#FF9800',
            bbUpper:    'rgba(180,130,255,0.8)',
            bbLower:    'rgba(180,130,255,0.8)',
            bbFill:     'rgba(180,130,255,0.1)',
            grid:       'rgba(255,255,255,0.07)',
            text:       'rgba(255,255,255,0.6)',
            crosshair:  'rgba(255,255,255,0.3)',
            background: '#1a1d2e',
            volBull:    'rgba(38,166,154,0.7)',
            volBear:    'rgba(239,83,80,0.7)',
            rsiLine:    '#ce93d8',
            rsiOB:      'rgba(239,83,80,0.2)',
            rsiOS:      'rgba(38,166,154,0.2)',
        };

        // Ratios del layout
        this.PADDING = { top: 20, right: 70, bottom: 30, left: 10 };

        this.mouseX = -1;
        this.mouseY = -1;
        this.hoveredIndex = -1;

        this._bindEvents();
        this._startAnimLoop();
    }

    // ------------------------------------------------------------------
    // Carga datos y renderiza
    // ------------------------------------------------------------------
    loadData(symbol, tf) {
        this.symbol = symbol;
        this.tf     = tf;
        this.data   = getMarketData(symbol, tf);

        // Por defecto mostrar las últimas N velas
        this.visibleCount = Math.min(80, this.data.length);
        this.viewEnd      = this.data.length - 1;
        this.viewStart    = Math.max(0, this.viewEnd - this.visibleCount + 1);

        this._resize();
        this._draw();
    }

    // ------------------------------------------------------------------
    // Zoom
    // ------------------------------------------------------------------
    zoom(direction) { // direction: -1 = alejar, +1 = acercar
        const center = Math.floor((this.viewStart + this.viewEnd) / 2);
        const delta  = direction > 0 ? -8 : 8;
        this.visibleCount = Math.max(20, Math.min(this.data.length, this.visibleCount + delta));
        this.viewStart = Math.max(0, center - Math.floor(this.visibleCount / 2));
        this.viewEnd   = Math.min(this.data.length - 1, this.viewStart + this.visibleCount - 1);
        if (this.viewEnd - this.viewStart < this.visibleCount - 1) {
            this.viewStart = Math.max(0, this.viewEnd - this.visibleCount + 1);
        }
        this._draw();
    }

    resetView() {
        this.visibleCount = Math.min(80, this.data.length);
        this.viewEnd   = this.data.length - 1;
        this.viewStart = Math.max(0, this.viewEnd - this.visibleCount + 1);
        this._draw();
    }

    toggleIndicator(name, active) {
        this.indicators[name] = active;
        if (name === 'rsi') {
            document.getElementById('rsiWrapper').style.display = active ? 'block' : 'none';
            this._resize();
        }
        this._draw();
    }

    updateTheme(dark) {
        this.colors.grid       = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
        this.colors.text       = dark ? 'rgba(255,255,255,0.6)'  : 'rgba(0,0,0,0.6)';
        this.colors.crosshair  = dark ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.3)';
        this.colors.background = dark ? '#1a1d2e' : '#f8f9fa';
        this._draw();
    }

    // ------------------------------------------------------------------
    // Eventos mouse
    // ------------------------------------------------------------------
    _bindEvents() {
        // Resize via ResizeObserver (más preciso que window resize)
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => { this._resize(); this._draw(); });
            ro.observe(this.wrapper);
            ro.observe(this.volumeCanvas.parentElement);
        } else {
            window.addEventListener('resize', () => { this._resize(); this._draw(); });
        }

        // Zoom con rueda del mouse
        this.candleCanvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoom(e.deltaY < 0 ? 1 : -1);
        }, { passive: false });

        // Pan con click & drag
        this.candleCanvas.addEventListener('mousedown', (e) => {
            this.isDragging    = true;
            this.dragStartX    = e.clientX;
            this.dragStartView = this.viewStart;
            this.candleCanvas.style.cursor = 'grabbing';
        });
        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const rect = this.candleCanvas.getBoundingClientRect();
                const w = this._chartWidth();
                const candleW = w / this.visibleCount;
                const dx = e.clientX - this.dragStartX;
                const shift = Math.round(-dx / candleW);
                const newStart = Math.max(0, Math.min(this.data.length - this.visibleCount, this.dragStartView + shift));
                this.viewStart = newStart;
                this.viewEnd   = Math.min(this.data.length - 1, newStart + this.visibleCount - 1);
                this._draw();
            }
        });
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.candleCanvas.style.cursor = 'crosshair';
        });

        // Tooltip y crosshair
        this.candleCanvas.addEventListener('mousemove', (e) => {
            const rect = this.candleCanvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this._updateHover();
            this._draw();
        });
        this.candleCanvas.addEventListener('mouseleave', () => {
            this.mouseX = -1; this.mouseY = -1;
            this.hoveredIndex = -1;
            this.tooltip.style.display = 'none';
            this._draw();
        });

        // Touch para móviles
        let lastTouchDist = 0;
        this.candleCanvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                lastTouchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            } else if (e.touches.length === 1) {
                this.isDragging = true;
                this.dragStartX = e.touches[0].clientX;
                this.dragStartView = this.viewStart;
            }
        }, { passive: true });

        this.candleCanvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                if (Math.abs(dist - lastTouchDist) > 10) {
                    this.zoom(dist > lastTouchDist ? 1 : -1);
                    lastTouchDist = dist;
                }
            } else if (this.isDragging && e.touches.length === 1) {
                const rect = this.candleCanvas.getBoundingClientRect();
                const w = this._chartWidth();
                const candleW = w / this.visibleCount;
                const dx = e.touches[0].clientX - this.dragStartX;
                const shift = Math.round(-dx / candleW);
                const newStart = Math.max(0, Math.min(this.data.length - this.visibleCount, this.dragStartView + shift));
                this.viewStart = newStart;
                this.viewEnd   = Math.min(this.data.length - 1, newStart + this.visibleCount - 1);
                this._draw();
            }
        }, { passive: true });

        this.candleCanvas.addEventListener('touchend', () => { this.isDragging = false; });
    }

    _updateHover() {
        const w       = this._chartWidth();
        const candleW = w / this.visibleCount;
        const idx     = Math.floor((this.mouseX - this.PADDING.left) / candleW) + this.viewStart;
        if (idx >= this.viewStart && idx <= this.viewEnd && idx < this.data.length) {
            this.hoveredIndex = idx;
            this._showTooltip(idx);
        } else {
            this.hoveredIndex = -1;
            this.tooltip.style.display = 'none';
        }
    }

    _showTooltip(idx) {
        const d = this.data[idx];
        if (!d) return;
        document.getElementById('ttDate').textContent  = this._formatDate(d.date);
        document.getElementById('ttOpen').textContent  = '$' + d.open.toFixed(2);
        document.getElementById('ttHigh').textContent  = '$' + d.high.toFixed(2);
        document.getElementById('ttLow').textContent   = '$' + d.low.toFixed(2);
        document.getElementById('ttClose').textContent = '$' + d.close.toFixed(2);
        document.getElementById('ttVol').textContent   = formatVolume(d.volume);

        // Posición del tooltip
        const rect    = this.candleCanvas.getBoundingClientRect();
        const wW      = this._chartWidth();
        const candleW = wW / this.visibleCount;
        const x       = (idx - this.viewStart) * candleW + this.PADDING.left;
        const ttW     = 160;
        let left = x + 10;
        if (left + ttW > wW + this.PADDING.left) left = x - ttW - 10;
        this.tooltip.style.left    = left + 'px';
        this.tooltip.style.top     = '40px';
        this.tooltip.style.display = 'block';
    }

    // ------------------------------------------------------------------
    // Dimensiones
    // ------------------------------------------------------------------
    _resize() {
        const wr   = this.wrapper.getBoundingClientRect();
        const dpr  = window.devicePixelRatio || 1;
        const cW   = Math.max(wr.width  || this.wrapper.offsetWidth  || 600, 400);
        const cH   = Math.max(wr.height || this.wrapper.offsetHeight || 400, 300);

        // Reset transform antes de aplicar scale para evitar acumulación
        this.candleCanvas.width  = Math.round(cW * dpr);
        this.candleCanvas.height = Math.round(cH * dpr);
        this.candleCanvas.style.width  = cW + 'px';
        this.candleCanvas.style.height = cH + 'px';
        this.ctx = this.candleCanvas.getContext('2d');
        this.ctx.scale(dpr, dpr);

        const vWr  = this.volumeCanvas.parentElement.getBoundingClientRect();
        const vW   = Math.max(vWr.width || cW, 300);
        const vH   = this.volumeCanvas.parentElement.offsetHeight || 80;
        this.volumeCanvas.width  = Math.round(vW * dpr);
        this.volumeCanvas.height = Math.round(vH * dpr);
        this.volumeCanvas.style.width  = vW + 'px';
        this.volumeCanvas.style.height = vH + 'px';
        this.volCtx = this.volumeCanvas.getContext('2d');
        this.volCtx.scale(dpr, dpr);

        if (this.rsiCanvas && document.getElementById('rsiWrapper').style.display !== 'none') {
            const rH = this.rsiCanvas.parentElement.offsetHeight || 90;
            this.rsiCanvas.width  = Math.round(vW * dpr);
            this.rsiCanvas.height = Math.round(rH * dpr);
            this.rsiCanvas.style.width  = vW + 'px';
            this.rsiCanvas.style.height = rH + 'px';
            this.rsiCtx = this.rsiCanvas.getContext('2d');
            this.rsiCtx.scale(dpr, dpr);
        }
    }

    _chartWidth()  { return this.candleCanvas.clientWidth  - this.PADDING.left - this.PADDING.right; }
    _chartHeight() { return this.candleCanvas.clientHeight - this.PADDING.top  - this.PADDING.bottom; }

    // ------------------------------------------------------------------
    // Cálculo de escala
    // ------------------------------------------------------------------
    _getVisibleData() {
        return this.data.slice(this.viewStart, this.viewEnd + 1);
    }

    _getPriceRange(visible) {
        let min = Infinity, max = -Infinity;
        visible.forEach(d => {
            if (d.low  < min) min = d.low;
            if (d.high > max) max = d.high;
        });
        // Añadir BB si está activo
        if (this.indicators.bb) {
            const bb = calcBollinger(this.data);
            for (let i = this.viewStart; i <= this.viewEnd; i++) {
                if (bb.upper[i]) max = Math.max(max, bb.upper[i]);
                if (bb.lower[i]) min = Math.min(min, bb.lower[i]);
            }
        }
        const pad = (max - min) * 0.1;
        return { min: min - pad, max: max + pad };
    }

    _priceToY(price, min, max) {
        const h = this._chartHeight();
        return this.PADDING.top + h - ((price - min) / (max - min)) * h;
    }

    // ------------------------------------------------------------------
    // Render principal
    // ------------------------------------------------------------------
    _draw() {
        if (!this.data.length) return;
        const ctx = this.ctx;
        const W   = this.candleCanvas.clientWidth;
        const H   = this.candleCanvas.clientHeight;
        const cW  = this._chartWidth();
        const cH  = this._chartHeight();

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, W, H);

        const visible = this._getVisibleData();
        if (!visible.length) return;

        const { min, max } = this._getPriceRange(visible);
        const candleW      = cW / this.visibleCount;
        const bodyW        = Math.max(1, candleW * 0.7);

        // Grid y ejes
        this._drawGrid(ctx, min, max, W, H, cW, cH);

        // Bandas de Bollinger
        if (this.indicators.bb) this._drawBollinger(ctx, min, max, candleW);

        // Medias móviles
        if (this.indicators.ma20)  this._drawMA(ctx, 20,  this.colors.ma20,  min, max, candleW, 1.5);
        if (this.indicators.ma50)  this._drawMA(ctx, 50,  this.colors.ma50,  min, max, candleW, 2);
        if (this.indicators.ma200) this._drawMA(ctx, 200, this.colors.ma200, min, max, candleW, 2);

        // Velas japonesas
        for (let i = 0; i < visible.length; i++) {
            const d     = visible[i];
            const gIdx  = this.viewStart + i;
            const x     = this.PADDING.left + i * candleW + candleW / 2;
            const bull  = d.close >= d.open;
            const color = bull ? this.colors.bullBody : this.colors.bearBody;
            const isHov = gIdx === this.hoveredIndex;

            // Mecha
            ctx.strokeStyle = color;
            ctx.lineWidth   = Math.max(1, candleW * 0.15);
            ctx.beginPath();
            ctx.moveTo(x, this._priceToY(d.high, min, max));
            ctx.lineTo(x, this._priceToY(d.low,  min, max));
            ctx.stroke();

            // Cuerpo
            const yOpen  = this._priceToY(d.open,  min, max);
            const yClose = this._priceToY(d.close, min, max);
            const yTop   = Math.min(yOpen, yClose);
            const bH     = Math.max(1, Math.abs(yClose - yOpen));

            if (isHov) {
                ctx.shadowColor = color;
                ctx.shadowBlur  = 8;
            }
            ctx.fillStyle = color;
            ctx.fillRect(x - bodyW / 2, yTop, bodyW, bH);
            ctx.shadowBlur = 0;
        }

        // Crosshair
        if (this.mouseX >= 0) this._drawCrosshair(ctx, W, H, min, max);

        // Precio actual (última línea)
        this._drawCurrentPriceLine(ctx, min, max, W);

        // Volumen
        this._drawVolume(visible);

        // RSI
        if (this.indicators.rsi) this._drawRSI(visible);
    }

    // ------------------------------------------------------------------
    // Grid y etiquetas
    // ------------------------------------------------------------------
    _drawGrid(ctx, min, max, W, H, cW, cH) {
        const steps = 6;
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth   = 1;
        ctx.fillStyle   = this.colors.text;
        ctx.font        = '11px Inter, sans-serif';
        ctx.textAlign   = 'right';

        for (let i = 0; i <= steps; i++) {
            const price = min + (max - min) * (i / steps);
            const y     = this._priceToY(price, min, max);
            ctx.beginPath();
            ctx.moveTo(this.PADDING.left, y);
            ctx.lineTo(W - this.PADDING.right, y);
            ctx.stroke();
            ctx.fillText('$' + price.toFixed(2), W - 5, y + 4);
        }

        // Etiquetas de fecha en el eje X
        const visible  = this._getVisibleData();
        const candleW  = cW / this.visibleCount;
        const skipEvery = Math.max(1, Math.floor(visible.length / 8));
        ctx.textAlign  = 'center';
        visible.forEach((d, i) => {
            if (i % skipEvery === 0) {
                const x = this.PADDING.left + i * candleW + candleW / 2;
                ctx.fillText(this._formatDateShort(d.date), x, H - 8);
            }
        });
    }

    _drawCurrentPriceLine(ctx, min, max, W) {
        const lastCandle = this.data[this.data.length - 1];
        if (!lastCandle) return;
        const y     = this._priceToY(lastCandle.close, min, max);
        const bull  = lastCandle.close >= lastCandle.open;
        const color = bull ? this.colors.bullBody : this.colors.bearBody;

        ctx.strokeStyle = color;
        ctx.lineWidth   = 1;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.moveTo(this.PADDING.left, y);
        ctx.lineTo(W - this.PADDING.right, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Badge de precio
        ctx.fillStyle = color;
        const bW = 65;
        ctx.beginPath();
        ctx.roundRect(W - this.PADDING.right, y - 10, bW, 20, 3);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font      = 'bold 11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('$' + lastCandle.close.toFixed(2), W - this.PADDING.right + bW / 2, y + 4);
    }

    // ------------------------------------------------------------------
    // Medias Móviles
    // ------------------------------------------------------------------
    _drawMA(ctx, period, color, min, max, candleW, lineW) {
        const ma = calcMA(this.data, period);
        ctx.strokeStyle = color;
        ctx.lineWidth   = lineW;
        ctx.beginPath();
        let started = false;
        for (let i = this.viewStart; i <= this.viewEnd; i++) {
            if (ma[i] === null) continue;
            const x = this.PADDING.left + (i - this.viewStart) * candleW + candleW / 2;
            const y = this._priceToY(ma[i], min, max);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // ------------------------------------------------------------------
    // Bandas de Bollinger
    // ------------------------------------------------------------------
    _drawBollinger(ctx, min, max, candleW) {
        const bb = calcBollinger(this.data);
        const buildPath = (arr) => {
            ctx.beginPath();
            let s = false;
            for (let i = this.viewStart; i <= this.viewEnd; i++) {
                if (arr[i] === null) continue;
                const x = this.PADDING.left + (i - this.viewStart) * candleW + candleW / 2;
                const y = this._priceToY(arr[i], min, max);
                if (!s) { ctx.moveTo(x, y); s = true; } else ctx.lineTo(x, y);
            }
        };

        // Fill entre bandas
        ctx.beginPath();
        let started = false;
        const upperPts = [], lowerPts = [];
        for (let i = this.viewStart; i <= this.viewEnd; i++) {
            if (bb.upper[i] === null) continue;
            upperPts.push({ x: this.PADDING.left + (i - this.viewStart) * candleW + candleW / 2, y: this._priceToY(bb.upper[i], min, max) });
            lowerPts.push({ x: this.PADDING.left + (i - this.viewStart) * candleW + candleW / 2, y: this._priceToY(bb.lower[i], min, max) });
        }
        if (upperPts.length) {
            ctx.beginPath();
            ctx.moveTo(upperPts[0].x, upperPts[0].y);
            upperPts.forEach(p => ctx.lineTo(p.x, p.y));
            lowerPts.reverse().forEach(p => ctx.lineTo(p.x, p.y));
            ctx.closePath();
            ctx.fillStyle = this.colors.bbFill;
            ctx.fill();
        }

        buildPath(bb.upper);
        ctx.strokeStyle = this.colors.bbUpper; ctx.lineWidth = 1; ctx.stroke();
        buildPath(bb.lower);
        ctx.strokeStyle = this.colors.bbLower; ctx.lineWidth = 1; ctx.stroke();
    }

    // ------------------------------------------------------------------
    // Crosshair
    // ------------------------------------------------------------------
    _drawCrosshair(ctx, W, H, min, max) {
        ctx.strokeStyle = this.colors.crosshair;
        ctx.lineWidth   = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(this.mouseX, this.PADDING.top);
        ctx.lineTo(this.mouseX, H - this.PADDING.bottom);
        ctx.moveTo(this.PADDING.left, this.mouseY);
        ctx.lineTo(W - this.PADDING.right, this.mouseY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Badge de precio en el eje Y
        const price = min + (max - min) * (1 - (this.mouseY - this.PADDING.top) / this._chartHeight());
        if (price > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.roundRect(W - this.PADDING.right, this.mouseY - 10, 65, 20, 3);
            ctx.fill();
            ctx.fillStyle = this.colors.text;
            ctx.font      = '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('$' + price.toFixed(2), W - this.PADDING.right + 32, this.mouseY + 4);
        }
    }

    // ------------------------------------------------------------------
    // Volumen
    // ------------------------------------------------------------------
    _drawVolume(visible) {
        const ctx = this.volCtx;
        const W   = this.volumeCanvas.clientWidth;
        const H   = this.volumeCanvas.clientHeight;
        const PAD = { top: 5, bottom: 18, left: this.PADDING.left, right: this.PADDING.right };
        const cW  = W - PAD.left - PAD.right;
        const cH  = H - PAD.top - PAD.bottom;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, W, H);

        if (!visible.length) return;

        const maxVol   = Math.max(...visible.map(d => d.volume));
        const candleW  = cW / this.visibleCount;
        const barW     = Math.max(1, candleW * 0.7);

        // Grid línea
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(PAD.left, PAD.top);
        ctx.lineTo(W - PAD.right, PAD.top);
        ctx.stroke();

        visible.forEach((d, i) => {
            const bull  = d.close >= d.open;
            const barH  = (d.volume / maxVol) * cH;
            const x     = PAD.left + i * candleW + candleW / 2 - barW / 2;
            const y     = PAD.top + cH - barH;
            ctx.fillStyle = bull ? this.colors.volBull : this.colors.volBear;
            ctx.fillRect(x, y, barW, barH);
        });

        // Max vol label
        ctx.fillStyle = this.colors.text;
        ctx.font      = '10px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(formatVolume(maxVol), W - 2, PAD.top + 12);

        // Label eje
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font      = '10px Inter';
        ctx.fillText('VOL', PAD.left + 4, PAD.top + 12);

        // Fechas eje X de volumen
        const skipEvery = Math.max(1, Math.floor(visible.length / 8));
        ctx.fillStyle  = this.colors.text;
        ctx.textAlign  = 'center';
        ctx.font       = '10px Inter';
        visible.forEach((d, i) => {
            if (i % skipEvery === 0) {
                const x = PAD.left + i * candleW + candleW / 2;
                ctx.fillText(this._formatDateShort(d.date), x, H - 4);
            }
        });
    }

    // ------------------------------------------------------------------
    // RSI
    // ------------------------------------------------------------------
    _drawRSI(visible) {
        if (!this.rsiCtx) return;
        const ctx = this.rsiCtx;
        const W   = this.rsiCanvas.clientWidth;
        const H   = this.rsiCanvas.clientHeight;
        const PAD = { top: 5, bottom: 15, left: this.PADDING.left, right: this.PADDING.right };
        const cW  = W - PAD.left - PAD.right;
        const cH  = H - PAD.top - PAD.bottom;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, W, H);

        const rsi      = calcRSI(this.data);
        const candleW  = cW / this.visibleCount;
        const rsiToY   = (v) => PAD.top + cH - ((v - 0) / 100) * cH;

        // Zonas OB/OS
        ctx.fillStyle = this.colors.rsiOB;
        ctx.fillRect(PAD.left, rsiToY(70), cW, rsiToY(100) - rsiToY(70));
        ctx.fillStyle = this.colors.rsiOS;
        ctx.fillRect(PAD.left, rsiToY(30), cW, rsiToY(0) - rsiToY(30));

        // Líneas 70/30
        [70, 50, 30].forEach(v => {
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(PAD.left, rsiToY(v));
            ctx.lineTo(W - PAD.right, rsiToY(v));
            ctx.stroke();
            ctx.fillStyle = this.colors.text;
            ctx.font      = '10px Inter';
            ctx.textAlign = 'right';
            ctx.fillText(v, W - 2, rsiToY(v) + 4);
        });

        // Línea RSI
        ctx.strokeStyle = this.colors.rsiLine;
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        let started = false;
        for (let i = this.viewStart; i <= this.viewEnd; i++) {
            if (rsi[i] === null) continue;
            const x = PAD.left + (i - this.viewStart) * candleW + candleW / 2;
            const y = rsiToY(rsi[i]);
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // RSI actual
        if (rsi[this.viewEnd] !== null) {
            const currentRSI = rsi[this.viewEnd];
            ctx.fillStyle = this.colors.rsiLine;
            ctx.font      = 'bold 10px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('RSI: ' + currentRSI.toFixed(1), PAD.left + 4, PAD.top + 14);
        }
    }

    // ------------------------------------------------------------------
    // Loop de animación (precio en tiempo real)
    // ------------------------------------------------------------------
    _startAnimLoop() {
        let lastTick = 0;
        const loop = (ts) => {
            if (ts - lastTick > 2500) {
                simulatePriceTick();
                lastTick = ts;
                if (document.getElementById('tab-panel').classList.contains('active')) {
                    this._draw();
                    if (window.appUpdateWatchlist) window.appUpdateWatchlist();
                }
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    // ------------------------------------------------------------------
    // Helpers de fecha
    // ------------------------------------------------------------------
    _formatDate(d) {
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    _formatDateShort(d) {
        const tf = this.tf;
        if (tf === '1D' || tf === '1W') {
            return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    }
}

// Instancia global
let chartEngine;
