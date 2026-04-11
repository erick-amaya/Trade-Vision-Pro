# 📈 TradeVision Pro — Panel Bursátil para Principiantes

Una plataforma de análisis bursátil profesional e interactiva, diseñada especialmente para personas que están comenzando en el mundo de las inversiones. Combina herramientas de análisis técnico avanzado con explicaciones claras y didácticas.

---

## ✅ Funcionalidades Implementadas

### Gráficos y Análisis Técnico
- **Velas Japonesas** con datos OHLCV (Open/High/Low/Close/Volume) precargados
- **Gráfico de Línea** y **Área** como tipos alternativos de visualización
- **Barras de Volumen** sincronizadas con el gráfico principal (verde/rojo)
- **Medias Móviles** MM20 (amarilla), MM50 (azul), MM200 (naranja) — activables/desactivables
- **Bandas de Bollinger** como indicador adicional
- **RSI (Índice de Fuerza Relativa)** con barra visual y zonas de sobrecompra/sobreventa
- **MACD** con histograma, línea de señal y línea MACD
- **Señal General** compuesta por múltiples indicadores con medidores visuales

### Selección de Períodos
- 1 Día, 1 Semana, 1 Mes, 3 Meses, 1 Año

### Lista de Seguimiento (Watchlist)
- **10 acciones precargadas**: AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, JPM, JNJ, KO
- Filtro/búsqueda en tiempo real por símbolo o nombre
- Precios con cambio porcentual y de valor
- Indicador de acción seleccionada actualmente
- **Resumen de portafolio** simulado con valor total, ganancia/pérdida y rendimiento

### Estadísticas de la Empresa
- Capitalización bursátil, P/E Ratio, EPS
- Dividendo anual, Máximo/Mínimo 52 semanas
- Volumen del día, Beta (volatilidad)

### Noticias Contextuales
- Noticias temáticas por empresa con indicador de sentimiento (Alcista/Bajista/Neutral)

### Panel Educativo (Modo Aprendizaje)
- **6 lecciones completas** en español:
  1. Velas Japonesas (con diagrama SVG interactivo)
  2. Volumen de Negociación
  3. Medias Móviles (MM20/50/200)
  4. RSI — Índice de Fuerza Relativa
  5. MACD — Convergencia/Divergencia
  6. Lista de Seguimiento y cómo usarla
  7. Señal General de Trading
- Navegación entre lecciones con flechas del teclado
- **Zona de Aprendizaje** siempre visible en la parte inferior (colapsable)
- **Botones de ayuda** en cada indicador para abrir lección relacionada

### Experiencia de Usuario
- **Ticker Tape** animado con todos los símbolos
- **Simulación de precios en tiempo real** (actualización cada 3 segundos)
- **Tema oscuro/claro** intercambiable
- **Reloj de mercado** en tiempo real
- Diseño responsive (adaptable a pantallas pequeñas)
- Atajos de teclado: `Esc` para cerrar lección, `←/→` para navegar

---

## 📁 Estructura de Archivos

```
index.html          — Estructura principal (HTML5 semántico)
css/
  style.css         — Estilos completos (tema oscuro + claro, responsive)
js/
  data.js           — Datos precargados, generadores de velas, lecciones educativas
  app.js            — Lógica de la aplicación, gráficos, indicadores, interactividad
README.md           — Este archivo
```

---

## 🛠️ Tecnologías Usadas

| Tecnología | Uso |
|---|---|
| **HTML5 / CSS3 / JS ES6+** | Base del sitio |
| **Lightweight Charts (TradingView)** | Gráficos de velas, volumen y líneas |
| **Font Awesome 6** | Iconografía |
| **Google Fonts (Inter + JetBrains Mono)** | Tipografía profesional |

---

## 📊 Datos de Ejemplo

Los datos son **generados proceduralmente** usando un modelo de movimiento browniano geométrico (GBM) que simula el comportamiento realista de los precios de acciones con:
- 365 días de historial por acción
- Volatilidad ajustada por sector
- Tendencia ligeramente alcista (0.04% diario)
- Volumen variable entre 5M y 85M por sesión

---

## 🚀 Próximas Mejoras Sugeridas

- [ ] Integrar API real de cotizaciones (Alpha Vantage, Yahoo Finance, Polygon.io)
- [ ] Añadir más indicadores: Estocástico, ATR, Ichimoku
- [ ] Panel de opciones/derivados
- [ ] Alertas de precio configurables por el usuario
- [ ] Exportar datos del portafolio a CSV
- [ ] Modo de práctica/paper trading simulado
- [ ] Comparación de múltiples acciones en el mismo gráfico
- [ ] Screener de acciones por criterios fundamentales

---

## 🎓 Para el Usuario Principiante

Esta plataforma está diseñada para aprender análisis técnico de forma progresiva:

1. **Empieza** por explorar la Zona de Aprendizaje (parte inferior)
2. **Haz clic** en los íconos `?` junto a cada indicador para aprender qué significa
3. **Activa/desactiva** las medias móviles para ver cómo cambia el gráfico
4. **Cambia el período** de tiempo para ver tendencias de corto y largo plazo
5. **Observa** cómo el volumen confirma o contradice los movimientos de precio

> ⚠️ **Aviso legal**: Esta plataforma es únicamente educativa. Los datos son ficticios y no constituyen asesoramiento financiero. Siempre consulta a un profesional antes de invertir.
