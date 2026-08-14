package com.tradingplatform.repository;

import com.tradingplatform.model.NewsSentiment;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NewsSentimentRepository extends MongoRepository<NewsSentiment, String> {
    List<NewsSentiment> findByNewsId(String newsId);
}
