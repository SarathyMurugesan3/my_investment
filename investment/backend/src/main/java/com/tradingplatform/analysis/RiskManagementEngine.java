package com.tradingplatform.analysis;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class RiskManagementEngine {

    public Map<String, Object> calculatePositionSize(
            double capital,
            double riskPercent,
            double entryPrice,
            double stopLoss,
            int lotSize) {

        double riskAmount = capital * (riskPercent / 100.0);
        double slDistance = Math.abs(entryPrice - stopLoss);

        int rawUnits = slDistance > 0 ? (int) (riskAmount / slDistance) : 0;
        // Align with lot size
        int lots = lotSize > 0 ? Math.max(1, rawUnits / lotSize) : 1;
        int totalUnits = lots * (lotSize > 0 ? lotSize : 1);

        double maxLoss = totalUnits * slDistance;
        double slippageEst = entryPrice * 0.005; // 0.5% slippage estimation
        double transactionCosts = (entryPrice * totalUnits) * 0.0006; // GST, STT, exchange charges

        Map<String, Object> riskMetrics = new HashMap<>();
        riskMetrics.put("riskAmount", riskAmount);
        riskMetrics.put("suggestedUnits", totalUnits);
        riskMetrics.put("suggestedLots", lots);
        riskMetrics.put("maxLoss", maxLoss + (slippageEst * totalUnits) + transactionCosts);
        riskMetrics.put("slippageEst", slippageEst * totalUnits);
        riskMetrics.put("transactionCosts", transactionCosts);
        
        return riskMetrics;
    }
}
