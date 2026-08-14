package com.tradingplatform.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "holdings")
public class Holding {
    @Id
    private String id;
    
    private String portfolioId;
    private String symbol;
    private String optionType; // CE, PE, STOCK
    private double strikePrice;
    private String expiry;
    
    private int quantity;
    private double averagePrice;
    private double currentPrice;
    private double investedAmount;
    private double currentMarketValue;
    private double unrealizedPnL;
    private double realizedPnL;
    private double portfolioAllocationPercent;
}
