package com.tradingplatform.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "portfolios")
public class Portfolio {
    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private String name;
    private double virtualBalance;
    private double initialCapital;
    private double currentEquity;
    private double maxDrawdown;
    private LocalDateTime createdAt;
}
