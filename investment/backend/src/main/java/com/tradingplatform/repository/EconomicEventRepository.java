package com.tradingplatform.repository;

import com.tradingplatform.model.EconomicEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface EconomicEventRepository extends MongoRepository<EconomicEvent, String> {
    List<EconomicEvent> findByTimestampBetweenOrderByTimestampAsc(LocalDateTime start, LocalDateTime end);
}
