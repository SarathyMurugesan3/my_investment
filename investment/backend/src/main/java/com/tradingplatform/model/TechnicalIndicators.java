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
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "technical_indicators")
@CompoundIndexes({
    @CompoundIndex(name = "tech_symbol_timeframe_timestamp_idx", def = "{'symbol': 1, 'timeframe': 1, 'timestamp': -1}")
})
public class TechnicalIndicators {
    @Id
    private String id;

    private String symbol;
    private String timeframe;
    private LocalDateTime timestamp;

    // Moving Averages
    private Map<String, Double> smas; // e.g. "5", "10", "20", "50", "100", "200"
    private Map<String, Double> emas; // e.g. "9", "20", "50", "100", "200"

    // Momentum
    private double rsi;
    private double macd;
    private double macdSignal;
    private double macdHistogram;
    private double stochasticK;
    private double stochasticD;
    private double roc;
    private double cci;
    private double williamsR;

    // Volatility
    private double atr;
    private double bollingerMiddle;
    private double bollingerUpper;
    private double bollingerLower;
    private double bollingerBandWidth;
    private double historicalVolatility;
    private double vix;

    // Trend strength
    private double adx;
    private double plusDI;
    private double minusDI;

    // Volume
    private double volumeSma;
    private double volumeRatio;
    private double obv;
    private double vwap;
    private double relativeVolume;

    // Price Levels
    private double prevDayHigh;
    private double prevDayLow;
    private double prevClose;
    private double pivotPoint;
    private Map<String, Double> supportLevels; // S1, S2, S3
    private Map<String, Double> resistanceLevels; // R1, R2, R3
    
    private String source; // MOCK, LIVE
}
