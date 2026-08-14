package com.tradingplatform.repository;

import com.tradingplatform.model.Portfolio;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface PortfolioRepository extends MongoRepository<Portfolio, String> {
    Optional<Portfolio> findByUserId(String userId);
}
