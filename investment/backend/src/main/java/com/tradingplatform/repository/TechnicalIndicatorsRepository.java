package com.tradingplatform.repository;

import com.tradingplatform.model.TechnicalIndicators;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface TechnicalIndicatorsRepository extends MongoRepository<TechnicalIndicators, String> {
    Optional<TechnicalIndicators> findFirstBySymbolAndTimeframeOrderByTimestampDesc(String symbol, String timeframe);
}
