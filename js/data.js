/* =====================================================
   TradeVision Pro — Datos de Ejemplo
   ===================================================== */

// ---- Watchlist de acciones ----
const WATCHLIST = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Tecnología', exchange: 'NASDAQ', price: 185.50, change: 2.30, changePct: 1.26, volume: 58_200_000, mktCap: '2.89T', pe: 30.2, eps: 6.14, dividend: 0.96, high52: 198.23, low52: 164.08, beta: 1.28 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Tecnología', exchange: 'NASDAQ', price: 378.92, change: -1.45, changePct: -0.38, volume: 22_100_000, mktCap: '2.81T', pe: 36.5, eps: 10.38, dividend: 3.00, high52: 420.82, low52: 310.21, beta: 0.92 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Tecnología', exchange: 'NASDAQ', price: 140.25, change: 1.12, changePct: 0.81, volume: 18_500_000, mktCap: '1.75T', pe: 25.3, eps: 5.54, dividend: 0, high52: 153.78, low52: 102.21, beta: 1.06 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumo', exchange: 'NASDAQ', price: 178.35, change: 3.21, changePct: 1.83, volume: 41_300_000, mktCap: '1.85T', pe: 59.1, eps: 3.02, dividend: 0, high52: 201.20, low52: 118.35, beta: 1.18 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semiconductores', exchange: 'NASDAQ', price: 495.28, change: 12.40, changePct: 2.57, volume: 47_600_000, mktCap: '1.22T', pe: 65.8, eps: 7.53, dividend: 0.16, high52: 505.48, low52: 180.96, beta: 1.72 },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Tecnología', exchange: 'NASDAQ', price: 352.18, change: -5.62, changePct: -1.57, volume: 16_900_000, mktCap: '908B', pe: 23.1, eps: 15.25, dividend: 0, high52: 384.33, low52: 197.16, beta: 1.32 },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotriz', exchange: 'NASDAQ', price: 245.01, change: -8.34, changePct: -3.29, volume: 123_400_000, mktCap: '780B', pe: 75.4, eps: 3.25, dividend: 0, high52: 299.29, low52: 138.80, beta: 2.01 },
  { symbol: 'JPM',  name: 'JPMorgan Chase', sector: 'Finanzas', exchange: 'NYSE', price: 198.44, change: 0.87, changePct: 0.44, volume: 9_800_000, mktCap: '580B', pe: 11.2, eps: 17.71, dividend: 4.60, high52: 207.08, low52: 135.19, beta: 1.05 },
  { symbol: 'JNJ',  name: 'Johnson & Johnson', sector: 'Salud', exchange: 'NYSE', price: 152.30, change: -0.45, changePct: -0.29, volume: 7_200_000, mktCap: '366B', pe: 15.8, eps: 9.64, dividend: 4.76, high52: 175.97, low52: 143.14, beta: 0.54 },
  { symbol: 'KO',   name: 'Coca-Cola Co.', sector: 'Consumo', exchange: 'NYSE', price: 58.92, change: 0.23, changePct: 0.39, volume: 14_100_000, mktCap: '254B', pe: 22.4, eps: 2.63, dividend: 1.84, high52: 64.99, low52: 53.69, beta: 0.60 },
];

// ---- Generador de velas japonesas realistas ----
function generateCandleData(basePrice, count, volatility = 0.025, trend = 0.0003) {
  const candles = [];
  let price = basePrice;
  const now = Math.floor(Date.now() / 1000);
  const daySeconds = 86400;

  for (let i = count; i >= 0; i--) {
    const date = now - i * daySeconds;
    const drift = (Math.random() - 0.48) * volatility + trend;
    const open = price;
    const close = open * (1 + drift);
    const amplitude = Math.abs(drift) + Math.random() * volatility * 0.8;
    const high = Math.max(open, close) * (1 + amplitude * 0.5);
    const low  = Math.min(open, close) * (1 - amplitude * 0.5);
    const vol  = Math.floor(5_000_000 + Math.random() * 80_000_000);

    candles.push({
      time: date,
      open:  parseFloat(open.toFixed(2)),
      high:  parseFloat(high.toFixed(2)),
      low:   parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: vol
    });

    price = close;
  }
  return candles;
}

// ---- Pre-generar datos para cada símbolo ----
const CANDLE_DATA = {};
WATCHLIST.forEach(stock => {
  // Usar precio actual como semilla, generar 365 días de historial
  const seed = stock.price * (0.85 + Math.random() * 0.15);
  CANDLE_DATA[stock.symbol] = generateCandleData(seed, 365, 0.022, 0.0004);
});

// ---- Calcular Media Móvil Simple ----
function calcSMA(candles, period) {
  const result = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += candles[j].close;
    result.push({ time: candles[i].time, value: parseFloat((sum / period).toFixed(2)) });
  }
  return result.filter(d => d !== null);
}

// ---- Calcular Bandas de Bollinger ----
function calcBollinger(candles, period = 20, std = 2) {
  const sma = calcSMA(candles, period);
  const upper = [], lower = [], middle = [];

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1).map(c => c.close);
    const mean = slice.reduce((a,b) => a+b, 0) / period;
    const variance = slice.reduce((a,b) => a + (b-mean)**2, 0) / period;
    const sd = Math.sqrt(variance);
    const t = candles[i].time;
    upper.push({ time: t, value: parseFloat((mean + std*sd).toFixed(2)) });
    lower.push({ time: t, value: parseFloat((mean - std*sd).toFixed(2)) });
    middle.push({ time: t, value: parseFloat(mean.toFixed(2)) });
  }
  return { upper, lower, middle };
}

// ---- Calcular RSI ----
function calcRSI(candles, period = 14) {
  const closes = candles.map(c => c.close);
  const gains = [], losses = [];
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i-1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  if (gains.length < period) return 50;
  const avgGain = gains.slice(-period).reduce((a,b)=>a+b,0)/period;
  const avgLoss = losses.slice(-period).reduce((a,b)=>a+b,0)/period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - 100/(1+rs)).toFixed(1));
}

// ---- Calcular MACD ----
function calcMACD(candles) {
  function ema(data, period) {
    const k = 2/(period+1);
    let emaVal = data[0];
    return data.map(d => { emaVal = d*k + emaVal*(1-k); return parseFloat(emaVal.toFixed(2)); });
  }
  const closes = candles.map(c => c.close);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v,i) => v - ema26[i]);
  const signal = ema(macdLine, 9);
  const histogram = macdLine.map((v,i) => parseFloat((v - signal[i]).toFixed(2)));

  return candles.slice(-30).map((c,i) => {
    const idx = candles.length - 30 + i;
    return {
      time: c.time,
      macd: macdLine[idx],
      signal: signal[idx],
      histogram: histogram[idx]
    };
  });
}

// ---- Filtrar datos por período ----
function filterByPeriod(candles, period) {
  const now = candles[candles.length - 1].time;
  const ms = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365 };
  const days = ms[period] || 365;
  const cutoff = now - days * 86400;
  return candles.filter(c => c.time >= cutoff);
}

// ---- Noticias de ejemplo ----
const NEWS_DATA = {
  AAPL: [
    { title: 'Apple supera expectativas de ingresos en el Q4 con récord en ventas de iPhone 15', time: 'hace 2h', sentiment: 'bullish' },
    { title: 'Analistas elevan precio objetivo de Apple a $210 tras resultados trimestrales', time: 'hace 4h', sentiment: 'bullish' },
    { title: 'Apple planea lanzar nuevas funciones de IA en iOS 18 para 2025', time: 'hace 1d', sentiment: 'neutral' },
  ],
  MSFT: [
    { title: 'Microsoft reporta crecimiento del 17% en ingresos de Azure en el último trimestre', time: 'hace 1h', sentiment: 'bullish' },
    { title: 'Reguladores europeos investigan acuerdo de OpenAI con Microsoft', time: 'hace 6h', sentiment: 'bearish' },
    { title: 'Copilot de Microsoft llega a más de 600 millones de dispositivos', time: 'hace 2d', sentiment: 'bullish' },
  ],
  NVDA: [
    { title: 'NVIDIA bate récord histórico con ventas de chips H100 para centros de datos de IA', time: 'hace 30m', sentiment: 'bullish' },
    { title: 'Jensen Huang anuncia la próxima generación de GPUs Blackwell para 2025', time: 'hace 3h', sentiment: 'bullish' },
    { title: 'Tensiones con China podrían limitar exportaciones de chips avanzados de NVIDIA', time: 'hace 1d', sentiment: 'bearish' },
  ],
  TSLA: [
    { title: 'Tesla recorta precios por tercera vez este año ante caída de la demanda en Europa', time: 'hace 1h', sentiment: 'bearish' },
    { title: 'Elon Musk confirma retraso en el lanzamiento del Cybertruck en mercados internacionales', time: 'hace 5h', sentiment: 'bearish' },
    { title: 'Tesla entrega 466.000 vehículos en el Q3, superando estimaciones', time: 'hace 2d', sentiment: 'bullish' },
  ],
  DEFAULT: [
    { title: 'La Fed mantiene tasas de interés estables; mercados reaccionan positivamente', time: 'hace 2h', sentiment: 'bullish' },
    { title: 'S&P 500 alcanza nuevo máximo histórico impulsado por sector tecnológico', time: 'hace 4h', sentiment: 'bullish' },
    { title: 'Datos de empleo de EE.UU. muestran creación de 185.000 empleos en octubre', time: 'hace 1d', sentiment: 'neutral' },
  ]
};

// ---- Movers del día ----
const MOVERS = [
  { rank: 1, symbol: 'NVDA', name: 'NVIDIA', change: +2.57, up: true },
  { rank: 2, symbol: 'AMZN', name: 'Amazon', change: +1.83, up: true },
  { rank: 3, symbol: 'AAPL', name: 'Apple', change: +1.26, up: true },
  { rank: 4, symbol: 'GOOGL', name: 'Alphabet', change: +0.81, up: true },
  { rank: 5, symbol: 'JPM',  name: 'JPMorgan', change: +0.44, up: true },
  { rank: 6, symbol: 'TSLA', name: 'Tesla', change: -3.29, up: false },
  { rank: 7, symbol: 'META', name: 'Meta', change: -1.57, up: false },
  { rank: 8, symbol: 'MSFT', name: 'Microsoft', change: -0.38, up: false },
];

// ---- Contenido educativo ----
const LESSONS = {
  candles: {
    title: '📊 Velas Japonesas',
    content: `
      <h3><i class="fas fa-history"></i> ¿Qué son las velas japonesas?</h3>
      <p>Las velas japonesas son una forma de representar gráficamente el precio de una acción durante un período de tiempo (un día, una hora, etc.). Fueron inventadas por comerciantes japoneses de arroz en el siglo XVII y hoy son el estándar global en análisis técnico.</p>

      <h3><i class="fas fa-cube"></i> Anatomía de una vela</h3>
      <p>Cada vela contiene 4 datos clave:</p>
      <ul>
        <li><strong>Apertura (Open)</strong>: El precio al que comenzó a negociarse la acción en ese período.</li>
        <li><strong>Cierre (Close)</strong>: El precio al que terminó de negociarse.</li>
        <li><strong>Máximo (High)</strong>: El precio más alto alcanzado.</li>
        <li><strong>Mínimo (Low)</strong>: El precio más bajo alcanzado.</li>
      </ul>

      <div class="candle-diagram">
        <div class="candle-ex">
          <svg class="candle-svg" width="60" height="120" viewBox="0 0 60 120">
            <line x1="30" y1="10" x2="30" y2="30" stroke="#3fb950" stroke-width="2"/>
            <rect x="15" y="30" width="30" height="60" fill="#3fb950" rx="2"/>
            <line x1="30" y1="90" x2="30" y2="110" stroke="#3fb950" stroke-width="2"/>
            <text x="30" y="8" text-anchor="middle" fill="#8b949e" font-size="9">Máximo</text>
            <text x="30" y="118" text-anchor="middle" fill="#8b949e" font-size="9">Mínimo</text>
          </svg>
          <div class="edu-card-label" style="color:var(--positive);font-weight:700">Vela Alcista ▲</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">Cierre > Apertura</div>
        </div>
        <div style="flex:1;padding:0 20px;font-size:0.8rem;color:var(--text-secondary)">
          <p><strong style="color:var(--positive)">Vela Verde (Alcista):</strong> El precio subió. El cuerpo de la vela va desde la apertura (abajo) hasta el cierre (arriba).</p>
          <p style="margin-top:10px"><strong style="color:var(--negative)">Vela Roja (Bajista):</strong> El precio bajó. El cuerpo va desde la apertura (arriba) hasta el cierre (abajo).</p>
          <p style="margin-top:10px">Las líneas delgadas que sobresalen se llaman <strong>mechas o sombras</strong> y muestran el rango total de precios.</p>
        </div>
        <div class="candle-ex">
          <svg class="candle-svg" width="60" height="120" viewBox="0 0 60 120">
            <line x1="30" y1="10" x2="30" y2="30" stroke="#f85149" stroke-width="2"/>
            <rect x="15" y="30" width="30" height="60" fill="#f85149" rx="2"/>
            <line x1="30" y1="90" x2="30" y2="110" stroke="#f85149" stroke-width="2"/>
            <text x="30" y="8" text-anchor="middle" fill="#8b949e" font-size="9">Máximo</text>
            <text x="30" y="118" text-anchor="middle" fill="#8b949e" font-size="9">Mínimo</text>
          </svg>
          <div style="color:var(--negative);font-weight:700">Vela Bajista ▼</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">Cierre < Apertura</div>
        </div>
      </div>

      <div class="edu-highlight tip">
        <strong>💡 Consejo para principiantes:</strong> No intentes predecir el precio con una sola vela. Lo importante es identificar patrones de varias velas y combinar con el volumen y tendencia general.
      </div>

      <h3><i class="fas fa-shapes"></i> Patrones importantes</h3>
      <ul>
        <li><strong>Doji:</strong> Apertura y cierre casi iguales. Señal de indecisión del mercado.</li>
        <li><strong>Martillo (Hammer):</strong> Mecha larga abajo, cuerpo pequeño arriba. Posible reversión alcista.</li>
        <li><strong>Envolvente alcista:</strong> Una vela verde que "envuelve" a la roja anterior. Señal de compra.</li>
        <li><strong>Estrella de la mañana:</strong> Tres velas (roja, doji, verde). Señal de posible giro al alza.</li>
      </ul>

      <div class="edu-highlight warn">
        <strong>⚠️ Recuerda:</strong> Los patrones de velas son señales, no certezas. Siempre confirma con otros indicadores como el volumen y las medias móviles.
      </div>
    `
  },
  volume: {
    title: '📊 Volumen de Negociación',
    content: `
      <h3><i class="fas fa-chart-bar"></i> ¿Qué es el volumen?</h3>
      <p>El volumen es la cantidad de acciones que se negocian (compran y venden) durante un período de tiempo. Es uno de los indicadores más importantes del mercado porque muestra el <strong>nivel de interés o convicción</strong> detrás de un movimiento de precio.</p>

      <h3><i class="fas fa-balance-scale"></i> ¿Por qué importa el volumen?</h3>
      <ul>
        <li><strong>Alto volumen + precio sube:</strong> Señal alcista fuerte. Hay muchos compradores convencidos.</li>
        <li><strong>Alto volumen + precio baja:</strong> Señal bajista fuerte. Hay muchos vendedores convencidos.</li>
        <li><strong>Bajo volumen + precio sube:</strong> Señal débil. El movimiento puede revertirse.</li>
        <li><strong>Bajo volumen + precio baja:</strong> La caída no tiene mucha convicción, puede ser temporal.</li>
      </ul>

      <div class="edu-highlight tip">
        <strong>💡 Regla de oro:</strong> "El volumen confirma o niega el precio." Si el precio sube pero el volumen cae, ojo, ¡la tendencia puede ser falsa!
      </div>

      <h3><i class="fas fa-search"></i> Cómo leer las barras de volumen</h3>
      <p>En el gráfico, verás barras verticales debajo del gráfico de velas. Cada barra corresponde a la misma vela del gráfico principal:</p>
      <ul>
        <li><strong>Barra verde:</strong> El precio cerró al alza ese día.</li>
        <li><strong>Barra roja:</strong> El precio cerró a la baja ese día.</li>
        <li><strong>Altura de la barra:</strong> Cuanto más alta, más volumen (más actividad).</li>
      </ul>

      <h3><i class="fas fa-exclamation-triangle"></i> Señales de alerta</h3>
      <ul>
        <li><strong>Volumen inusualmente alto:</strong> Puede indicar noticias importantes, resultados trimestrales o eventos especiales.</li>
        <li><strong>Spike de volumen:</strong> Un pico de volumen puede marcar el inicio o fin de una tendencia.</li>
      </ul>

      <div class="edu-highlight">
        <strong>📖 Ejemplo práctico:</strong> Si Apple (AAPL) sube un 3% en un día con el doble del volumen promedio, es una señal mucho más confiable que si subiera el mismo 3% con la mitad del volumen habitual.
      </div>
    `
  },
  ma: {
    title: '📈 Medias Móviles (MM)',
    content: `
      <h3><i class="fas fa-wave-square"></i> ¿Qué es una Media Móvil?</h3>
      <p>Una media móvil es el <strong>precio promedio de una acción durante un número determinado de días</strong>. Se llama "móvil" porque se recalcula cada día usando los días más recientes.</p>
      <p>Por ejemplo, la <strong>Media Móvil de 20 días (MM20)</strong> muestra el precio promedio de los últimos 20 días de negociación.</p>

      <h3><i class="fas fa-palette"></i> Las 3 medias más usadas</h3>
      <ul>
        <li><strong style="color:#f0e68c">MM20 (amarilla):</strong> Tendencia de corto plazo. Reactiva a cambios recientes.</li>
        <li><strong style="color:#87ceeb">MM50 (azul claro):</strong> Tendencia de mediano plazo. La más seguida por traders.</li>
        <li><strong style="color:#ff8c00">MM200 (naranja):</strong> Tendencia de largo plazo. La usan los inversores institucionales.</li>
      </ul>

      <h3><i class="fas fa-crosshairs"></i> Señales de compra y venta</h3>
      <ul>
        <li><strong>Precio > MM200:</strong> La acción está en tendencia alcista de largo plazo.</li>
        <li><strong>Precio < MM200:</strong> La acción está en tendencia bajista de largo plazo.</li>
        <li><strong>Golden Cross ✨:</strong> La MM50 cruza por encima de la MM200. Señal muy alcista.</li>
        <li><strong>Death Cross 💀:</strong> La MM50 cruza por debajo de la MM200. Señal muy bajista.</li>
      </ul>

      <div class="edu-highlight tip">
        <strong>💡 Estrategia simple para principiantes:</strong> Compra cuando el precio está por encima de la MM20 Y la MM50. Vende (o espera) cuando esté por debajo de ambas.
      </div>

      <h3><i class="fas fa-shield-alt"></i> Las medias como soporte y resistencia</h3>
      <p>Las medias móviles también actúan como <strong>niveles de soporte</strong> (pisos) cuando el precio baja hacia ellas, o como <strong>resistencia</strong> (techos) cuando el precio intenta superarlas.</p>

      <div class="edu-highlight warn">
        <strong>⚠️ Limitación:</strong> Las medias móviles son indicadores rezagados (lagging). Confirman tendencias que ya ocurrieron, no predicen el futuro. Úsalas para confirmar, no para anticipar.
      </div>
    `
  },
  rsi: {
    title: '⚡ RSI — Índice de Fuerza Relativa',
    content: `
      <h3><i class="fas fa-tachometer-alt"></i> ¿Qué es el RSI?</h3>
      <p>El RSI (Relative Strength Index) es un oscilador que mide la <strong>velocidad y magnitud de los cambios de precio</strong> en una escala de 0 a 100. Fue creado por J. Welles Wilder en 1978 y es uno de los indicadores técnicos más utilizados en el mundo.</p>

      <h3><i class="fas fa-ruler-horizontal"></i> Lectura del RSI</h3>
      <ul>
        <li><strong style="color:var(--negative)">RSI > 70: Sobrecompra</strong> — La acción ha subido muy rápido. Puede estar cara. Posible corrección a la vista.</li>
        <li><strong style="color:var(--positive)">RSI < 30: Sobreventa</strong> — La acción ha bajado mucho. Puede estar barata. Posible rebote.</li>
        <li><strong style="color:var(--warning)">RSI entre 30 y 70:</strong> Zona neutral. Sin señal clara.</li>
        <li><strong>RSI = 50:</strong> Equilibrio entre compradores y vendedores.</li>
      </ul>

      <div class="edu-highlight tip">
        <strong>💡 Uso práctico:</strong> Cuando el RSI supera 70, considera reducir posición o no comprar. Cuando baja de 30, puede ser una oportunidad de compra (pero confirma con otros indicadores).
      </div>

      <h3><i class="fas fa-bezier-curve"></i> Divergencias del RSI</h3>
      <p>Una de las señales más poderosas del RSI son las <strong>divergencias</strong>:</p>
      <ul>
        <li><strong>Divergencia bajista:</strong> El precio hace un nuevo máximo pero el RSI hace un máximo más bajo. Señal de debilidad.</li>
        <li><strong>Divergencia alcista:</strong> El precio hace un nuevo mínimo pero el RSI hace un mínimo más alto. Señal de fortaleza oculta.</li>
      </ul>

      <div class="edu-highlight">
        <strong>📖 Ejemplo:</strong> Si Tesla (TSLA) llega a $300 y el RSI está en 78 (sobrecompra), es posible que la acción corrija en los próximos días, incluso si la noticia del día fue positiva.
      </div>

      <div class="edu-highlight warn">
        <strong>⚠️ Cuidado:</strong> En tendencias muy fuertes, el RSI puede permanecer en sobrecompra (>70) durante semanas. No vendas solo por el RSI en una tendencia alcista fuerte.
      </div>
    `
  },
  macd: {
    title: '🔄 MACD — Convergencia/Divergencia de Medias',
    content: `
      <h3><i class="fas fa-sliders-h"></i> ¿Qué es el MACD?</h3>
      <p>El MACD (Moving Average Convergence Divergence) es un indicador de tendencia y momentum que muestra la <strong>relación entre dos medias móviles exponenciales</strong> del precio. Fue desarrollado por Gerald Appel en 1979.</p>

      <h3><i class="fas fa-layer-group"></i> Componentes del MACD</h3>
      <ul>
        <li><strong>Línea MACD (azul):</strong> Diferencia entre la EMA12 y la EMA26 (medias exponenciales de 12 y 26 días).</li>
        <li><strong>Línea de Señal (naranja):</strong> Media móvil exponencial de 9 días de la línea MACD.</li>
        <li><strong>Histograma:</strong> Diferencia entre la línea MACD y la línea de señal. Barras verdes = MACD > señal. Barras rojas = MACD < señal.</li>
      </ul>

      <h3><i class="fas fa-exchange-alt"></i> Señales de trading</h3>
      <ul>
        <li><strong>Cruce alcista:</strong> La línea MACD cruza por encima de la señal. Señal de compra.</li>
        <li><strong>Cruce bajista:</strong> La línea MACD cruza por debajo de la señal. Señal de venta.</li>
        <li><strong>Cruce con la línea cero:</strong> Si el MACD cruza de negativo a positivo, confirma tendencia alcista.</li>
        <li><strong>Histograma verde y creciendo:</strong> Momentum alcista aumentando.</li>
        <li><strong>Histograma rojo y creciendo:</strong> Momentum bajista aumentando.</li>
      </ul>

      <div class="edu-highlight tip">
        <strong>💡 Estrategia clásica:</strong> Compra cuando el MACD cruza por encima de la línea de señal Y el cruce ocurre por debajo de la línea cero (zona de sobreventa). Esto combina momentum y valor.
      </div>

      <div class="edu-highlight warn">
        <strong>⚠️ Limitación:</strong> El MACD es un indicador rezagado. En mercados laterales (sin tendencia) genera muchas señales falsas. Funciona mejor en mercados con tendencia clara.
      </div>
    `
  },
  watchlist: {
    title: '⭐ Lista de Seguimiento (Watchlist)',
    content: `
      <h3><i class="fas fa-star"></i> ¿Qué es una Lista de Seguimiento?</h3>
      <p>Una lista de seguimiento (watchlist) es tu <strong>radar personal del mercado</strong>. Es una lista de acciones que has seleccionado para monitorear regularmente, aunque no las hayas comprado todavía.</p>

      <h3><i class="fas fa-tasks"></i> Para qué sirve</h3>
      <ul>
        <li><strong>Seguir el rendimiento</strong> de acciones que te interesan sin necesidad de buscarlas cada vez.</li>
        <li><strong>Identificar oportunidades:</strong> Cuando una acción de tu lista llega a un precio atractivo.</li>
        <li><strong>Comparar comportamientos:</strong> Ver qué sectores suben o bajan en el mismo día.</li>
        <li><strong>Preparar decisiones</strong> antes de invertir, estudiando la acción durante días o semanas.</li>
      </ul>

      <h3><i class="fas fa-info-circle"></i> Datos que ves en cada fila</h3>
      <ul>
        <li><strong>Símbolo (ticker):</strong> Código corto de la empresa (ej: AAPL = Apple, TSLA = Tesla).</li>
        <li><strong>Precio actual:</strong> El último precio al que se negoció la acción.</li>
        <li><strong>Cambio (% y $):</strong> Cuánto subió o bajó respecto al cierre del día anterior.</li>
        <li><strong style="color:var(--positive)">Verde:</strong> La acción está subiendo hoy.</li>
        <li><strong style="color:var(--negative)">Rojo:</strong> La acción está bajando hoy.</li>
      </ul>

      <div class="edu-highlight tip">
        <strong>💡 Consejo:</strong> Empieza con 5-10 empresas que conozcas bien como consumidor (Apple, Amazon, Coca-Cola, etc.). Es más fácil entender el negocio y seguir sus noticias.
      </div>

      <h3><i class="fas fa-chart-line"></i> Estadísticas importantes</h3>
      <ul>
        <li><strong>P/E (Price/Earnings):</strong> Cuánto pagas por cada dólar de ganancia. Menor = más barato (relativo).</li>
        <li><strong>Capitalización bursátil:</strong> Valor total de la empresa en el mercado.</li>
        <li><strong>Dividendo:</strong> Pago periódico a accionistas. Ideal para inversión a largo plazo.</li>
        <li><strong>Beta:</strong> Volatilidad relativa al mercado. Beta > 1 = más volátil que el mercado.</li>
      </ul>

      <div class="edu-highlight">
        <strong>📖 Diferencia entre seguir y comprar:</strong> Puedes seguir una acción en tu watchlist durante meses antes de comprar. Observar su comportamiento te ayuda a entender cuándo es un buen momento para entrar.
      </div>
    `
  },
  signal: {
    title: '🎯 Señal General de Trading',
    content: `
      <h3><i class="fas fa-traffic-light"></i> ¿Qué es la Señal General?</h3>
      <p>La señal general es un <strong>resumen automatizado</strong> que combina múltiples indicadores técnicos para darte una orientación sobre el sentimiento actual del mercado para esa acción: si los indicadores apuntan a compra, venta, o neutralidad.</p>

      <div class="edu-highlight warn">
        <strong>⚠️ Advertencia importante:</strong> La señal general es una herramienta educativa y orientativa, NO es asesoramiento financiero. Las señales técnicas pueden fallar. Siempre investiga por tu cuenta y, si es posible, consulta a un asesor financiero certificado.
      </div>

      <h3><i class="fas fa-calculator"></i> Cómo se calcula</h3>
      <p>La señal combina:</p>
      <ul>
        <li><strong>Posición vs Medias Móviles:</strong> ¿Está el precio por encima o por debajo de las MM20, MM50 y MM200?</li>
        <li><strong>RSI:</strong> ¿Está el RSI en zona de compra (< 50) o venta (> 50)?</li>
        <li><strong>MACD:</strong> ¿La línea MACD está por encima o por debajo de la señal?</li>
        <li><strong>Volumen:</strong> ¿Confirma el volumen el movimiento del precio?</li>
      </ul>

      <h3><i class="fas fa-bar-chart"></i> Interpretación</h3>
      <ul>
        <li><strong style="color:var(--positive)">COMPRA fuerte (75-100%):</strong> La mayoría de indicadores apuntan al alza. Momento positivo.</li>
        <li><strong style="color:var(--positive)">COMPRA (55-75%):</strong> Más indicadores alcistas que bajistas.</li>
        <li><strong style="color:var(--text-secondary)">NEUTRAL (45-55%):</strong> Sin dirección clara. Esperar.</li>
        <li><strong style="color:var(--negative)">VENTA (25-45%):</strong> Más indicadores bajistas que alcistas.</li>
        <li><strong style="color:var(--negative)">VENTA fuerte (0-25%):</strong> La mayoría de indicadores apuntan a la baja.</li>
      </ul>

      <div class="edu-highlight tip">
        <strong>💡 Para principiantes:</strong> Nunca tomes una decisión de inversión basándote solo en la señal técnica. Combínala siempre con análisis fundamental (¿es buena empresa?), noticias recientes y tu horizonte temporal de inversión.
      </div>
    `
  }
};

const LESSON_ORDER = ['candles', 'volume', 'ma', 'rsi', 'macd', 'watchlist', 'signal'];
