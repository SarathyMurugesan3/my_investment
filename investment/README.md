# Financial Market Analysis and Investment Research Platform

A production-quality full-stack decision-support and analysis platform for Indian financial markets (NIFTY, SENSEX, BANK NIFTY, FINNIFTY) with dual modes: Trading Analysis and Long-Term Investment Analysis.

> [!IMPORTANT]
> **Safety Disclaimer:** Analysis and indices generated are for informational and research purposes. Market predictions are uncertain. Past performance does not guarantee future results. No signal guarantees profit.

---

## Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Axios, React Router, Recharts.
- **Backend:** Java 21, Spring Boot 3, Spring Web, Spring Data MongoDB, WebSocket, Spring Security, JWT.
- **Database:** MongoDB (Supports both local and MongoDB Atlas configuration).

---

## Features

- **Technical Analysis Engine:** Multi-timeframe SMA, EMA, RSI, MACD, Bollinger Bands, ATR, ADX, VWAP, OBV, Pivot points.
- **Option Chain Calculator:** Black-Scholes Greeks (Delta, Gamma, Vega, Theta), PCR calculations, Max Pain writer losses.
- **Sentiment Engine:** NLP rule-based lexical news impact classifier (-1.0 to 1.0) with LLM stubs.
- **No-Trade Protective Lockups:** Blocks signal generation during low liquidity, high VIX (>25), or conflicting metrics.
- **Risk position sizing:** Sized dynamically to limit losses to 1% of virtual capital.
- **Walk-Forward Backtesting:** In-sample and out-of-sample split simulations with brokerage, GST, and STT charges.
- **Simulated Paper Trading:** Portfolio asset valuation, unrealized/realized P&L updates.

---

## Local Setup

### 1. MongoDB Local
Ensure local MongoDB runs on port 27017. Or use the provided docker configuration:
```bash
docker-compose up -d mongodb
```

### 2. Configure Environment Variables
Copy the configuration template:
```bash
cp .env.example .env
```

### 3. Backend Run
Open `backend` directory and start application:
```bash
mvn spring-boot:run
```

### 4. Frontend Run
Open `frontend` directory:
```bash
npm install
npm run dev
```

---

## MongoDB Atlas Production Configuration

To deploy using MongoDB Atlas:
1. Create a database user in Atlas dashboard.
2. Set the `MONGODB_URI` environment variable containing the Atlas connection string in your Render application settings.

For more details, see [Atlas Guide](docs/mongodb-atlas.md).

---

## Blueprints for Render Deployment

The repository includes a `render.yaml` configuration template ready to launch the Spring Boot API service and the React Static SPA.

---

## Keep-Alive / Health Monitoring

To prevent Render's free tier web instances from sleeping, set:
- `KEEP_ALIVE_ENABLED=true`
- `KEEP_ALIVE_URL=https://your-service-name.onrender.com`

This schedules a health ping request every 14 minutes. Alternatively, execute utility scripts:
- `./scripts/keep-alive.sh`
- `.\scripts\keep-alive.ps1`
