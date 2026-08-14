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
@Document(collection = "candles")
@CompoundIndexes({
    @CompoundIndex(name = "symbol_timeframe_timestamp_idx", def = "{'symbol': 1, 'timeframe': 1, 'timestamp': 1}")
})
public class Candle {
    @Id
    private String id;
    
    private String symbol;
    private String timeframe; // e.g., "1m", "5m", "15m", "1h", "daily"
    private LocalDateTime timestamp;
    private double open;
    private double high;
    private double low;
    private double close;
    private long volume;
    private String source; // e.g., "MOCK", "LIVE", "HISTORICAL"
}
