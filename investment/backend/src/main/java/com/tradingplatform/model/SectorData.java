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
@Document(collection = "sector_data")
public class SectorData {
    @Id
    private String id;

    private String sectorName; // Banking, IT, Auto, Pharma, FMCG, Energy, Metals, Realty, Financial Services
    private LocalDateTime timestamp;
    private double changePercent;
    private double relativeStrength; // RS value vs benchmark (NIFTY)
    private long volume;
    private double breadthScore; // Sector specific advance/decline score
    private String momentum; // BULLISH, BEARISH, NEUTRAL
}
