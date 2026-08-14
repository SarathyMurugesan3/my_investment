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
@Document(collection = "macro_data")
public class MacroData {
    @Id
    private String id;
    
    private LocalDateTime timestamp;

    // Macro indicators
    private double cpi; // Inflation
    private double wpi;
    private double gdpGrowth;
    private double interestRate; // RBI Repo Rate
    private double fedRate; // US Federal Reserve Rate
    private double unemploymentRate;
    private double manufacturingPmi;
    private double crudeOilPrice;
    private double usdInrRate;
    private double bondYield10Y; // US 10Y or India 10Y

    private double macroScore; // -100 to +100
}
