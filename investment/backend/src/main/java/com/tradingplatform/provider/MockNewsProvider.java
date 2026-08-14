package com.tradingplatform.provider;

import com.tradingplatform.model.News;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class MockNewsProvider implements NewsProvider {

    @Override
    public List<News> getLatestNews() {
        List<News> newsList = new ArrayList<>();

        newsList.add(News.builder()
                .headline("RBI MPC keeps repo rate unchanged at 6.50%; maintains withdrawal of accommodation stance")
                .source("Moneycontrol")
                .url("https://www.moneycontrol.com/news/business/economy")
                .publishedAt(LocalDateTime.now().minusHours(1))
                .summary("The Reserve Bank of India (RBI) Monetary Policy Committee (MPC) kept the benchmark policy rate unchanged at 6.50% with a 5-1 majority decision. Governor Shaktikanta Das highlighted that inflation remains above the 4% target.")
                .relatedCompanies(List.of("NIFTY", "BANK NIFTY"))
                .relatedSectors(List.of("Banking", "Financial Services"))
                .marketRelevance(0.95)
                .sentiment("NEUTRAL")
                .sentimentScore(0.0)
                .confidence(0.9)
                .impact("HIGH")
                .marketImpactScore(0.8)
                .category("RBI")
                .build());

        newsList.add(News.builder()
                .headline("TCS announces Q1 net profit growth of 8.7% YoY; beats street estimates")
                .source("Bloomberg Quint")
                .url("https://www.bloombergquint.com/markets")
                .publishedAt(LocalDateTime.now().minusHours(3))
                .summary("Tata Consultancy Services (TCS) reported a net profit increase of 8.7% year-on-year for the first quarter. Operating margins expanded by 40 bps, driven by strong execution and ramp-up of large deals.")
                .relatedCompanies(List.of("TCS", "INFY"))
                .relatedSectors(List.of("IT"))
                .marketRelevance(0.85)
                .sentiment("POSITIVE")
                .sentimentScore(0.75)
                .confidence(0.95)
                .impact("MEDIUM")
                .marketImpactScore(0.65)
                .category("company results")
                .build());

        newsList.add(News.builder()
                .headline("US Fed hints at potential rate cut in September as inflation cools towards 2% goal")
                .source("Reuters")
                .url("https://www.reuters.com/finance")
                .publishedAt(LocalDateTime.now().minusHours(5))
                .summary("Federal Reserve Chairman Jerome Powell indicated that a rate cut could be on the table for the September meeting if inflation metrics continue their downward trajectory. Markets reacted positively with NASDAQ moving higher.")
                .relatedCompanies(List.of("NIFTY"))
                .relatedSectors(List.of("IT", "Financial Services"))
                .marketRelevance(0.9)
                .sentiment("POSITIVE")
                .sentimentScore(0.6)
                .confidence(0.85)
                .impact("HIGH")
                .marketImpactScore(0.75)
                .category("FED")
                .build());

        newsList.add(News.builder()
                .headline("Geopolitical tensions escalate in Middle East; crude oil spikes above $82 per barrel")
                .source("Reuters")
                .url("https://www.reuters.com/markets")
                .publishedAt(LocalDateTime.now().minusHours(8))
                .summary("Crude oil prices rose by 2.3% following renewed conflicts in the Middle East. Higher fuel costs raise inflation concerns for net-importers like India.")
                .relatedCompanies(List.of("BPCL", "IOC"))
                .relatedSectors(List.of("Energy", "Auto"))
                .marketRelevance(0.8)
                .sentiment("NEGATIVE")
                .sentimentScore(-0.7)
                .confidence(0.88)
                .impact("HIGH")
                .marketImpactScore(0.72)
                .category("crude oil")
                .build());

        return newsList;
    }
}
