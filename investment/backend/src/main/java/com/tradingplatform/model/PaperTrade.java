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
@Document(collection = "paper_trades")
public class PaperTrade {
    @Id
    private String id;
    
    private String portfolioId;
    private String symbol;
    private String optionType; // CE, PE, STOCK
    private double strikePrice;
    private String expiry;
    private String direction; // BUY, SELL
    private int quantity;
    private double entryPrice;
    private double exitPrice;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private String status; // OPEN, CLOSED
    private double stopLoss;
    private double target;
    
    // Cost and P&L details
    private double grossPnL;
    private double transactionCosts;
    private double netPnL;
}
