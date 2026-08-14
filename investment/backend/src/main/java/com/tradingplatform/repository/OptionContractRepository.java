package com.tradingplatform.repository;

import com.tradingplatform.model.OptionContract;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDate;
import java.util.List;

public interface OptionContractRepository extends MongoRepository<OptionContract, String> {
    List<OptionContract> findByUnderlyingAndExpiry(String underlying, LocalDate expiry);
    List<OptionContract> findByUnderlyingAndExpiryAndStrike(String underlying, LocalDate expiry, double strike);
}
