package com.tradingplatform.repository;

import com.tradingplatform.model.MarketQuote;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface MarketQuoteRepository extends MongoRepository<MarketQuote, String> {
    Optional<MarketQuote> findFirstBySymbolOrderByTimestampDesc(String symbol);
    List<MarketQuote> findBySymbolOrderByTimestampDesc(String symbol);
}
