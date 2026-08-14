package com.tradingplatform.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "signals")
@CompoundIndexes({
    @CompoundIndex(name = "signals_symbol_timestamp_idx", def = "{'symbol': 1, 'timestamp': -1}")
})
public class Signal {
    @Id
    private String id;

    private String symbol;
    private LocalDateTime timestamp;

    // Bias Scores
    private double bullishScore;
    private double bearishScore;
    private double neutralScore;
    private String bias; // BULLISH, BEARISH, NEUTRAL

    // Model metrics
    private double confidence; // e.g. 0.72
    private double tradeQualityScore; // 0 to 100
    private String tradeSetupClass; // Excellent setup (80-100), Good setup (65-79), Weak setup (50-64), Avoid (below 50)
    
    // Suggested Contract Selection
    private String suggestedDirection; // CALL SIDE, PUT SIDE, NO TRADE
    private String suggestedContract; // e.g. NIFTY 24500 CE
    private double spotPrice;
    private double strikePrice;
    private String expiryDate;
    private double entryPremium;
    private double delta;
    private double iv;
    private double theta;

    // Risk setup
    private double stopLoss;
    private double target;
    private double riskRewardRatio;
    private int lotSize;
    private int positionSizeUnits;
    private double maxTradeLoss;
    private double expectedProfit;

    // Justification & Evidence
    private List<String> bullishFactors;
    private List<String> bearishFactors;
    private List<String> invalidationCriteria;
    private List<String> warnings;
}
