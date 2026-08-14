package com.tradingplatform.repository;

import com.tradingplatform.model.Candle;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface CandleRepository extends MongoRepository<Candle, String> {
    List<Candle> findBySymbolAndTimeframeAndTimestampBetweenOrderByTimestampAsc(
            String symbol, String timeframe, LocalDateTime start, LocalDateTime end);
            
    List<Candle> findFirstBySymbolAndTimeframeOrderByTimestampDesc(String symbol, String timeframe);
}
