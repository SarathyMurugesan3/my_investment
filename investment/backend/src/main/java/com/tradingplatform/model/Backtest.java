package com.tradingplatform.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "backtests")
public class Backtest {
    @Id
    private String id;
    
    private String strategyName;
    private String symbol;
    private String timeframe;
    private LocalDateTime runTime;
    
    // Period details
    private String trainPeriodStart;
    private String trainPeriodEnd;
    private String testPeriodStart;
    private String testPeriodEnd;

    // Simulation settings
    private double initialCapital;
    private Map<String, Double> costSettings; // Brokerage, STT, exchange charges, slippage
    
    // Strategy Performance Metrics
    private int totalTrades;
    private int winningTrades;
    private int losingTrades;
    private double winRate;
    private double averageWin;
    private double averageLoss;
    private double profitFactor;
    private double expectancy;
    private double maxDrawdown;
    private double sharpeRatio;
    private double sortinoRatio;
    private double cagr;
    private double averageHoldingPeriodMinutes;
    private int longestWinningStreak;
    private int longestLosingStreak;
}
