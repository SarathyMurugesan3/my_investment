package com.tradingplatform.repository;

import com.tradingplatform.model.Fundamentals;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface FundamentalsRepository extends MongoRepository<Fundamentals, String> {
    Optional<Fundamentals> findBySymbol(String symbol);
}
