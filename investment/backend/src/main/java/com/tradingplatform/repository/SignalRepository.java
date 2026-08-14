package com.tradingplatform.repository;

import com.tradingplatform.model.Signal;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface SignalRepository extends MongoRepository<Signal, String> {
    List<Signal> findBySymbolOrderByTimestampDesc(String symbol);
}
