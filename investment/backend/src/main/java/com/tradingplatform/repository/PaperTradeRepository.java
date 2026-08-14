package com.tradingplatform.repository;

import com.tradingplatform.model.PaperTrade;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PaperTradeRepository extends MongoRepository<PaperTrade, String> {
    List<PaperTrade> findByPortfolioId(String portfolioId);
    List<PaperTrade> findByPortfolioIdAndStatus(String portfolioId, String status);
}
