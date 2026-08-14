package com.tradingplatform.controller;

import com.tradingplatform.analysis.BacktestingEngine;
import com.tradingplatform.analysis.OptionsEngine;
import com.tradingplatform.analysis.SignalEngine;
import com.tradingplatform.analysis.TechnicalAnalysisEngine;
import com.tradingplatform.model.*;
import com.tradingplatform.service.MarketDataService;
import com.tradingplatform.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AnalysisController {

    @Autowired
    private MarketDataService marketDataService;

    @Autowired
    private NewsService newsService;

    @Autowired
    private TechnicalAnalysisEngine technicalAnalysisEngine;

    @Autowired
    private OptionsEngine optionsEngine;

    @Autowired
    private SignalEngine signalEngine;

    @Autowired
    private BacktestingEngine backtestingEngine;

    @GetMapping("/technical/{symbol}")
    public ResponseEntity<TechnicalIndicators> getTechnicalIndicators(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "15m") String timeframe) {

        List<Candle> candles = marketDataService.getHistoricalCandles(
                symbol.toUpperCase(), timeframe, LocalDateTime.now().minusDays(5), LocalDateTime.now());
        
        return ResponseEntity.ok(technicalAnalysisEngine.calculateIndicators(candles));
    }

    @GetMapping("/options/{symbol}")
    public ResponseEntity<OptionSnapshot> getOptionChain(@PathVariable String symbol) {
        OptionSnapshot snapshot = marketDataService.getOptionChain(symbol.toUpperCase());
        optionsEngine.analyzeOptionChain(symbol.toUpperCase(), snapshot.getSpotPrice(), snapshot.getContracts());
        return ResponseEntity.ok(snapshot);
    }

    @GetMapping("/signal/{symbol}")
    public ResponseEntity<Signal> getSignal(@PathVariable String symbol) {
        String sym = symbol.toUpperCase();
        TechnicalIndicators technicals = technicalAnalysisEngine.calculateIndicators(
                marketDataService.getHistoricalCandles(sym, "15m", LocalDateTime.now().minusDays(5), LocalDateTime.now()));
        OptionSnapshot options = marketDataService.getOptionChain(sym);
        optionsEngine.analyzeOptionChain(sym, options.getSpotPrice(), options.getContracts());
        
        List<News> news = newsService.getSavedNews();
        double vix = 15.2; // default simulated VIX

        Signal signal = signalEngine.generateSignal(sym, technicals, options, news, vix, 1000000.0);
        return ResponseEntity.ok(signal);
    }

    @GetMapping("/backtest/{strategy}")
    public ResponseEntity<Backtest> runBacktest(
            @PathVariable String strategy,
            @RequestParam String symbol,
            @RequestParam(defaultValue = "15m") String timeframe) {

        List<Candle> candles = marketDataService.getHistoricalCandles(
                symbol.toUpperCase(), timeframe, LocalDateTime.now().minusDays(30), LocalDateTime.now());

        return ResponseEntity.ok(backtestingEngine.runBacktest(strategy, symbol.toUpperCase(), timeframe, candles));
    }
}
