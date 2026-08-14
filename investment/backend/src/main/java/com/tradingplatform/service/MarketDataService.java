package com.tradingplatform.service;

import com.tradingplatform.model.Candle;
import com.tradingplatform.model.MarketQuote;
import com.tradingplatform.model.OptionSnapshot;
import com.tradingplatform.provider.MarketDataProvider;
import com.tradingplatform.repository.CandleRepository;
import com.tradingplatform.repository.MarketQuoteRepository;
import com.tradingplatform.repository.OptionSnapshotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MarketDataService {

    @Autowired
    @Qualifier("mockMarketDataProvider")
    private MarketDataProvider mockProvider;

    @Autowired
    @Qualifier("growwMarketDataProvider")
    private MarketDataProvider growwProvider;

    @Autowired
    private CandleRepository candleRepository;

    @Autowired
    private MarketQuoteRepository marketQuoteRepository;

    @Autowired
    private OptionSnapshotRepository optionSnapshotRepository;

    @Value("${app.market-data.provider:MOCK}")
    private String configuredProvider;

    private MarketDataProvider getActiveProvider() {
        if ("GROWW".equalsIgnoreCase(configuredProvider)) {
            return growwProvider;
        }
        return mockProvider;
    }

    public MarketQuote getLatestQuote(String symbol) {
        MarketQuote quote = getActiveProvider().getQuote(symbol);
        marketQuoteRepository.save(quote);
        return quote;
    }

    public List<Candle> getHistoricalCandles(String symbol, String timeframe, LocalDateTime from, LocalDateTime to) {
        List<Candle> dbCandles = candleRepository
                .findBySymbolAndTimeframeAndTimestampBetweenOrderByTimestampAsc(symbol, timeframe, from, to);
        
        if (!dbCandles.isEmpty()) {
            return dbCandles;
        }

        List<Candle> freshCandles = getActiveProvider().getHistoricalData(symbol, timeframe, from, to);
        if (!freshCandles.isEmpty()) {
            candleRepository.saveAll(freshCandles);
        }
        return freshCandles;
    }

    public OptionSnapshot getOptionChain(String symbol) {
        OptionSnapshot snapshot = getActiveProvider().getOptionChain(symbol);
        optionSnapshotRepository.save(snapshot);
        return snapshot;
    }

    public String getProviderName() {
        return configuredProvider.toUpperCase();
    }
}
