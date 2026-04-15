/**
 * TradeVision Pro v3 – data.js
 * Datos de mercado simulados para 10 acciones.
 * Genera series de velas japonesas (OHLCV) de forma determinista.
 */

'use strict';

/* ─── Catálogo de acciones ─────────────────────────────────────────── */
const STOCKS = [
  { symbol: 'AAPL',  name: 'Apple Inc.',        price: 189.30,  sector: 'Tecnología'   },
  { symbol: 'MSFT',  name: 'Microsoft Corp.',    price: 378.85,  sector: 'Tecnología'   },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',      price: 141.20,  sector: 'Tecnología'   },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',    price: 194.73,  sector: 'Consumo'      },
  { symbol: 'NVDA',  name: 'NVIDIA Corp.',       price: 487.60,  sector: 'Tecnología'   },
  { symbol: 'META',  name: 'Meta Platforms',     price: 498.15,  sector: 'Tecnología'   },
  { symbol: 'TSLA',  name: 'Tesla Inc.',         price: 182.40,  sector: 'Automotriz'   },
  { symbol: 'JPM',   name: 'JPMorgan Chase',     price: 197.50,  sector: 'Finanzas'     },
  { symbol: 'JNJ',   name: 'Johnson & Johnson',  price: 152.80,  sector: 'Salud'        },
  { symbol: 'KO',    name: 'Coca-Cola Co.',      price: 62.45,   sector: 'Consumo'      }
];

/* ─── Generador de velas determinista ─────────────────────────────── */
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateCandles(basePrice, count, seedOffset = 0) {
  const rng   = seededRandom(Math.floor(basePrice * 100) + seedOffset);
  const candles = [];
  const now   = Date.now();
  let price   = basePrice;

  for (let i = count; i >= 0; i--) {
    const drift   = (rng() - 0.488) * price * 0.025;
    const open    = price;
    const close   = Math.max(1, open + drift);
    const spread  = Math.abs(drift) + rng() * price * 0.01;
    const high    = Math.max(open, close) + spread * rng();
    const low     = Math.min(open, close) - spread * rng();
    const volume  = Math.floor(1_000_000 + rng() * 9_000_000);
    const ts      = now - i * 24 * 60 * 60 * 1000;

    candles.push({ ts, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

/* ─── Construir dataset completo ───────────────────────────────────── */
const MARKET_DATA = {};

STOCKS.forEach(stock => {
  MARKET_DATA[stock.symbol] = {
    ...stock,
    candles: generateCandles(stock.price, 365)
  };
});

/* ─── Helpers de indicadores técnicos ─────────────────────────────── */
function calcSMA(closes, period) {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function calcEMA(closes, period) {
  const k = 2 / (period + 1);
  const ema = [];
  closes.forEach((c, i) => {
    if (i === 0) { ema.push(c); return; }
    ema.push(c * k + ema[i - 1] * (1 - k));
  });
  return ema;
}

function calcBB(closes, period = 20, mult = 2) {
  const sma = calcSMA(closes, period);
  return sma.map((mid, i) => {
    if (mid === null) return { upper: null, mid: null, lower: null };
    const slice = closes.slice(i - period + 1, i + 1);
    const variance = slice.reduce((a, b) => a + Math.pow(b - mid, 2), 0) / period;
    const std = Math.sqrt(variance);
    return { upper: mid + mult * std, mid, lower: mid - mult * std };
  });
}

function calcRSI(closes, period = 14) {
  const rsi = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) { rsi.push(null); continue; }
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const rs = losses === 0 ? 100 : gains / losses;
    rsi.push(100 - 100 / (1 + rs));
  }
  return rsi;
}

function calcMACD(closes) {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine   = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine, 9);
  const histogram  = macdLine.map((v, i) => v - signalLine[i]);
  return { macdLine, signalLine, histogram };
}

/* ─── Función principal: getChartData ─────────────────────────────── */
function getChartData(symbol, period) {
  const stock = MARKET_DATA[symbol];
  if (!stock) return null;

  const allCandles = stock.candles;
  const periodMap  = { '1D': 1, '1S': 7, '1M': 30, '3M': 90, '1A': 365 };
  const days       = periodMap[period] || 30;
  const candles    = allCandles.slice(-days);

  const closes  = candles.map(c => c.close);
  const ma20    = calcSMA(closes, 20);
  const ma50    = calcSMA(closes, 50);
  const ma200   = calcSMA(closes, 200);
  const bb      = calcBB(closes, 20);
  const rsi     = calcRSI(closes);
  const macd    = calcMACD(closes);

  return { symbol, candles, ma20, ma50, ma200, bb, rsi, macd };
}

/* ─── Simular actualización de precio en tiempo real ─────────────── */
function simulatePriceTick(symbol) {
  const stock  = MARKET_DATA[symbol];
  const last   = stock.candles[stock.candles.length - 1];
  const change = (Math.random() - 0.497) * last.close * 0.003;
  const newClose = Math.max(1, last.close + change);
  stock.candles[stock.candles.length - 1] = {
    ...last,
    close: newClose,
    high:  Math.max(last.high, newClose),
    low:   Math.min(last.low,  newClose),
    volume: last.volume + Math.floor(Math.random() * 10000)
  };
  return stock.candles[stock.candles.length - 1];
}

/* ─── Lecciones de la Academia ─────────────────────────────────────── */
const ACADEMY_LESSONS = [
  {
    title: '📊 Velas Japonesas',
    icon: 'fa-chart-candlestick',
    body: `<p>Las <strong>velas japonesas</strong> son la forma más popular de visualizar el precio. Cada vela resume 4 datos: <em>Apertura (A), Máximo (Mx), Mínimo (Mn) y Cierre (C)</em>.</p>
    <ul>
      <li>🟢 <strong>Vela verde</strong>: el precio cerró <em>más alto</em> que como abrió → señal alcista</li>
      <li>🔴 <strong>Vela roja</strong>: el precio cerró <em>más bajo</em> que como abrió → señal bajista</li>
      <li>El "cuerpo" es la diferencia entre apertura y cierre</li>
      <li>Las "mechas" muestran el rango completo del día</li>
    </ul>
    <p><em>Ejemplo: Una vela verde grande con mechas cortas indica compradores fuertes sin mucha resistencia.</em></p>`
  },
  {
    title: '📉 Volumen',
    icon: 'fa-chart-bar',
    body: `<p>El <strong>volumen</strong> es la cantidad de acciones que se negociaron en un período.</p>
    <ul>
      <li>📈 <strong>Precio sube + Volumen alto</strong>: movimiento fuerte y confiable</li>
      <li>📈 <strong>Precio sube + Volumen bajo</strong>: movimiento débil, posible trampa</li>
      <li>📉 <strong>Precio cae + Volumen alto</strong>: venta masiva, señal bajista fuerte</li>
    </ul>
    <p>El volumen <strong>confirma</strong> o <strong>niega</strong> los movimientos de precio. Siempre míralo junto a las velas.</p>`
  },
  {
    title: '📈 Medias Móviles (MA)',
    icon: 'fa-wave-square',
    body: `<p>Una <strong>media móvil</strong> suaviza el precio promediando los últimos N días, eliminando el "ruido" diario.</p>
    <ul>
      <li><span style="color:#f6c90e">█</span> <strong>MA 20</strong>: tendencia corto plazo (1 mes)</li>
      <li><span style="color:#00bcd4">█</span> <strong>MA 50</strong>: tendencia medio plazo (2.5 meses)</li>
      <li><span style="color:#ff9800">█</span> <strong>MA 200</strong>: tendencia largo plazo (1 año)</li>
    </ul>
    <p><strong>Regla básica:</strong> Si el precio está <em>por encima</em> de la media, la tendencia es alcista. Si está <em>por debajo</em>, es bajista.</p>
    <p>Una <strong>Golden Cross</strong> (MA20 cruza MA50 hacia arriba) es señal de compra. Un <strong>Death Cross</strong> es señal de venta.</p>`
  },
  {
    title: '🎯 RSI – Índice de Fuerza Relativa',
    icon: 'fa-tachometer-alt',
    body: `<p>El <strong>RSI</strong> mide la velocidad y magnitud de los cambios de precio. Va de 0 a 100.</p>
    <ul>
      <li>🔴 <strong>RSI > 70</strong>: "Sobrecomprado" → puede venir una corrección a la baja</li>
      <li>🟢 <strong>RSI < 30</strong>: "Sobrevendido" → puede venir un rebote al alza</li>
      <li>⚪ <strong>RSI entre 40-60</strong>: zona neutral, sin señal clara</li>
    </ul>
    <p><em>El RSI funciona mejor en mercados laterales. En tendencias fuertes puede mantenerse en zona extrema por mucho tiempo.</em></p>`
  },
  {
    title: '⚡ MACD',
    icon: 'fa-chart-line',
    body: `<p>El <strong>MACD</strong> (Moving Average Convergence Divergence) mide la diferencia entre dos medias móviles exponenciales (EMA12 - EMA26).</p>
    <ul>
      <li>🟢 <strong>MACD cruza Signal hacia arriba</strong>: señal de compra</li>
      <li>🔴 <strong>MACD cruza Signal hacia abajo</strong>: señal de venta</li>
      <li>Las barras del histograma muestran la fuerza del movimiento</li>
    </ul>
    <p>Funciona mejor con otros indicadores. No usar solo el MACD para tomar decisiones.</p>`
  },
  {
    title: '📋 Watchlist',
    icon: 'fa-star',
    body: `<p>La <strong>lista de seguimiento</strong> (watchlist) te permite monitorear varios activos al mismo tiempo.</p>
    <ul>
      <li>Haz clic en cualquier símbolo para ver su gráfico detallado</li>
      <li>Compara qué activos están subiendo y cuáles están bajando</li>
      <li>Identifica los más fuertes o más débiles del sector</li>
    </ul>
    <p>Los traders profesionales siguen muchos activos simultáneamente para encontrar las mejores oportunidades.</p>`
  },
  {
    title: '🛡️ Gestión de Riesgo',
    icon: 'fa-shield-alt',
    body: `<p>La <strong>gestión de riesgo</strong> es lo más importante para sobrevivir en los mercados.</p>
    <ul>
      <li>🛑 <strong>Stop Loss</strong>: Límite de pérdida máxima. Sal de la operación si el precio va en tu contra.</li>
      <li>🎯 <strong>Take Profit</strong>: Objetivo de ganancia. Asegura beneficios cuando el precio llega a tu meta.</li>
      <li>💰 <strong>Regla del 2%</strong>: Nunca arriesgues más del 2% de tu capital en una sola operación.</li>
      <li>📊 <strong>Relación Riesgo/Beneficio</strong>: Busca operaciones donde ganes al menos el doble de lo que arriesgas (1:2 mínimo).</li>
    </ul>`
  },
  {
    title: '🧠 Psicología del Trading',
    icon: 'fa-brain',
    body: `<p>Los <strong>errores emocionales</strong> son la causa número uno de pérdidas en el trading.</p>
    <ul>
      <li>😰 <strong>FOMO</strong> (Fear of Missing Out): No entres tarde por miedo a perderte la subida.</li>
      <li>😤 <strong>Revenge Trading</strong>: Nunca operes para recuperar pérdidas de forma impulsiva.</li>
      <li>🤑 <strong>Codicia</strong>: Cumple tu plan. Si llegó a tu Take Profit, sal.</li>
      <li>😨 <strong>Miedo</strong>: Si pusiste un Stop Loss razonado, confía en él.</li>
    </ul>
    <p><em>Un buen trader sigue su plan. Un mal trader sigue sus emociones.</em></p>`
  }
];

/* ─── Tips para modales de ayuda ───────────────────────────────────── */
const TIPS = {
  market: {
    title: 'Orden Market (Mercado)',
    body:  'Se ejecuta inmediatamente al precio disponible en el mercado. Es la más simple y rápida. Ideal para principiantes. El precio exacto de ejecución puede diferir ligeramente del precio mostrado (slippage).'
  },
  limit: {
    title: 'Orden Limit (Límite)',
    body:  'Se ejecuta solo si el precio alcanza tu nivel especificado. Puedes comprar más barato o vender más caro que el precio actual, pero no hay garantía de que se ejecute si el precio no llega.'
  },
  sl: {
    title: 'Stop Loss – Parar Pérdidas',
    body:  'Es una orden automática que cierra tu posición si el precio va en tu contra más allá de un límite que tú defines. Es tu principal herramienta de protección. SIEMPRE usa Stop Loss al operar.'
  },
  tp: {
    title: 'Take Profit – Tomar Ganancia',
    body:  'Es una orden automática que cierra tu posición cuando el precio alcanza tu objetivo de ganancia. Así aseguras los beneficios sin necesidad de estar pendiente del mercado.'
  }
};
