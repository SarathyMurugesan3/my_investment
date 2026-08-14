package com.tradingplatform.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "fundamentals")
public class Fundamentals {
    @Id
    private String id;

    @Indexed(unique = true)
    private String symbol;
    
    private String companyName;
    private String sector;
    private LocalDateTime timestamp;

    // Financial Metrics
    private double revenue;
    private double revenueGrowth; // YoY %
    private double ebitda;
    private double ebitdaMargin;
    private double operatingMargin;
    private double netProfit;
    private double eps;
    private double epsGrowth;
    private double freeCashFlow;
    private double operatingCashFlow;
    private double debt;
    private double debtToEquity;
    private double interestCoverage;
    private double roe;
    private double roce;
    private double currentRatio;
    private double dividendYield;

    // Valuation Metrics
    private double pe;
    private double forwardPe;
    private double pb;
    private double evToEbitda;
    private double peg;
    private double marketCap;

    // Computed Quality Scores (0-100)
    private double qualityScore;
    private double growthScore;
    private double financialHealthScore;
    private double valuationScore;
    private double overallScore;

    // Classifications
    private String classification; // STRONG, GOOD, NEUTRAL, RISKY, AVOID
}
