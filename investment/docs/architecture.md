# System Architecture

The platform is designed around a clean layered architecture, allowing modules to be decoupled and interchangeable.

## Structure Overview

```
com.tradingplatform
 ├── config        - Bean instantiation and security filtering
 ├── controller    - Exposes REST endpoints
 ├── service       - Aggregates database state and business flows
 ├── model         - Mapped MongoDB entities (User, Candle, Signal, etc.)
 ├── repository    - MongoRepository interfaces
 ├── security      - Filter chains and JWT token parsers
 ├── scheduler     - Periodic pinger jobs
 ├── provider      - Growth API & Mock service adapters
 └── analysis      - Technical, Option Greeks, Risk, and Signal Engines
```

## Layer Flow

1. **REST Client** (Vite React UI) requests a data node.
2. **Controller Layer** intercepts and routes to appropriate services.
3. **Service Layer** verifies Cache/DB state and triggers **Analysis Engines** if recalculations are needed.
4. **Data Provider interfaces** isolate API dependencies (MOCK or GROWW).
5. **MongoDB layer** persists time-series candles, snapshots, and news feeds.
