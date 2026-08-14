package com.tradingplatform.repository;

import com.tradingplatform.model.Holding;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface HoldingRepository extends MongoRepository<Holding, String> {
    List<Holding> findByPortfolioId(String portfolioId);
    Optional<Holding> findByPortfolioIdAndSymbolAndOptionTypeAndStrikePriceAndExpiry(
            String portfolioId, String symbol, String optionType, double strikePrice, String expiry);
}
