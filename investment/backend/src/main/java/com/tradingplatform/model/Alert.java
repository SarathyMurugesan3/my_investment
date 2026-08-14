package com.tradingplatform.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "alerts")
public class Alert {
    @Id
    private String id;

    private String userId;
    private String symbol;
    private String alertType; // PRICE_CROSSES, BREAKOUT, BREAKDOWN, RSI_THRESHOLD, EMA_CROSSOVER, VIX_SPIKE
    private double triggerValue;
    private String operator; // GREATER_THAN, LESS_THAN, CROSSES
    private String conditionDetails;
    private String status; // ACTIVE, TRIGGERED, DISABLED
    private LocalDateTime createdAt;
    private LocalDateTime triggeredAt;
}
