# Groww API Integration

To enable live market pricing and trade routing:

1. Request api permissions and generate credentials with your broker support.
2. Set configuration:
   `MARKET_DATA_PROVIDER=GROWW`
3. Supply credentials via env variables (do not commit to git):
   - `GROWW_API_KEY`
   - `GROWW_API_SECRET`
   - `GROWW_ACCESS_TOKEN`
4. The application boots and handles standard requests through `GrowwMarketDataProvider`. If token validation fails, fallback exceptions are raised safely.
