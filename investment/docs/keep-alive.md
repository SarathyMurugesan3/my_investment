# Keep-Alive Monitoring

Render's free tier web services spin down / sleep after 15 minutes of inactivity. To prevent latency on first user landing:

1. Set `KEEP_ALIVE_ENABLED=true`.
2. Configure `KEEP_ALIVE_URL=https://your-service-name.onrender.com`.
3. The platform schedules a background task that calls its own `/api/health` endpoint every 14 minutes, avoiding sleep states.
4. Alternatively, execute a task scheduler locally or on GitHub Actions using the utility scripts:
   - `scripts/keep-alive.sh`
   - `scripts/keep-alive.ps1`
