package com.tradingplatform.repository;

import com.tradingplatform.model.Backtest;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface BacktestRepository extends MongoRepository<Backtest, String> {
    List<Backtest> findByStrategyName(String strategyName);
}
