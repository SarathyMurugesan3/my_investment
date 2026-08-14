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
@Document(collection = "economic_events")
public class EconomicEvent {
    @Id
    private String id;

    private String event;
    private String country;
    private String category;
    private String expectedValue;
    private String previousValue;
    private String actualValue;
    private String importance; // LOW, MEDIUM, HIGH, CRITICAL
    private LocalDateTime timestamp;
}
