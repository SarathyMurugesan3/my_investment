package com.tradingplatform.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "market_quotes")
@CompoundIndexes({
    @CompoundIndex(name = "symbol_timestamp_idx", def = "{'symbol': 1, 'timestamp': -1}")
})
public class MarketQuote {
    @Id
    private String id;

    private String symbol;
    private String exchange; // NSE, BSE
    private LocalDateTime timestamp;
    private double open;
    private double high;
    private double low;
    private double close;
    private double lastTradedPrice;
    private double previousClose;
    private long volume;
    private double tradedValue;
    private double bid;
    private double ask;
    private long bidQuantity;
    private long askQuantity;
    private String marketStatus; // OPEN, CLOSED
    private String source; // MOCK, LIVE, HISTORICAL, DELAYED
}
