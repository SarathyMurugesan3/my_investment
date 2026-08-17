package com.tradingplatform.controller;

import com.tradingplatform.analysis.BacktestingEngine;
import com.tradingplatform.analysis.OptionsEngine;
import com.tradingplatform.analysis.SignalEngine;
import com.tradingplatform.analysis.TechnicalAnalysisEngine;
import com.tradingplatform.model.*;
import com.tradingplatform.service.MarketDataService;
import com.tradingplatform.service.NewsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AnalysisController {

    private static final Logger log = LoggerFactory.getLogger(AnalysisController.class);

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
        try {
            List<Candle> candles = marketDataService.getHistoricalCandles(
                    symbol.toUpperCase(), timeframe,
                    LocalDateTime.now().minusDays(5), LocalDateTime.now());
            return ResponseEntity.ok(technicalAnalysisEngine.calculateIndicators(candles));
        } catch (Exception e) {
            log.error("Error calculating technical indicators for {}: {}", symbol, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/options/{symbol}")
    public ResponseEntity<OptionSnapshot> getOptionChain(@PathVariable String symbol) {
        try {
            OptionSnapshot snapshot = marketDataService.getOptionChain(symbol.toUpperCase());
            OptionSnapshot analyzed = optionsEngine.analyzeOptionChain(
                    symbol.toUpperCase(), snapshot.getSpotPrice(), snapshot.getContracts());
            return ResponseEntity.ok(analyzed);
        } catch (Exception e) {
            log.error("Error fetching option chain for {}: {}", symbol, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/signal/{symbol}")
    public ResponseEntity<Signal> getSignal(@PathVariable String symbol) {
        try {
            String sym = symbol.toUpperCase();

            List<Candle> candles = marketDataService.getHistoricalCandles(
                    sym, "15m", LocalDateTime.now().minusDays(5), LocalDateTime.now());
            TechnicalIndicators technicals = technicalAnalysisEngine.calculateIndicators(candles);

            OptionSnapshot rawOptions = marketDataService.getOptionChain(sym);
            OptionSnapshot options = optionsEngine.analyzeOptionChain(
                    sym, rawOptions.getSpotPrice(), rawOptions.getContracts());

            List<News> news = newsService.getSavedNews();
            double vix = 15.2;

            Signal signal = signalEngine.generateSignal(sym, technicals, options, news, vix, 1000000.0);
            return ResponseEntity.ok(signal);
        } catch (Exception e) {
            log.error("Error generating signal for {}: {}", symbol, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/backtest/{strategy}")
    public ResponseEntity<Backtest> runBacktest(
            @PathVariable String strategy,
            @RequestParam String symbol,
            @RequestParam(defaultValue = "15m") String timeframe) {
        try {
            List<Candle> candles = marketDataService.getHistoricalCandles(
                    symbol.toUpperCase(), timeframe,
                    LocalDateTime.now().minusDays(30), LocalDateTime.now());
            return ResponseEntity.ok(backtestingEngine.runBacktest(
                    strategy, symbol.toUpperCase(), timeframe, candles));
        } catch (Exception e) {
            log.error("Error running backtest {}: {}", strategy, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
