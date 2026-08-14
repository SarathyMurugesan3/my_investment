package com.tradingplatform.analysis;

import com.tradingplatform.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class SignalEngine {

    @Autowired
    private NoTradeEngine noTradeEngine;

    @Autowired
    private RiskManagementEngine riskManagementEngine;

    public Signal generateSignal(
            String symbol,
            TechnicalIndicators technicals,
            OptionSnapshot options,
            List<News> news,
            double vix,
            double availableCapital) {

        // 1. Check No-Trade conditions
        double spreadPercent = 1.5; // default simulated spread
        List<String> blockers = noTradeEngine.evaluateNoTradeConditions(technicals, options, vix, spreadPercent);

        // Derive bias score from technicals, options, and news
        double rsi = technicals.getRsi();
        double close = technicals.getPrevClose();
        double ema20 = technicals.getEmas().getOrDefault("20", close);

        double bullWeight = 0;
        double bearWeight = 0;
        List<String> bullFactors = new ArrayList<>();
        List<String> bearFactors = new ArrayList<>();

        if (rsi > 50) {
            bullWeight += 2;
            bullFactors.add("RSI in bullish territory (>50): " + String.format("%.2f", rsi));
        } else {
            bearWeight += 2;
            bearFactors.add("RSI in bearish territory (<50): " + String.format("%.2f", rsi));
        }

        if (close > ema20) {
            bullWeight += 3;
            bullFactors.add("Price above EMA20");
        } else {
            bearWeight += 3;
            bearFactors.add("Price below EMA20");
        }

        if (options.getPcr() > 1.0) {
            bullWeight += 2;
            bullFactors.add("Bullish option positioning (PCR > 1.0): " + String.format("%.2f", options.getPcr()));
        } else {
            bearWeight += 2;
            bearFactors.add("Bearish option positioning (PCR < 1.0): " + String.format("%.2f", options.getPcr()));
        }

        double total = bullWeight + bearWeight;
        double bullishScore = (bullWeight / total) * 100.0;
        double bearishScore = (bearWeight / total) * 100.0;
        double neutralScore = 0.0;

        String bias = "NEUTRAL";
        if (bullishScore > 60) {
            bias = "BULLISH";
        } else if (bearishScore > 60) {
            bias = "BEARISH";
        }

        String suggestedDirection = "NO TRADE";
        OptionContract targetContract = null;

        if (blockers.isEmpty()) {
            if (bias.equals("BULLISH")) {
                suggestedDirection = "CALL SIDE";
                // Select ATM CE
                targetContract = options.getContracts().stream()
                        .filter(c -> c.getType().equals("CE") && c.getStrike() >= options.getAtmStrike())
                        .findFirst().orElse(null);
            } else if (bias.equals("BEARISH")) {
                suggestedDirection = "PUT SIDE";
                // Select ATM PE
                targetContract = options.getContracts().stream()
                        .filter(c -> c.getType().equals("PE") && c.getStrike() <= options.getAtmStrike())
                        .findFirst().orElse(null);
            }
        } else {
            suggestedDirection = "NO TRADE";
        }

        Signal.SignalBuilder builder = Signal.builder()
                .symbol(symbol)
                .timestamp(LocalDateTime.now())
                .bullishScore(bullishScore)
                .bearishScore(bearishScore)
                .neutralScore(neutralScore)
                .bias(bias)
                .confidence(Math.max(bullishScore, bearishScore) / 100.0)
                .tradeQualityScore(blockers.isEmpty() ? 78.0 : 35.0)
                .tradeSetupClass(blockers.isEmpty() ? "Good setup" : "Avoid")
                .suggestedDirection(suggestedDirection)
                .spotPrice(close)
                .bullishFactors(bullFactors)
                .bearishFactors(bearFactors)
                .warnings(blockers);

        if (targetContract != null) {
            double premium = targetContract.getLastTradedPrice();
            double atr = technicals.getAtr();
            if (atr <= 0) atr = close * 0.01; // fallback 1% ATR
            
            double stopLoss = bias.equals("BULLISH") ? premium - (atr * 0.5) : premium - (atr * 0.5);
            if (stopLoss < 0) stopLoss = premium * 0.5; // fallback stop loss
            double target = premium + (atr * 1.0); // 1:2 Risk reward

            Map<String, Object> risk = riskManagementEngine.calculatePositionSize(
                    availableCapital, 1.0, premium, stopLoss, 50);

            builder.suggestedContract(targetContract.getUnderlying() + " " + targetContract.getStrike() + " " + targetContract.getType())
                    .strikePrice(targetContract.getStrike())
                    .entryPremium(premium)
                    .delta(targetContract.getDelta())
                    .iv(targetContract.getImpliedVolatility())
                    .theta(targetContract.getTheta())
                    .stopLoss(stopLoss)
                    .target(target)
                    .riskRewardRatio(2.0)
                    .lotSize(50)
                    .positionSizeUnits((int) risk.get("suggestedUnits"))
                    .maxTradeLoss((double) risk.get("maxLoss"))
                    .expectedProfit((double) risk.get("suggestedUnits") * (target - premium))
                    .invalidationCriteria(List.of("NIFTY spots reverse crosses EMA20."));
        }

        return builder.build();
    }
}
