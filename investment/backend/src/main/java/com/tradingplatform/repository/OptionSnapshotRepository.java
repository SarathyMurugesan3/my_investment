package com.tradingplatform.repository;

import com.tradingplatform.model.OptionSnapshot;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface OptionSnapshotRepository extends MongoRepository<OptionSnapshot, String> {
    Optional<OptionSnapshot> findFirstByUnderlyingOrderByTimestampDesc(String underlying);
}
