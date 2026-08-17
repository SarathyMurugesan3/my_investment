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
    @Qualifier("liveMarketDataProvider")
    private MarketDataProvider liveProvider;

    @Autowired
    @Qualifier("growwMarketDataProvider")
    private MarketDataProvider growwProvider;

    @Autowired
    @Qualifier("mockMarketDataProvider")
    private MarketDataProvider mockProvider;

    @Autowired
    private CandleRepository candleRepository;

    @Autowired
    private MarketQuoteRepository marketQuoteRepository;

    @Autowired
    private OptionSnapshotRepository optionSnapshotRepository;

    @Value("${app.market-data.provider:LIVE}")
    private String configuredProvider;

    private MarketDataProvider getActiveProvider() {
        if ("GROWW".equalsIgnoreCase(configuredProvider)) {
            return growwProvider;
        } else if ("MOCK".equalsIgnoreCase(configuredProvider)) {
            return mockProvider;
        }
        return liveProvider;
    }

    public MarketQuote getLatestQuote(String symbol) {
        MarketQuote quote = getActiveProvider().getQuote(symbol);
        try {
            marketQuoteRepository.save(quote);
        } catch (Exception ignored) {}
        return quote;
    }

    public List<Candle> getHistoricalCandles(String symbol, String timeframe, LocalDateTime from, LocalDateTime to) {
        List<Candle> freshCandles = getActiveProvider().getHistoricalData(symbol, timeframe, from, to);
        if (!freshCandles.isEmpty()) {
            try {
                candleRepository.saveAll(freshCandles);
            } catch (Exception ignored) {}
            return freshCandles;
        }

        return candleRepository
                .findBySymbolAndTimeframeAndTimestampBetweenOrderByTimestampAsc(symbol, timeframe, from, to);
    }

    public OptionSnapshot getOptionChain(String symbol) {
        OptionSnapshot snapshot = getActiveProvider().getOptionChain(symbol);
        try {
            optionSnapshotRepository.save(snapshot);
        } catch (Exception ignored) {}
        return snapshot;
    }

    public String getProviderName() {
        return configuredProvider.toUpperCase();
    }
}
