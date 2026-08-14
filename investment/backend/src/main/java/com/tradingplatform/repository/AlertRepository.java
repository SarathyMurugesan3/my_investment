package com.tradingplatform.repository;

import com.tradingplatform.model.Alert;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface AlertRepository extends MongoRepository<Alert, String> {
    List<Alert> findByUserId(String userId);
    List<Alert> findByStatus(String status);
}
