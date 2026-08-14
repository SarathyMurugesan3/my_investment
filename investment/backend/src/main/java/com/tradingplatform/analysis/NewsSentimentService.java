package com.tradingplatform.analysis;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class NewsSentimentService {

    private final Map<String, Double> lexicon = new HashMap<>();

    public NewsSentimentService() {
        // Simple Lexicon dictionary mapping words to sentiment scores
        lexicon.put("beat", 0.6);
        lexicon.put("above", 0.3);
        lexicon.put("growth", 0.5);
        lexicon.put("profit", 0.6);
        lexicon.put("positive", 0.7);
        lexicon.put("rate cut", 0.8);
        lexicon.put("raise", 0.4);
        lexicon.put("bullish", 0.8);
        
        lexicon.put("inflation", -0.4);
        lexicon.put("hike", -0.5);
        lexicon.put("cut", -0.2);
        lexicon.put("escalate", -0.6);
        lexicon.put("negative", -0.7);
        lexicon.put("miss", -0.5);
        lexicon.put("drop", -0.4);
        lexicon.put("bearish", -0.8);
    }

    public Map<String, Object> analyzeSentiment(String text) {
        if (text == null || text.isEmpty()) {
            return Map.of("sentiment", "NEUTRAL", "sentimentScore", 0.0, "confidence", 1.0);
        }

        String lower = text.toLowerCase();
        double scoreSum = 0.0;
        int matches = 0;

        for (Map.Entry<String, Double> entry : lexicon.entrySet()) {
            if (lower.contains(entry.getKey())) {
                scoreSum += entry.getValue();
                matches++;
            }
        }

        double score = matches > 0 ? scoreSum / matches : 0.0;
        String sentiment = "NEUTRAL";
        if (score > 0.15) {
            sentiment = "POSITIVE";
        } else if (score < -0.15) {
            sentiment = "NEGATIVE";
        }

        double confidence = matches > 0 ? Math.min(0.95, 0.5 + (matches * 0.1)) : 0.5;

        Map<String, Object> result = new HashMap<>();
        result.put("sentiment", sentiment);
        result.put("sentimentScore", score);
        result.put("confidence", confidence);
        result.put("marketImpact", Math.min(1.0, Math.abs(score) * 1.2));
        return result;
    }
}
