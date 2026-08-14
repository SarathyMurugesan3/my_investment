# Walk-Forward Backtesting Engine

Evaluate strategy returns using historical prices.

## Strategy Logic
The engine runs backtesting rules (e.g. SMA crossovers, RSI breakouts) across input historical candle blocks.

## In-sample vs Out-of-sample splits
To avoid parameter optimization bias:
- **Train period**: Used to fit thresholds.
- **Validation period**: Used to adjust settings.
- **Test period (Out-of-sample)**: Used for evaluation metrics.

## Key Metrics Computed
- Win rate (%)
- Profit factor
- Expectancy (INR)
- Max Drawdown (%)
- Sharpe and Sortino ratios
