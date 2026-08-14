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
@Document(collection = "market_breadth")
public class MarketBreadth {
    @Id
    private String id;

    private LocalDateTime timestamp;
    private int advances;
    private int declines;
    private int unchanged;
    private double advanceDeclineRatio;
    private double percentageAdvancing;
    private int newHighs;
    private int newLows;
    private double breadthScore; // -100 to +100
}
