# Paper Trading Engine

Simulate live entries, exits, and option positioning securely.

## Features
- **Virtual Portfolios**: Start with a virtual capital pool (e.g. ₹1,000,000).
- **Position Tracking**: Positions are adjusted on simulated execution. Realized vs unrealized P&L are computed.
- **Transaction Cost calculations**: Estimated brokerage fees, stamp duty, STT, and slippage margins are factored in.
- **Safety First**: No trading signals can interact with live order brokers. Live execution is blocked.
