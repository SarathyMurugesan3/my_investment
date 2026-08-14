package com.tradingplatform.analysis;

import com.tradingplatform.model.TechnicalIndicators;
import com.tradingplatform.model.OptionSnapshot;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class NoTradeEngine {

    public List<String> evaluateNoTradeConditions(
            TechnicalIndicators technicals,
            OptionSnapshot options,
            double vix,
            double spreadPercent) {
            
        List<String> blockers = new ArrayList<>();

        if (technicals == null || options == null) {
            blockers.add("Insufficient data: Technicals or Option Chain is missing.");
            return blockers;
        }

        // 1. Extreme Volatility check (VIX > 25)
        if (vix > 25.0) {
            blockers.add("No Trade: Extreme volatility detected (India VIX > 25). Risks of premium decay and wild swings are high.");
        }

        // 2. High option spread check
        if (spreadPercent > 5.0) {
            blockers.add("No Trade: Option bid-ask spread is excessively high (" + String.format("%.2f", spreadPercent) + "%). Liquidity is low.");
        }

        // 3. Conflicting RSI and trend check
        double rsi = technicals.getRsi();
        double ema20 = technicals.getEmas().getOrDefault("20", technicals.getPrevClose());
        double close = technicals.getPrevClose();
        
        if (rsi > 70 && close < ema20) {
            blockers.add("No Trade: Trend is bearish but RSI is overbought (Conflicting Signals).");
        } else if (rsi < 30 && close > ema20) {
            blockers.add("No Trade: Trend is bullish but RSI is oversold (Conflicting Signals).");
        }

        return blockers;
    }
}
