package com.tradingplatform.repository;

import com.tradingplatform.model.News;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NewsRepository extends MongoRepository<News, String> {
    List<News> findAllByOrderByPublishedAtDesc();
    List<News> findByRelatedCompaniesContainingOrderByPublishedAtDesc(String company);
    List<News> findByRelatedSectorsContainingOrderByPublishedAtDesc(String sector);
}
