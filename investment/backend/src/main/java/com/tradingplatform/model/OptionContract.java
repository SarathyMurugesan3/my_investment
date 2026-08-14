package com.tradingplatform.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "option_contracts")
@CompoundIndexes({
    @CompoundIndex(name = "options_underlying_expiry_strike_idx", def = "{'underlying': 1, 'expiry': 1, 'strike': 1}")
})
public class OptionContract {
    @Id
    private String id;

    private String underlying; // e.g. NIFTY
    private LocalDate expiry;
    private double strike;
    private String type; // CE or PE

    private double lastTradedPrice;
    private double change;
    private long volume;
    private long openInterest;
    private long changeInOpenInterest;
    private double impliedVolatility;

    // Greeks
    private double delta;
    private double gamma;
    private double theta;
    private double vega;
    
    private String source; // MOCK, LIVE
}
