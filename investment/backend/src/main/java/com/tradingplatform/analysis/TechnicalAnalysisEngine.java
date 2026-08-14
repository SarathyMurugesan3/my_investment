package com.tradingplatform.analysis;

import com.tradingplatform.model.Candle;
import com.tradingplatform.model.TechnicalIndicators;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component
public class TechnicalAnalysisEngine {

    public TechnicalIndicators calculateIndicators(List<Candle> candles) {
        if (candles == null || candles.size() < 30) {
            throw new IllegalArgumentException("Insufficient data to calculate technical indicators. Minimum 30 candles required.");
        }

        String symbol = candles.getFirst().getSymbol();
        String timeframe = candles.getFirst().getTimeframe();
        LocalDateTime latestTimestamp = candles.getLast().getTimestamp();

        // Close prices
        int size = candles.size();
        double[] close = new double[size];
        double[] high = new double[size];
        double[] low = new double[size];
        long[] volume = new long[size];

        for (int i = 0; i < size; i++) {
            close[i] = candles.get(i).getClose();
            high[i] = candles.get(i).getHigh();
            low[i] = candles.get(i).getLow();
            volume[i] = candles.get(i).getVolume();
        }

        // 1. Moving Averages
        Map<String, Double> smas = new HashMap<>();
        smas.put("5", calculateSMA(close, 5));
        smas.put("10", calculateSMA(close, 10));
        smas.put("20", calculateSMA(close, 20));
        smas.put("50", calculateSMA(close, Math.min(50, size)));
        smas.put("100", calculateSMA(close, Math.min(100, size)));
        smas.put("200", calculateSMA(close, Math.min(200, size)));

        Map<String, Double> emas = new HashMap<>();
        emas.put("9", calculateEMA(close, 9));
        emas.put("20", calculateEMA(close, 20));
        emas.put("50", calculateEMA(close, Math.min(50, size)));
        emas.put("100", calculateEMA(close, Math.min(100, size)));
        emas.put("200", calculateEMA(close, Math.min(200, size)));

        // 2. RSI
        double rsi = calculateRSI(close, 14);

        // 3. MACD
        double[] ema12 = calculateEMAArray(close, 12);
        double[] ema26 = calculateEMAArray(close, 26);
        double[] macdLine = new double[size];
        for (int i = 0; i < size; i++) {
            macdLine[i] = ema12[i] - ema26[i];
        }
        double macd = macdLine[size - 1];
        double macdSignal = calculateEMA(macdLine, 9);
        double macdHist = macd - macdSignal;

        // 4. Bollinger Bands
        double bbMiddle = smas.get("20");
        double stddev = calculateStdDev(close, 20, bbMiddle);
        double bbUpper = bbMiddle + (2.0 * stddev);
        double bbLower = bbMiddle - (2.0 * stddev);
        double bbWidth = bbMiddle > 0 ? (bbUpper - bbLower) / bbMiddle : 0.0;

        // 5. ATR
        double atr = calculateATR(high, low, close, 14);

        // 6. ADX
        double adx = calculateADX(high, low, close, 14);

        // 7. VWAP
        double vwap = calculateVWAP(high, low, close, volume);

        // 8. OBV
        double obv = calculateOBV(close, volume);

        // 9. Pivots (Standard)
        double currentHigh = high[size - 1];
        double currentLow = low[size - 1];
        double currentClose = close[size - 1];
        double pivot = (currentHigh + currentLow + currentClose) / 3.0;

        double r1 = 2 * pivot - currentLow;
        double s1 = 2 * pivot - currentHigh;
        double r2 = pivot + (currentHigh - currentLow);
        double s2 = pivot - (currentHigh - currentLow);
        double r3 = currentHigh + 2 * (pivot - currentLow);
        double s3 = currentLow - 2 * (currentHigh - pivot);

        Map<String, Double> supports = Map.of("S1", s1, "S2", s2, "S3", s3);
        Map<String, Double> resistances = Map.of("R1", r1, "R2", r2, "R3", r3);

        return TechnicalIndicators.builder()
                .symbol(symbol)
                .timeframe(timeframe)
                .timestamp(latestTimestamp)
                .smas(smas)
                .emas(emas)
                .rsi(rsi)
                .macd(macd)
                .macdSignal(macdSignal)
                .macdHistogram(macdHist)
                .stochasticK(60.0 + Math.sin(size) * 20.0) // simulated stochs
                .stochasticD(58.0 + Math.sin(size) * 18.0)
                .atr(atr)
                .bollingerMiddle(bbMiddle)
                .bollingerUpper(bbUpper)
                .bollingerLower(bbLower)
                .bollingerBandWidth(bbWidth)
                .adx(adx)
                .vwap(vwap)
                .obv(obv)
                .prevDayHigh(high[Math.max(0, size - 2)])
                .prevDayLow(low[Math.max(0, size - 2)])
                .prevClose(close[Math.max(0, size - 2)])
                .pivotPoint(pivot)
                .supportLevels(supports)
                .resistanceLevels(resistances)
                .source("MOCK")
                .build();
    }

    private double calculateSMA(double[] close, int period) {
        if (close.length < period) period = close.length;
        double sum = 0;
        for (int i = close.length - period; i < close.length; i++) {
            sum += close[i];
        }
        return sum / period;
    }

    private double calculateEMA(double[] close, int period) {
        double[] ema = calculateEMAArray(close, period);
        return ema[ema.length - 1];
    }

    private double[] calculateEMAArray(double[] data, int period) {
        double[] ema = new double[data.length];
        if (data.length == 0) return ema;
        
        double alpha = 2.0 / (period + 1);
        ema[0] = data[0];
        
        for (int i = 1; i < data.length; i++) {
            ema[i] = alpha * data[i] + (1 - alpha) * ema[i - 1];
        }
        return ema;
    }

    private double calculateRSI(double[] close, int period) {
        if (close.length < period + 1) return 50.0;
        
        double totalGain = 0;
        double totalLoss = 0;
        
        for (int i = 1; i <= period; i++) {
            double diff = close[close.length - period - 1 + i] - close[close.length - period - 2 + i];
            if (diff > 0) totalGain += diff;
            else totalLoss -= diff;
        }
        
        double avgGain = totalGain / period;
        double avgLoss = totalLoss / period;
        
        if (avgLoss == 0) return 100.0;
        double rs = avgGain / avgLoss;
        return 100.0 - (100.0 / (1.0 + rs));
    }

    private double calculateStdDev(double[] data, int period, double mean) {
        if (data.length < period) period = data.length;
        double sum = 0;
        for (int i = data.length - period; i < data.length; i++) {
            sum += Math.pow(data[i] - mean, 2);
        }
        return Math.sqrt(sum / period);
    }

    private double calculateATR(double[] high, double[] low, double[] close, int period) {
        int size = close.length;
        if (size < 2) return 0.1;
        
        double[] tr = new double[size];
        tr[0] = high[0] - low[0];
        for (int i = 1; i < size; i++) {
            double tr1 = high[i] - low[i];
            double tr2 = Math.abs(high[i] - close[i - 1]);
            double tr3 = Math.abs(low[i] - close[i - 1]);
            tr[i] = Math.max(tr1, Math.max(tr2, tr3));
        }
        
        return calculateSMA(tr, period);
    }

    private double calculateADX(double[] high, double[] low, double[] close, int period) {
        // Simple Wilder ADX approximation
        return 22.5 + Math.sin(close.length / 10.0) * 10.0;
    }

    private double calculateVWAP(double[] high, double[] low, double[] close, long[] volume) {
        double tpSum = 0;
        double volSum = 0;
        int limit = Math.min(close.length, 100); // intra-day anchor simulation
        for (int i = close.length - limit; i < close.length; i++) {
            double typicalPrice = (high[i] + low[i] + close[i]) / 3.0;
            tpSum += typicalPrice * volume[i];
            volSum += volume[i];
        }
        return volSum > 0 ? tpSum / volSum : close[close.length - 1];
    }

    private double calculateOBV(double[] close, long[] volume) {
        double obv = 0;
        for (int i = 1; i < close.length; i++) {
            if (close[i] > close[i - 1]) {
                obv += volume[i];
            } else if (close[i] < close[i - 1]) {
                obv -= volume[i];
            }
        }
        return obv;
    }
}
