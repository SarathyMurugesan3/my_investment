package com.tradingplatform.analysis;

import com.tradingplatform.model.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class MarketContextEngine {

    public MarketContext calculateContext(
            TechnicalIndicators technicals,
            OptionSnapshot options,
            List<News> recentNews,
            double currentVix) {

        double bullishScore = 0.0;
        double bearishScore = 0.0;
        double neutralScore = 0.0;

        // 1. Technical factors (30%)
        double techBull = 0;
        double techBear = 0;

        double rsi = technicals.getRsi();
        if (rsi > 55) techBull += 2;
        else if (rsi < 45) techBear += 2;

        double macdHist = technicals.getMacdHistogram();
        if (macdHist > 0) techBull += 2;
        else if (macdHist < 0) techBear += 2;

        double close = technicals.getPrevClose();
        double ema20 = technicals.getEmas().getOrDefault("20", close);
        double ema50 = technicals.getEmas().getOrDefault("50", close);

        if (close > ema20) techBull += 2;
        else techBear += 2;

        if (ema20 > ema50) techBull += 2;
        else techBear += 2;

        double techTotal = techBull + techBear;
        if (techTotal > 0) {
            bullishScore += (techBull / techTotal) * 30.0;
            bearishScore += (techBear / techTotal) * 30.0;
        } else {
            neutralScore += 30.0;
        }

        // 2. Options PCR and Max Pain (30%)
        double optionBull = 0;
        double optionBear = 0;

        double pcr = options.getPcr();
        if (pcr > 1.2) {
            optionBull += 3; // bullish buildup
        } else if (pcr < 0.7) {
            optionBear += 3; // bearish buildup
        } else {
            optionBull += 1;
            optionBear += 1;
        }

        double optionTotal = optionBull + optionBear;
        bullishScore += (optionBull / optionTotal) * 30.0;
        bearishScore += (optionBear / optionTotal) * 30.0;

        // 3. News Sentiment (20%)
        double newsScore = 0.0;
        int newsCount = 0;
        for (News n : recentNews) {
            newsScore += n.getSentimentScore();
            newsCount++;
        }
        double avgNewsSentiment = newsCount > 0 ? newsScore / newsCount : 0.0;
        if (avgNewsSentiment > 0.15) {
            bullishScore += 20.0;
        } else if (avgNewsSentiment < -0.15) {
            bearishScore += 20.0;
        } else {
            neutralScore += 20.0;
        }

        // 4. Volatility / India VIX (20%)
        // High VIX increases bearish bias and risk
        if (currentVix > 18) {
            bearishScore += 10.0;
            neutralScore += 10.0;
        } else {
            bullishScore += 10.0;
            neutralScore += 10.0;
        }

        // Normalize
        double total = bullishScore + bearishScore + neutralScore;
        if (total > 0) {
            bullishScore = (bullishScore / total) * 100.0;
            bearishScore = (bearishScore / total) * 100.0;
            neutralScore = (neutralScore / total) * 100.0;
        }

        // Determine Market Regime
        String regime = "Range";
        if (technicals.getEmas().getOrDefault("20", close) > technicals.getEmas().getOrDefault("50", close) && rsi > 55) {
            regime = currentVix > 18 ? "High Volatility Bull" : "Strong Bull";
        } else if (technicals.getEmas().getOrDefault("20", close) < technicals.getEmas().getOrDefault("50", close) && rsi < 45) {
            regime = currentVix > 18 ? "Strong Bear" : "Bear";
        }

        String volatilityLevel = currentVix > 18 ? "HIGH" : (currentVix < 12 ? "LOW" : "MEDIUM");
        String riskLevel = currentVix > 20 || avgNewsSentiment < -0.3 ? "HIGH" : "MEDIUM";

        return MarketContext.builder()
                .timestamp(LocalDateTime.now())
                .bullishScore(bullishScore)
                .bearishScore(bearishScore)
                .neutralScore(neutralScore)
                .marketRegime(regime)
                .volatilityLevel(volatilityLevel)
                .riskLevel(riskLevel)
                .build();
    }

    @lombok.Data
    @lombok.Builder
    public static class MarketContext {
        private LocalDateTime timestamp;
        private double bullishScore;
        private double bearishScore;
        private double neutralScore;
        private String marketRegime;
        private String volatilityLevel;
        private String riskLevel;
    }
}
