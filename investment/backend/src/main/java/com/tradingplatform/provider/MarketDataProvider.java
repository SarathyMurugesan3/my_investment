package com.tradingplatform.provider;

import com.tradingplatform.model.MarketQuote;
import com.tradingplatform.model.Candle;
import com.tradingplatform.model.OptionSnapshot;
import java.time.LocalDateTime;
import java.util.List;

public interface MarketDataProvider {
    MarketQuote getQuote(String symbol);
    List<Candle> getHistoricalData(String symbol, String timeframe, LocalDateTime from, LocalDateTime to);
    OptionSnapshot getOptionChain(String symbol);
}
