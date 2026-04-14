// =============================================================================
// DATA.JS — Datos de mercado precargados para TradeVision Pro
// =============================================================================

const STOCKS = {
    AAPL: {
        name: "Apple Inc.",
        sector: "Tecnología",
        marketCap: "2.85T",
        description: "Apple diseña y vende iPhone, Mac, iPad y servicios digitales. Es la empresa más valiosa del mundo.",
        news: [
            { headline: "Apple supera expectativas en ventas de iPhone", sentiment: "positive", time: "Hace 2h" },
            { headline: "Nuevo lanzamiento de Vision Pro genera expectativa", sentiment: "positive", time: "Hace 5h" },
            { headline: "Analistas prevén crecimiento en servicios de App Store", sentiment: "neutral", time: "Hace 1d" }
        ]
    },
    MSFT: {
        name: "Microsoft Corp.",
        sector: "Tecnología",
        marketCap: "3.10T",
        description: "Microsoft crea Windows, Office y Azure. Es líder en nube empresarial e inteligencia artificial.",
        news: [
            { headline: "Azure crece un 28% en el último trimestre", sentiment: "positive", time: "Hace 1h" },
            { headline: "Copilot AI integrado en más productos Office", sentiment: "positive", time: "Hace 3h" },
            { headline: "Microsoft invierte $10B más en OpenAI", sentiment: "neutral", time: "Hace 1d" }
        ]
    },
    GOOGL: {
        name: "Alphabet Inc.",
        sector: "Tecnología",
        marketCap: "2.10T",
        description: "Alphabet es la empresa madre de Google. Sus ingresos provienen principalmente de publicidad digital.",
        news: [
            { headline: "Google Search sigue dominando con 91% del mercado", sentiment: "positive", time: "Hace 4h" },
            { headline: "Gemini AI supera a competidores en benchmarks", sentiment: "positive", time: "Hace 6h" },
            { headline: "Reguladores europeos investigan prácticas de anuncios", sentiment: "negative", time: "Hace 2d" }
        ]
    },
    AMZN: {
        name: "Amazon.com Inc.",
        sector: "Consumo / Tech",
        marketCap: "1.90T",
        description: "Amazon es el mayor retailer online del mundo y su nube AWS es líder del mercado cloud.",
        news: [
            { headline: "AWS registra máximos históricos de ingresos", sentiment: "positive", time: "Hace 3h" },
            { headline: "Prime Day bate récord de ventas global", sentiment: "positive", time: "Hace 8h" },
            { headline: "Amazon abre más centros logísticos en Latinoamérica", sentiment: "neutral", time: "Hace 1d" }
        ]
    },
    NVDA: {
        name: "NVIDIA Corp.",
        sector: "Semiconductores",
        marketCap: "2.40T",
        description: "NVIDIA fabrica las GPUs más potentes del mundo, usadas en IA, videojuegos y centros de datos.",
        news: [
            { headline: "NVDA sube 8% tras resultados récord en chips IA", sentiment: "positive", time: "Hace 1h" },
            { headline: "Blackwell GPU supera a H100 en rendimiento", sentiment: "positive", time: "Hace 5h" },
            { headline: "Demanda de data centers supera capacidad de producción", sentiment: "positive", time: "Hace 1d" }
        ]
    },
    META: {
        name: "Meta Platforms",
        sector: "Redes Sociales",
        marketCap: "1.35T",
        description: "Meta opera Facebook, Instagram y WhatsApp, con más de 3 mil millones de usuarios activos.",
        news: [
            { headline: "Ingresos publicitarios de Meta crecen 25% YoY", sentiment: "positive", time: "Hace 2h" },
            { headline: "Meta AI llega a todos los productos de la empresa", sentiment: "positive", time: "Hace 6h" },
            { headline: "Costos del metaverso siguen siendo un reto", sentiment: "negative", time: "Hace 2d" }
        ]
    },
    TSLA: {
        name: "Tesla Inc.",
        sector: "Automotriz / EV",
        marketCap: "750B",
        description: "Tesla fabrica vehículos eléctricos y sistemas de energía. Es pionera en conducción autónoma.",
        news: [
            { headline: "Tesla entrega un millón de vehículos en el trimestre", sentiment: "positive", time: "Hace 3h" },
            { headline: "Cybertruck inicia entregas masivas en Europa", sentiment: "positive", time: "Hace 7h" },
            { headline: "Elon Musk vende acciones por valor de $2B", sentiment: "negative", time: "Hace 1d" }
        ]
    },
    JPM: {
        name: "JPMorgan Chase",
        sector: "Banca",
        marketCap: "560B",
        description: "JPMorgan es el banco más grande de EE.UU. con servicios de banca comercial, inversión y gestión de activos.",
        news: [
            { headline: "JPM reporta ganancias récord en banca de inversión", sentiment: "positive", time: "Hace 4h" },
            { headline: "Jamie Dimon alerta sobre riesgos de inflación persistente", sentiment: "negative", time: "Hace 8h" },
            { headline: "JPM expande operaciones en mercados emergentes", sentiment: "neutral", time: "Hace 2d" }
        ]
    },
    JNJ: {
        name: "Johnson & Johnson",
        sector: "Salud",
        marketCap: "430B",
        description: "J&J es líder farmacéutico y de dispositivos médicos con más de 135 años de historia.",
        news: [
            { headline: "J&J obtiene aprobación FDA para nuevo tratamiento oncológico", sentiment: "positive", time: "Hace 5h" },
            { headline: "Ventas de dispositivos médicos superan estimaciones", sentiment: "positive", time: "Hace 9h" },
            { headline: "J&J llega a acuerdo de $700M en litigios de talco", sentiment: "neutral", time: "Hace 3d" }
        ]
    },
    KO: {
        name: "The Coca-Cola Co.",
        sector: "Consumo Básico",
        marketCap: "265B",
        description: "Coca-Cola es la marca de bebidas más reconocida del mundo con presencia en más de 200 países.",
        news: [
            { headline: "Coca-Cola eleva guía de ingresos anuales", sentiment: "positive", time: "Hace 6h" },
            { headline: "KO pagará dividendo trimestral de $0.485", sentiment: "positive", time: "Hace 1d" },
            { headline: "Ventas en mercados emergentes de Asia impulsan crecimiento", sentiment: "neutral", time: "Hace 2d" }
        ]
    }
};

// Precios base por activo
const BASE_PRICES = {
    AAPL: 175.50, MSFT: 378.20, GOOGL: 141.80, AMZN: 186.40,
    NVDA: 482.30, META: 487.60, TSLA: 248.50, JPM: 197.80,
    JNJ: 158.90, KO: 62.40
};

// Genera datos OHLCV para un período dado
function generateOHLCV(symbol, periods, intervalMinutes = 30) {
    const basePrice = BASE_PRICES[symbol];
    const data = [];
    const now = new Date();
    now.setMinutes(0, 0, 0);

    let price = basePrice * (0.85 + Math.random() * 0.15);
    const volatility = symbol === 'TSLA' ? 0.025 : symbol === 'NVDA' ? 0.022 :
                       symbol === 'MSFT' ? 0.012 : 0.015;

    for (let i = periods; i >= 0; i--) {
        const date = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
        const trend = Math.sin(i / (periods * 0.3)) * 0.008;
        const change = (Math.random() - 0.48 + trend) * volatility * price;

        const open = price;
        price = Math.max(price + change, price * 0.5);
        const close = price;
        const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
        const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
        const baseVol = symbol === 'AAPL' ? 65000000 : symbol === 'TSLA' ? 85000000 : 30000000;
        const volume = Math.floor(baseVol * (0.4 + Math.random() * 1.2));

        data.push({ date, open, high, low, close, volume });
    }
    return data;
}

// Cache de datos por símbolo y timeframe
const MARKET_DATA = {};

function getMarketData(symbol, timeframe = '1D') {
    const key = `${symbol}_${timeframe}`;
    if (!MARKET_DATA[key]) {
        let periods, intervalMins;
        switch (timeframe) {
            case '1D': periods = 78;  intervalMins = 5;    break; // 5-min candles
            case '1W': periods = 105; intervalMins = 60;   break; // 1h candles
            case '1M': periods = 120; intervalMins = 240;  break; // 4h candles
            case '3M': periods = 90;  intervalMins = 1440; break; // daily
            case '1Y': periods = 252; intervalMins = 1440; break; // daily
            default:   periods = 78;  intervalMins = 5;
        }
        MARKET_DATA[key] = generateOHLCV(symbol, periods, intervalMins);
    }
    return MARKET_DATA[key];
}

// Precios actuales en tiempo real (simulados)
const currentPrices = { ...BASE_PRICES };
const priceChanges = {};
const priceChangePct = {};

Object.keys(BASE_PRICES).forEach(sym => {
    const prev = BASE_PRICES[sym] * (0.97 + Math.random() * 0.06);
    currentPrices[sym] = BASE_PRICES[sym];
    priceChanges[sym] = currentPrices[sym] - prev;
    priceChangePct[sym] = (priceChanges[sym] / prev) * 100;
});

// Simula actualizaciones de precio
function simulatePriceTick() {
    Object.keys(currentPrices).forEach(sym => {
        const vol = sym === 'TSLA' ? 0.003 : 0.0015;
        const change = (Math.random() - 0.499) * vol * currentPrices[sym];
        const prevPrice = currentPrices[sym];
        currentPrices[sym] = Math.max(currentPrices[sym] + change, BASE_PRICES[sym] * 0.5);
        const dayOpen = BASE_PRICES[sym] * 0.99;
        priceChanges[sym] = currentPrices[sym] - dayOpen;
        priceChangePct[sym] = (priceChanges[sym] / dayOpen) * 100;

        // Actualiza la última vela del día
        const dayData = getMarketData(sym, '1D');
        if (dayData.length > 0) {
            const lastCandle = dayData[dayData.length - 1];
            lastCandle.close = currentPrices[sym];
            lastCandle.high = Math.max(lastCandle.high, currentPrices[sym]);
            lastCandle.low = Math.min(lastCandle.low, currentPrices[sym]);
        }
    });
}

// Calcula medias móviles
function calcMA(data, period) {
    const result = new Array(data.length).fill(null);
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((s, d) => s + d.close, 0);
        result[i] = sum / period;
    }
    return result;
}

// Calcula Bandas de Bollinger
function calcBollinger(data, period = 20, multiplier = 2) {
    const ma = calcMA(data, period);
    const upper = new Array(data.length).fill(null);
    const lower = new Array(data.length).fill(null);

    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1).map(d => d.close);
        const mean = ma[i];
        const std = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period);
        upper[i] = mean + multiplier * std;
        lower[i] = mean - multiplier * std;
    }
    return { upper, lower, middle: ma };
}

// Calcula RSI
function calcRSI(data, period = 14) {
    const result = new Array(data.length).fill(null);
    let avgGain = 0, avgLoss = 0;

    for (let i = 1; i <= period; i++) {
        const change = data[i].close - data[i - 1].close;
        if (change > 0) avgGain += change; else avgLoss -= change;
    }
    avgGain /= period;
    avgLoss /= period;
    result[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

    for (let i = period + 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        result[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    }
    return result;
}

// Formatea número como moneda
function formatCurrency(val, decimals = 2) {
    return '$' + Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatVolume(vol) {
    if (vol >= 1e9) return (vol / 1e9).toFixed(1) + 'B';
    if (vol >= 1e6) return (vol / 1e6).toFixed(1) + 'M';
    if (vol >= 1e3) return (vol / 1e3).toFixed(1) + 'K';
    return vol.toString();
}

// Lecciones educativas
const LESSONS = [
    {
        id: "velas",
        title: "🕯️ Velas Japonesas",
        icon: "fas fa-chart-bar",
        summary: "Aprende a leer el lenguaje más universal de los gráficos bursátiles.",
        content: `
            <h2>🕯️ ¿Qué son las Velas Japonesas?</h2>
            <p>Una vela japonesa resume toda la actividad de precio en un período de tiempo en una sola figura visual.</p>
            <div class="lesson-visual">
                <div class="candle-demo">
                    <div class="candle-diagram bullish">
                        <div class="upper-wick"></div>
                        <div class="candle-body"></div>
                        <div class="lower-wick"></div>
                        <div class="candle-labels">
                            <span class="label-high">Máximo ↑</span>
                            <span class="label-open">Apertura</span>
                            <span class="label-close">Cierre</span>
                            <span class="label-low">Mínimo ↓</span>
                        </div>
                    </div>
                </div>
            </div>
            <h3>Partes de una vela:</h3>
            <ul>
                <li><strong>Cuerpo:</strong> Va del precio de apertura al de cierre. Verde = subió. Rojo = bajó.</li>
                <li><strong>Mecha superior:</strong> El precio más alto que alcanzó en ese período.</li>
                <li><strong>Mecha inferior:</strong> El precio más bajo que alcanzó en ese período.</li>
            </ul>
            <h3>Patrones básicos:</h3>
            <ul>
                <li><strong>Vela alcista larga (verde):</strong> Señal de que los compradores dominaron ese período.</li>
                <li><strong>Vela bajista larga (roja):</strong> Los vendedores tuvieron el control.</li>
                <li><strong>Doji (cuerpo muy pequeño):</strong> Indecisión en el mercado — compradores y vendedores empataron.</li>
            </ul>
            <div class="lesson-tip">💡 <strong>Consejo para principiantes:</strong> No necesitas memorizar todos los patrones. Primero aprende a distinguir si las velas recientes son más verdes o más rojas para tener una idea de la tendencia.</div>
        `
    },
    {
        id: "volumen",
        title: "📊 Volumen",
        icon: "fas fa-chart-column",
        summary: "El volumen te dice cuánta gente está participando. Es como el termómetro del mercado.",
        content: `
            <h2>📊 ¿Qué es el Volumen?</h2>
            <p>El <strong>volumen</strong> indica cuántas acciones se compraron y vendieron en un período. Confirma la fuerza de un movimiento de precio.</p>
            <h3>Regla de oro del volumen:</h3>
            <ul>
                <li><strong>Precio sube + volumen alto:</strong> Señal fuerte de alza. Muchos inversores quieren comprar.</li>
                <li><strong>Precio sube + volumen bajo:</strong> El alza puede ser débil o temporal.</li>
                <li><strong>Precio baja + volumen alto:</strong> Muchos están vendiendo — posible señal de caída seria.</li>
                <li><strong>Precio baja + volumen bajo:</strong> Pocos están vendiendo. La caída puede no continuar.</li>
            </ul>
            <div class="lesson-tip">💡 <strong>Consejo:</strong> Siempre mira el volumen cuando veas una vela muy grande. Si el volumen es alto, el movimiento es "real". Si es bajo, podría ser un falso movimiento.</div>
        `
    },
    {
        id: "medias",
        title: "📈 Medias Móviles",
        icon: "fas fa-wave-square",
        summary: "Las medias móviles suavizan el ruido y muestran la dirección real del mercado.",
        content: `
            <h2>📈 ¿Qué son las Medias Móviles?</h2>
            <p>Una media móvil (MM) calcula el precio promedio de los últimos N períodos y lo dibuja como una línea suave sobre el gráfico. Elimina el "ruido" y muestra la tendencia real.</p>
            <h3>Tipos principales:</h3>
            <ul>
                <li><strong>MM20 (amarilla):</strong> Promedio de los últimos 20 períodos. Muy sensible a cambios recientes. Usada para operaciones cortas.</li>
                <li><strong>MM50 (azul):</strong> Tendencia de mediano plazo. La más usada por traders.</li>
                <li><strong>MM200 (naranja):</strong> Tendencia de largo plazo. Si el precio está por encima = mercado alcista. Por debajo = bajista.</li>
            </ul>
            <h3>Golden Cross y Death Cross:</h3>
            <ul>
                <li><strong>Golden Cross 🌟:</strong> MM50 cruza hacia arriba la MM200 → señal alcista importante.</li>
                <li><strong>Death Cross 💀:</strong> MM50 cruza hacia abajo la MM200 → señal bajista importante.</li>
            </ul>
            <div class="lesson-tip">💡 <strong>Consejo simple:</strong> Si el precio está por encima de la MM200 y la MM50, generalmente es señal de que la tendencia es alcista (el mercado sube).</div>
        `
    },
    {
        id: "rsi",
        title: "⚡ RSI (Índice de Fuerza Relativa)",
        icon: "fas fa-tachometer-alt",
        summary: "El RSI te dice si una acción está 'cara' o 'barata' relativamente.",
        content: `
            <h2>⚡ RSI — Índice de Fuerza Relativa</h2>
            <p>El RSI mide qué tan rápido y fuerte se mueve el precio. Va de 0 a 100 y te ayuda a detectar si una acción está sobrecomprada o sobrevendida.</p>
            <h3>Zonas clave:</h3>
            <ul>
                <li><strong>RSI > 70 (sobrecomprado):</strong> La acción subió muy rápido y podría corregir hacia abajo pronto.</li>
                <li><strong>RSI entre 40-60 (zona neutra):</strong> El precio se mueve de forma normal.</li>
                <li><strong>RSI < 30 (sobrevendido):</strong> La acción bajó mucho y podría rebotar hacia arriba.</li>
            </ul>
            <div class="lesson-tip">💡 <strong>Consejo para principiantes:</strong> El RSI no garantiza nada, pero cuando está por debajo de 30, muchos traders lo ven como una oportunidad de compra. Por encima de 70, consideran tomar ganancias o vender.</div>
        `
    },
    {
        id: "senales",
        title: "🔔 Señales de Trading",
        icon: "fas fa-bell",
        summary: "Cómo combinar indicadores para tomar decisiones más informadas.",
        content: `
            <h2>🔔 Señales de Trading</h2>
            <p>Una <strong>señal de trading</strong> es una indicación basada en análisis técnico que sugiere comprar o vender. Nunca son garantía, pero ayudan a tomar decisiones más informadas.</p>
            <h3>Señales de COMPRA más comunes:</h3>
            <ul>
                <li>Precio cruza hacia arriba la MM50 o MM200</li>
                <li>RSI sale de zona sobrevendida (sube de 30)</li>
                <li>Golden Cross (MM50 cruza MM200 hacia arriba)</li>
                <li>Precio rompe resistencia con volumen alto</li>
            </ul>
            <h3>Señales de VENTA más comunes:</h3>
            <ul>
                <li>Precio cae por debajo de MM50 o MM200</li>
                <li>RSI sale de zona sobrecomprada (baja de 70)</li>
                <li>Death Cross (MM50 cruza MM200 hacia abajo)</li>
            </ul>
            <div class="lesson-tip">💡 <strong>Regla clave:</strong> Una sola señal no es suficiente. Lo ideal es que 2 o 3 indicadores apunten en la misma dirección antes de actuar.</div>
        `
    },
    {
        id: "stoploss",
        title: "🛑 Stop Loss",
        icon: "fas fa-shield-alt",
        summary: "Tu seguro contra pérdidas grandes. Aprende a proteger tu capital.",
        content: `
            <h2>🛑 Stop Loss — Tu Red de Seguridad</h2>
            <p>Un <strong>Stop Loss</strong> es una orden automática que vende tu posición si el precio cae a cierto nivel. Te protege de pérdidas mayores de las que puedes asumir.</p>
            <h3>Ejemplo práctico:</h3>
            <p>Compras AAPL a <strong>$175</strong>. Decides que lo máximo que puedes perder es el 5%. Pones stop loss en <strong>$166.25</strong>. Si cae a ese precio, se vende automáticamente.</p>
            <h3>¿Dónde poner el stop loss?</h3>
            <ul>
                <li>Para principiantes: entre 5% y 10% por debajo del precio de compra.</li>
                <li>Avanzado: justo por debajo de un soporte técnico clave.</li>
            </ul>
            <div class="lesson-tip">💡 <strong>Regla de oro:</strong> Nunca muevas el stop loss hacia abajo para "aguantar". El stop loss existe para protegerte, no para que sigas perdiendo.</div>
        `
    },
    {
        id: "takeprofit",
        title: "🎯 Take Profit",
        icon: "fas fa-bullseye",
        summary: "Define tu objetivo de ganancia y asegura tus ganancias automáticamente.",
        content: `
            <h2>🎯 Take Profit — Asegura tus Ganancias</h2>
            <p>Un <strong>Take Profit</strong> es una orden que vende automáticamente cuando el precio alcanza tu objetivo de ganancia. Evita que la avaricia te haga perder ganancias ya ganadas.</p>
            <h3>Ejemplo práctico:</h3>
            <p>Compras NVDA a <strong>$480</strong>. Esperas un alza del 10%. Pones take profit en <strong>$528</strong>. Cuando llegue ahí, se vende y aseguras la ganancia.</p>
            <h3>Relación Riesgo/Recompensa:</h3>
            <ul>
                <li>Para principiantes: el take profit debería ser al menos el doble del stop loss.</li>
                <li>Ejemplo: Stop Loss = 5% → Take Profit = 10% (ratio 1:2).</li>
            </ul>
            <div class="lesson-tip">💡 <strong>Consejo:</strong> Un ratio riesgo/recompensa de 1:2 significa que aunque pierdas más veces de las que ganas, podrías seguir siendo rentable.</div>
        `
    },
    {
        id: "watchlist",
        title: "👁️ Watchlist — Lista de Seguimiento",
        icon: "fas fa-eye",
        summary: "Cómo usar una watchlist para monitorear múltiples activos eficientemente.",
        content: `
            <h2>👁️ Watchlist — Lista de Seguimiento</h2>
            <p>Una <strong>watchlist</strong> es tu lista personal de activos que estás monitoreando. No necesitas tener acciones de todos; simplemente los sigues para encontrar oportunidades.</p>
            <h3>¿Cómo usarla?</h3>
            <ul>
                <li>Agrega los activos que te interesan y revísalos regularmente.</li>
                <li>Observa cuáles están subiendo o bajando más que el mercado general.</li>
                <li>Cuando veas una señal técnica en uno, investiga más antes de actuar.</li>
            </ul>
            <h3>Tips para principiantes:</h3>
            <ul>
                <li>Empieza con 5-10 acciones, no con 50. Menos es más.</li>
                <li>Prefiere empresas que conoces y entiendes.</li>
                <li>Diversifica sectores: tech, salud, consumo, financiero.</li>
            </ul>
            <div class="lesson-tip">💡 <strong>Consejo:</strong> Un error común de principiantes es tener demasiados activos en la watchlist. Es mejor conocer bien 5 empresas que seguir superficialmente 50.</div>
        `
    }
];
