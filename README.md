# 📈 TradeVision Pro v3

Panel de control bursátil educativo para principiantes en inversión.  
Incluye gráficos de velas japonesas interactivos, simulador de compra/venta y academia integrada.

---

## 🌐 Publicar en GitHub Pages (paso a paso)

### Paso 1 – Crear el repositorio

1. Ve a [github.com](https://github.com) e inicia sesión (o crea una cuenta gratuita).
2. Haz clic en **"New repository"** (botón verde, esquina superior derecha).
3. Llámalo: `tradevision-pro` (o el nombre que prefieras).
4. Déjalo como **Public**.
5. **No** marques "Add a README file" (ya viene incluido).
6. Haz clic en **"Create repository"**.

### Paso 2 – Subir los archivos

**Opción A – Desde el navegador (más fácil):**

1. En la página del repositorio recién creado, haz clic en **"uploading an existing file"**.
2. Arrastra y suelta todos los archivos del proyecto:
   ```
   index.html
   README.md
   css/style.css
   js/data.js
   js/chart.js
   js/simulator.js
   js/app.js
   ```
3. Escribe un mensaje de commit como: `"Subir TradeVision Pro v3"`.
4. Haz clic en **"Commit changes"**.

**Opción B – Con Git (terminal):**

```bash
# Clonar el repo vacío
git clone https://github.com/TU_USUARIO/tradevision-pro.git
cd tradevision-pro

# Copiar los archivos del proyecto a esta carpeta
# (index.html, README.md, css/, js/)

# Subir todo
git add .
git commit -m "TradeVision Pro v3 - Panel bursátil educativo"
git push origin main
```

### Paso 3 – Activar GitHub Pages

1. Ve a la pestaña **Settings** de tu repositorio.
2. En el menú lateral, haz clic en **Pages**.
3. En **"Branch"**, selecciona `main` y la carpeta `/ (root)`.
4. Haz clic en **Save**.
5. Espera ~60 segundos y tu app estará disponible en:

```
https://TU_USUARIO.github.io/tradevision-pro/
```

> 💡 GitHub Pages tarda 1-3 minutos la primera vez en activarse.

---

## 📁 Estructura del Proyecto

```
tradevision-pro/
├── index.html          → Estructura principal HTML (5 pestañas)
├── README.md           → Este archivo
├── css/
│   └── style.css       → Estilos completos (tema oscuro + claro)
└── js/
    ├── data.js         → Datos de mercado simulados + indicadores técnicos
    ├── chart.js        → Motor de gráfico de velas con Canvas nativo
    ├── simulator.js    → Simulador de compra/venta + gestión de portafolio
    └── app.js          → Controlador principal + eventos + UI
```

---

## 🎯 Características Principales

### 📊 Panel de Gráfico
- **Velas japonesas** con colores verde/rojo (alcista/bajista)
- **Barras de volumen** sincronizadas y coloreadas
- **Medias móviles**: MA20, MA50, MA200 (activables individualmente)
- **Bandas de Bollinger** activables
- **Zoom interactivo**: rueda del mouse para acercar/alejar
- **Arrastre horizontal**: clic + drag para navegar en el tiempo
- **Crosshair + Tooltip**: al pasar el mouse ves OHLCV exacto
- **Pinch-to-zoom** en dispositivos táctiles
- Botones de zoom +/−/⊞

### 📋 Indicadores Técnicos
- RSI (14) con zonas de sobrecompra/sobreventa
- MACD con histograma
- Media Móvil 20 y 50 con señales
- Señal general: Alcista / Neutral / Bajista

### 🔄 Simulador de Órdenes
- **$100,000 USD virtuales** de capital inicial
- **Órdenes Market**: ejecución inmediata
- **Órdenes Limit**: ejecución diferida al precio objetivo
- **Stop Loss automático**: cierra si el precio baja demasiado
- **Take Profit automático**: cierra al alcanzar el objetivo
- Gestión de múltiples posiciones abiertas
- Cierre manual de posiciones desde la tabla

### 💼 Portafolio
- Valor total en tiempo real
- P&L realizado y no realizado
- Tabla de posiciones con precios actuales

### 📋 Historial
- Registro de todas las operaciones
- Estadísticas: total, ganadoras, perdedoras, P&L realizado
- **Exportar a CSV** para análisis externo
- Botón de reset para reiniciar la simulación

### 🎓 Academia (8 lecciones)
1. Velas Japonesas
2. Volumen
3. Medias Móviles
4. RSI – Índice de Fuerza Relativa
5. MACD
6. Watchlist / Lista de seguimiento
7. Gestión de Riesgo (Stop Loss, Take Profit, Regla del 2%)
8. Psicología del Trading

---

## 💹 Acciones Precargadas (10 símbolos)

| Símbolo | Empresa             | Sector      |
|---------|---------------------|-------------|
| AAPL    | Apple Inc.          | Tecnología  |
| MSFT    | Microsoft Corp.     | Tecnología  |
| GOOGL   | Alphabet Inc.       | Tecnología  |
| AMZN    | Amazon.com Inc.     | Consumo     |
| NVDA    | NVIDIA Corp.        | Tecnología  |
| META    | Meta Platforms      | Tecnología  |
| TSLA    | Tesla Inc.          | Automotriz  |
| JPM     | JPMorgan Chase      | Finanzas    |
| JNJ     | Johnson & Johnson   | Salud       |
| KO      | Coca-Cola Co.       | Consumo     |

> ⚠️ Los precios son **simulados y educativos**. No representan datos reales de mercado.

---

## ⌨️ Controles del Gráfico

| Acción                 | Control                      |
|------------------------|------------------------------|
| Zoom in / out          | Rueda del mouse              |
| Navegar en el tiempo   | Clic izquierdo + arrastrar   |
| Ver datos de la vela   | Pasar el mouse               |
| Zoom rápido            | Botones +/−/⊞ en el gráfico |
| Zoom táctil (móvil)    | Pinch (dos dedos)            |

---

## ⚙️ Funcionamiento Sin Servidor

Esta aplicación es **100% estática**: no requiere servidor, backend ni base de datos.

- Los datos de mercado se generan matemáticamente en `data.js` con números pseudoaleatorios deterministas.
- El simulador guarda el progreso automáticamente en `localStorage` del navegador.
- Los precios se actualizan cada 2.5 segundos con una variación simulada.

---

## ⚠️ Aviso Legal

> Esta plataforma es **exclusivamente educativa**. Los datos y precios mostrados son simulados y no representan cotizaciones reales. No constituye asesoría financiera ni recomendación de inversión. Invierte siempre con criterio propio y, si es necesario, con asesoría de un profesional certificado.

---

## 🔧 Requisitos

- Ninguno. Solo un navegador moderno (Chrome, Firefox, Edge, Safari).
- No requiere Node.js, npm ni ninguna herramienta adicional.

---

## 📄 Licencia

MIT – Libre para uso educativo y personal.
