package com.tradingplatform.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "option_snapshots")
public class OptionSnapshot {
    @Id
    private String id;

    @Indexed
    private String underlying; // e.g. NIFTY
    
    private LocalDateTime timestamp;
    private double spotPrice;
    private double pcr;
    private double oiPcr;
    private double volumePcr;
    private double maxPain;
    private double maxPainStrike;
    private double distanceToSpot;
    private double atmStrike;
    private String source; // MOCK, LIVE, SIMULATED
    
    private List<OptionContract> contracts;
}
