# Local MongoDB Setup

The application connects to a local MongoDB instance by default.

## Connection URI
`mongodb://localhost:27017/trading_analysis`

## Verification
You can connect using Mongo Compass or CLI:
```bash
mongosh "mongodb://localhost:27017/trading_analysis"
```

## Running via Docker
If you do not have MongoDB installed on your system, spin it up using Docker:
```bash
docker-compose up -d mongodb
```
This maps port `27017` and mounts state to local volume storage.
