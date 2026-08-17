package com.tradingplatform.service;

import com.tradingplatform.model.News;
import com.tradingplatform.provider.NewsProvider;
import com.tradingplatform.repository.NewsRepository;
import com.tradingplatform.analysis.NewsSentimentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class NewsService {

    @Autowired
    @org.springframework.beans.factory.annotation.Qualifier("realNewsProvider")
    private NewsProvider newsProvider;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private NewsSentimentService sentimentService;

    public List<News> fetchAndAnalyzeNews() {
        List<News> rawNews = newsProvider.getLatestNews();
        
        for (News news : rawNews) {
            Map<String, Object> sentiment = sentimentService.analyzeSentiment(news.getHeadline() + " " + news.getSummary());
            news.setSentiment((String) sentiment.get("sentiment"));
            news.setSentimentScore((Double) sentiment.get("sentimentScore"));
            news.setConfidence((Double) sentiment.get("confidence"));
            news.setMarketImpactScore((Double) sentiment.get("marketImpact"));
            
            newsRepository.save(news);
        }
        return rawNews;
    }

    public List<News> getSavedNews() {
        List<News> saved = newsRepository.findAllByOrderByPublishedAtDesc();
        if (saved.isEmpty()) {
            return fetchAndAnalyzeNews();
        }
        return saved;
    }
}
