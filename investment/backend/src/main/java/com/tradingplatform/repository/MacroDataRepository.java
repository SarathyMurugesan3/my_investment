package com.tradingplatform.repository;

import com.tradingplatform.model.MacroData;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface MacroDataRepository extends MongoRepository<MacroData, String> {
    Optional<MacroData> findFirstByOrderByTimestampDesc();
}
