package com.tradingplatform.repository;

import com.tradingplatform.model.MarketBreadth;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface MarketBreadthRepository extends MongoRepository<MarketBreadth, String> {
    Optional<MarketBreadth> findFirstByOrderByTimestampDesc();
}
