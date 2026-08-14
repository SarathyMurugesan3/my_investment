package com.tradingplatform.repository;

import com.tradingplatform.model.SectorData;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface SectorDataRepository extends MongoRepository<SectorData, String> {
    List<SectorData> findByTimestampBetweenOrderByTimestampDesc(java.time.LocalDateTime start, java.time.LocalDateTime end);
}
